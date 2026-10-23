import path from "node:path"
import { z } from "zod"

const envSchema = z.object({
  // Bring your own keys: any "provider:model" string supported by LangChain's
  // initChatModel, e.g. "anthropic:claude-opus-5-5" or "openai:gpt-5".
  // Set the matching key (ANTHROPIC_API_KEY, OPENAI_API_KEY, ...) in .env.
  ORCHESTRATOR_MODEL: z.string().default("anthropic:claude-opus-5-5"),
  SUBAGENT_MODEL: z.string().default("anthropic:claude-sonnet-5-5"),

  // Local clone the team works in. Cloned from GITHUB_REPO on first run.
  WORKSPACE_DIR: z.string().default("./workspace"),
  GITHUB_REPO: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Use the owner/name format")
    .optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_BASE_BRANCH: z.string().default("main"),
  // Agents may only push to branches with this prefix
  AGENT_BRANCH_PREFIX: z.string().default("agent/"),

  GIT_AUTHOR_NAME: z.string().default("SDL Agent"),
  GIT_AUTHOR_EMAIL: z.string().default("sdl-agent@users.noreply.github.com"),

  SHELL_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(300),
})

const env = envSchema.parse(process.env)

export const config = {
  ...env,
  workspaceDir: path.resolve(env.WORKSPACE_DIR),
}
