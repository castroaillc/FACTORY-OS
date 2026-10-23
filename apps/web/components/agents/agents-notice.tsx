import { Lock, ServerOff } from "lucide-react"

export function AgentsForbidden() {
  return (
    <Notice
      icon={<Lock className="size-5" />}
      title="You don't have access to agents"
      body="Agents can push code to GitHub, so access is limited to the emails in AGENTS_ADMIN_EMAILS (verified emails only in production)."
    />
  )
}

export function AgentServerOffline({ url }: { url: string }) {
  return (
    <Notice
      icon={<ServerOff className="size-5" />}
      title="Agent server is not reachable"
      body={`The dashboard couldn't reach the agent server at ${url}. Start it locally with \`pnpm --filter agents studio\`, or set LANGGRAPH_API_URL (and LANGGRAPH_API_KEY for a LangSmith deployment).`}
    />
  )
}

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
