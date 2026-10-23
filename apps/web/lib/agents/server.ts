import "server-only"

import { Client } from "@langchain/langgraph-sdk"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export const AGENT_GRAPH_ID = "sdl_team"

// The agent server (apps/agents) is only reached from the server; the browser
// talks to /api/agents, which checks the session first.
export const agentsApiUrl = (
  process.env.LANGGRAPH_API_URL ?? "http://localhost:2024"
).replace(/\/$/, "")

export function agentsClient() {
  return new Client({
    apiUrl: agentsApiUrl,
    apiKey: process.env.LANGGRAPH_API_KEY || undefined,
  })
}

type SessionUser = { email: string; emailVerified: boolean }

/**
 * Agents can push code with the server's GitHub token, so only allow-listed
 * users may use them. In production the email must also be verified, so nobody
 * can claim an admin's address by signing up with it first.
 */
export function canUseAgents(user: SessionUser) {
  const admins = (process.env.AGENTS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (process.env.NODE_ENV !== "production") {
    return admins.length === 0 || admins.includes(user.email.toLowerCase())
  }
  return user.emailVerified && admins.includes(user.email.toLowerCase())
}

export async function getAgentSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?callbackURL=/dashboard/agents")
  return { session, allowed: canUseAgents(session.user) }
}

/** For server actions: throws instead of rendering. */
export async function requireAgentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !canUseAgents(session.user)) {
    throw new Error("You don't have access to agents")
  }
  return session
}
