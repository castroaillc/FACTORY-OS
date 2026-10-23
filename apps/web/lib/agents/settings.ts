import { z } from "zod"

// Mirrors apps/agents/src/settings.ts. Stored as the assistant's
// config.configurable; empty values fall back to the agent server's env.
export const MODEL_SUGGESTIONS = [
  "anthropic:claude-opus-5-5",
  "anthropic:claude-sonnet-5-5",
  "anthropic:claude-haiku-5-5",
  "openai:gpt-5",
  "openai:gpt-5-mini",
]

const optional = (schema: z.ZodString) =>
  z.union([z.literal(""), schema]).default("")

export const agentFormSchema = z.object({
  name: z.string().trim().min(2, "Give the agent a name").max(80),
  description: z.string().trim().max(280).default(""),
  githubRepo: optional(
    z
      .string()
      .trim()
      .regex(/^[\w.-]+\/[\w.-]+$/, "Use the owner/name format")
  ),
  baseBranch: optional(
    z
      .string()
      .trim()
      .regex(/^\w[\w./-]*$/, "Not a valid branch name")
  ),
  orchestratorModel: optional(
    z
      .string()
      .trim()
      .regex(/^[a-z][\w-]*:[\w.:/-]+$/, 'Use "provider:model"')
  ),
  subagentModel: optional(
    z
      .string()
      .trim()
      .regex(/^[a-z][\w-]*:[\w.:/-]+$/, 'Use "provider:model"')
  ),
  instructions: z.string().trim().max(4000).default(""),
})

export type AgentFormValues = z.infer<typeof agentFormSchema>

export type AgentConfigurable = Omit<AgentFormValues, "name" | "description">

export function toConfigurable(values: AgentFormValues): AgentConfigurable {
  const { name: _name, description: _description, ...configurable } = values
  return configurable
}
