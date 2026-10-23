import type { NextRequest } from "next/server"

import { auth } from "@/lib/auth"
import { agentsApiUrl, canUseAgents } from "@/lib/agents/server"

// Only the endpoints the dashboard needs; e.g. the store and crons stay private
const ALLOWED_PATH = /^(assistants|threads|runs|info|ok)(\/|$)/
const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "last-event-id"]
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "content-location",
  "x-pagination-total",
  "x-pagination-next",
]

type Context = { params: Promise<{ path: string[] }> }

async function proxy(request: NextRequest, { params }: Context) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (!canUseAgents(session.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const path = (await params).path.join("/")
  if (!ALLOWED_PATH.test(path)) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(`${agentsApiUrl}/${path}`)
  url.search = request.nextUrl.search

  const headers = new Headers()
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (process.env.LANGGRAPH_API_KEY) {
    headers.set("x-api-key", process.env.LANGGRAPH_API_KEY)
  }

  const hasBody = !["GET", "HEAD"].includes(request.method)
  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      signal: request.signal,
      // Required by Node's fetch when streaming a request body
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit)
  } catch {
    return Response.json(
      { error: `Agent server unreachable at ${agentsApiUrl}` },
      { status: 502 }
    )
  }

  const responseHeaders = new Headers()
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }

  // Stream through as-is (server-sent events for runs)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
}
