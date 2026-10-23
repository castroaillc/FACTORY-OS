import { GitBranch, Settings } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { AgentChat } from "@/components/agents/agent-chat"
import {
  AgentServerOffline,
  AgentsForbidden,
} from "@/components/agents/agents-notice"
import { getAgent } from "@/lib/agents/get-agent"
import { agentsApiUrl, getAgentSession } from "@/lib/agents/server"
import type { AgentConfigurable } from "@/lib/agents/settings"

type Props = { params: Promise<{ assistantId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agent = await getAgent((await params).assistantId)
  return { title: agent && agent !== "offline" ? agent.name : "Agent" }
}

export default async function AgentChatPage({ params }: Props) {
  const { allowed } = await getAgentSession()
  if (!allowed) return <AgentsForbidden />

  const { assistantId } = await params
  const agent = await getAgent(assistantId)
  if (agent === "offline") return <AgentServerOffline url={agentsApiUrl} />
  if (!agent) notFound()

  const settings = (agent.config.configurable ??
    {}) as Partial<AgentConfigurable>

  return (
    // Fill the viewport below the shell header (4rem) and padding (2rem)
    <div className="flex h-[calc(100svh-6rem)] min-h-[32rem] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-xl font-semibold">{agent.name}</h1>
          <Badge variant="secondary">
            <GitBranch />
            {settings.githubRepo || "server default repo"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/dashboard/agents/${assistantId}/settings`} />}
          nativeButton={false}
        >
          <Settings />
          Configure
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {/* useSearchParams (thread id) needs a Suspense boundary */}
        <Suspense>
          <AgentChat assistantId={assistantId} />
        </Suspense>
      </div>
    </div>
  )
}
