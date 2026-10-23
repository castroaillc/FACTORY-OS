import type { Metadata } from "next"

import { AgentSettingsForm } from "@/components/agents/agent-settings-form"
import { AgentsForbidden } from "@/components/agents/agents-notice"
import { getAgentSession } from "@/lib/agents/server"
import { createAgent } from "../actions"

export const metadata: Metadata = { title: "New agent" }

export default async function NewAgentPage() {
  const { allowed } = await getAgentSession()
  if (!allowed) return <AgentsForbidden />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New agent</h1>
        <p className="text-sm text-muted-foreground">
          Set up an SDL team. You can change everything later.
        </p>
      </div>
      <AgentSettingsForm
        action={createAgent}
        submitLabel="Create agent"
        cancelHref="/dashboard/agents"
      />
    </div>
  )
}
