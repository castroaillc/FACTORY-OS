import type { Message } from "@langchain/langgraph-sdk"

export type Todo = {
  content: string
  status: "pending" | "in_progress" | "completed"
}

export type AgentState = {
  messages: Message[]
  todos?: Todo[]
}

// Shape of LangChain's human-in-the-loop middleware interrupts
export type ActionRequest = {
  name: string
  args: Record<string, unknown>
  description?: string
}
export type DecisionType = "approve" | "edit" | "reject" | "respond"
export type HITLRequest = {
  actionRequests: ActionRequest[]
  reviewConfigs: { actionName: string; allowedDecisions: DecisionType[] }[]
}
export type Decision =
  | { type: "approve" }
  | { type: "reject"; message?: string }
  | {
      type: "edit"
      editedAction: { name: string; args: Record<string, unknown> }
    }

export function isHITLRequest(value: unknown): value is HITLRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as HITLRequest).actionRequests)
  )
}

export function messageText(content: Message["content"]): string {
  if (typeof content === "string") return content
  return content
    .map((part) =>
      part.type === "text" && "text" in part ? String(part.text) : ""
    )
    .join("")
}

export function threadTitle(messages: Message[] | undefined) {
  const first = messages?.find((m) => m.type === "human")
  const text = first ? messageText(first.content).trim() : ""
  return text ? text.slice(0, 80) : "New conversation"
}
