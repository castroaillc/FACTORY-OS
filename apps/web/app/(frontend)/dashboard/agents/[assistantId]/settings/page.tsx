import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AgentSettingsForm } from "@/components/agents/agent-settings-form"
import {
  AgentServerOffline,
  AgentsForbidden,
} from "@/components/agents/agents-notice"
import { DeleteAgentButton } from "@/components/agents/delete-agent-button"
import { getAgent } from "@/lib/agents/get-agent"
import { agentsApiUrl, getAgentSession } from "@/lib/agents/server"
import type { AgentConfigurable } from "@/lib/agents/settings"
import { deleteAgent, updateAgent } from "../../actions"

export const metadata: Metadata = { title: "Configure agent" }

type Props = { params: Promise<{ assistantId: string }> }

export default async function AgentSettingsPage({ params }: Props) {
  const { allowed } = await getAgentSession()
  if (!allowed) return <AgentsForbidden />

  const { assistantId } = await params
  const result = await getAgent(assistantId)
  if (result === "offline") return <AgentServerOffline url={agentsApiUrl} />
  if (!result) notFound()

  const settings = (result.config.configurable ??
    {}) as Partial<AgentConfigurable>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Configure {result.name}</h1>
          <p className="text-sm text-muted-foreground">
            Changes apply to new runs. Each save creates a new assistant
            version.
          </p>
        </div>
        <DeleteAgentButton
          name={result.name}
          action={deleteAgent.bind(null, assistantId)}
        />
      </div>
      <AgentSettingsForm
        action={updateAgent.bind(null, assistantId)}
        defaults={{
          name: result.name,
          description: result.description ?? "",
          ...settings,
        }}
        submitLabel="Save changes"
        cancelHref={`/dashboard/agents/${assistantId}`}
      />
    </div>
  )
}
