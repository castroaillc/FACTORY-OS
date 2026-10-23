"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  AGENT_GRAPH_ID,
  agentsClient,
  requireAgentAdmin,
} from "@/lib/agents/server"
import { agentFormSchema, toConfigurable } from "@/lib/agents/settings"

export type AgentFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  // Echoed back so the form keeps what was typed (React resets it after an action)
  values?: Record<string, string>
}

function parseForm(formData: FormData) {
  const values = Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
  return { values, parsed: agentFormSchema.safeParse(values) }
}

export async function createAgent(
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const session = await requireAgentAdmin()
  const { values, parsed } = parseForm(formData)
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  let assistantId: string
  try {
    const assistant = await agentsClient().assistants.create({
      graphId: AGENT_GRAPH_ID,
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      config: { configurable: toConfigurable(parsed.data) },
      metadata: { created_by: session.user.email },
    })
    assistantId = assistant.assistant_id
  } catch (error) {
    return {
      values,
      error: `Could not create the agent: ${(error as Error).message}`,
    }
  }

  revalidatePath("/dashboard/agents")
  redirect(`/dashboard/agents/${assistantId}`)
}

export async function updateAgent(
  assistantId: string,
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  await requireAgentAdmin()
  const { values, parsed } = parseForm(formData)
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    // Creates a new assistant version; threads keep working
    await agentsClient().assistants.update(assistantId, {
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      config: { configurable: toConfigurable(parsed.data) },
    })
  } catch (error) {
    return {
      values,
      error: `Could not save the agent: ${(error as Error).message}`,
    }
  }

  revalidatePath("/dashboard/agents")
  redirect(`/dashboard/agents/${assistantId}`)
}

export async function deleteAgent(assistantId: string) {
  await requireAgentAdmin()
  await agentsClient().assistants.delete(assistantId)
  revalidatePath("/dashboard/agents")
  redirect("/dashboard/agents")
}
