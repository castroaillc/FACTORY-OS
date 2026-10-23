import { z } from "zod"

import { config } from "./config.js"

export const MODEL_SPEC = /^[a-z][\w-]*:[\w.:/-]+$/
export const REPO = /^[\w.-]+\/[\w.-]+$/
export const BRANCH = /^[\w][\w./-]*$/

/**
 * Per-assistant settings, read from `config.configurable`. LangGraph assistants
 * store these, so the dashboard can create differently configured teams of the
 * same graph. Anything left unset falls back to the server's environment.
 */
const settingsSchema = z.object({
  orchestratorModel: z
    .string()
    .regex(MODEL_SPEC, 'Use "provider:model"')
    .default(config.ORCHESTRATOR_MODEL),
  subagentModel: z
    .string()
    .regex(MODEL_SPEC, 'Use "provider:model"')
    .default(config.SUBAGENT_MODEL),
  githubRepo: z
    .string()
    .regex(REPO, "Use owner/name")
    .optional()
    .default(config.GITHUB_REPO ?? ""),
  baseBranch: z.string().regex(BRANCH).default(config.GITHUB_BASE_BRANCH),
  instructions: z.string().max(4000).default(""),
})

export type TeamSettings = z.infer<typeof settingsSchema>

export function resolveSettings(configurable: unknown = {}): TeamSettings {
  // Empty strings from forms mean "use the server default"
  const input = Object.fromEntries(
    Object.entries((configurable ?? {}) as Record<string, unknown>).filter(
      ([, value]) => value !== "" && value !== null
    )
  )
  const settings = settingsSchema.parse(input)

  // The GitHub token may cover several repos; only let agents use the approved ones
  if (
    settings.githubRepo &&
    config.GITHUB_ALLOWED_REPOS.length > 0 &&
    !config.GITHUB_ALLOWED_REPOS.includes(settings.githubRepo)
  ) {
    throw new Error(
      `Repository "${settings.githubRepo}" is not in GITHUB_ALLOWED_REPOS`
    )
  }
  return settings
}
