import "server-only"

import type { Assistant } from "@langchain/langgraph-sdk"
import { cache } from "react"

import { AGENT_GRAPH_ID, agentsClient } from "@/lib/agents/server"

/** The assistant, `null` if it doesn't exist, or "offline" if the server is down. */
export const getAgent = cache(
  async (assistantId: string): Promise<Assistant | null | "offline"> => {
    try {
      const assistant = await agentsClient().assistants.get(assistantId)
      return assistant.graph_id === AGENT_GRAPH_ID ? assistant : null
    } catch (error) {
      const status = (error as { status?: number }).status
      if (status === 404 || status === 422) return null
      return "offline"
    }
  }
)
