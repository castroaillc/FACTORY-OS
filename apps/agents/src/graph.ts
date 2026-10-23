// Entry point for `langgraphjs dev` / LangGraph Studio / LangGraph Platform.
// The server provides its own checkpointer, which human-in-the-loop requires.
// The LangSmith sandbox is created lazily on the first tool call and shared by
// every thread in this server process.
import { createSdlTeam } from "./team.js"

export const graph = createSdlTeam()
