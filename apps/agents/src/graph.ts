// Entry point for `langgraphjs dev` / LangGraph Studio / LangGraph Platform.
//
// Exported as a factory so every assistant (created from the dashboard) can
// configure its own team through `config.configurable`; see settings.ts.
// The server provides the checkpointer, which human-in-the-loop requires.
import type { LangGraphRunnableConfig } from "@langchain/langgraph"

import { resolveSettings } from "./settings.js"
import { createSdlTeam } from "./team.js"

export const graph = (config: LangGraphRunnableConfig) =>
  createSdlTeam(resolveSettings(config.configurable))
