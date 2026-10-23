import type { Assistant } from "@langchain/langgraph-sdk"
import { Bot, GitBranch, MessageSquare, Plus, Settings } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  AgentServerOffline,
  AgentsForbidden,
} from "@/components/agents/agents-notice"
import {
  AGENT_GRAPH_ID,
  agentsApiUrl,
  agentsClient,
  getAgentSession,
} from "@/lib/agents/server"
import type { AgentConfigurable } from "@/lib/agents/settings"

export const metadata: Metadata = { title: "Agents" }

export default async function AgentsPage() {
  const { allowed } = await getAgentSession()
  if (!allowed) return <AgentsForbidden />

  let assistants: Assistant[]
  try {
    assistants = await agentsClient().assistants.search({
      graphId: AGENT_GRAPH_ID,
      limit: 100,
      sortBy: "updated_at",
      sortOrder: "desc",
    })
  } catch {
    return <AgentServerOffline url={agentsApiUrl} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-muted-foreground">
            SDL teams that plan, build, test and open pull requests.
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/agents/new" />}
          nativeButton={false}
        >
          <Plus />
          New agent
        </Button>
      </div>

      {assistants.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Bot className="size-8 text-muted-foreground" />
          <p className="font-medium">No agents yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create an agent to choose its repository, models and instructions,
            then chat with it to ship changes.
          </p>
          <Button
            className="mt-2"
            render={<Link href="/dashboard/agents/new" />}
            nativeButton={false}
          >
            Create your first agent
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assistants.map((assistant) => (
            <AgentCard key={assistant.assistant_id} assistant={assistant} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCard({ assistant }: { assistant: Assistant }) {
  const settings = (assistant.config.configurable ??
    {}) as Partial<AgentConfigurable>
  const href = `/dashboard/agents/${assistant.assistant_id}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <Link href={href} className="hover:underline">
            {assistant.name}
          </Link>
        </CardTitle>
        {assistant.description && (
          <CardDescription className="line-clamp-2">
            {assistant.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          <GitBranch />
          {settings.githubRepo || "Server default repo"}
          {settings.baseBranch ? ` → ${settings.baseBranch}` : ""}
        </Badge>
        <Badge variant="outline">
          {settings.orchestratorModel || "Default lead model"}
        </Badge>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" render={<Link href={href} />} nativeButton={false}>
          <MessageSquare />
          Chat
        </Button>
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`${href}/settings`} />}
          nativeButton={false}
        >
          <Settings />
          Configure
        </Button>
      </CardFooter>
    </Card>
  )
}
