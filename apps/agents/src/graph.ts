// Entry point for `langgraphjs dev` / LangGraph Studio / LangGraph Platform.
// The server provides its own checkpointer, which human-in-the-loop requires.
import { ensureWorkspace } from "./git.js"
import { createSdlTeam } from "./team.js"

await ensureWorkspace()

export const graph = createSdlTeam()
