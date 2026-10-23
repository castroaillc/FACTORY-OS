import { z } from "zod"

const csv = (fallback: string[]) =>
  z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : fallback
    )

const envSchema = z.object({
  // Bring your own keys: any "provider:model" string supported by LangChain's
  // initChatModel, e.g. "anthropic:claude-opus-5-5" or "openai:gpt-5".
  // Models run on this machine; their keys never enter the sandbox.
  ORCHESTRATOR_MODEL: z.string().default("anthropic:claude-opus-5-5"),
  SUBAGENT_MODEL: z.string().default("anthropic:claude-sonnet-5-5"),

  // Repo the team works on, cloned into the sandbox
  GITHUB_REPO: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Use the owner/name format")
    .optional(),
  GITHUB_TOKEN: z.string().optional(),
  // Repos the dashboard may point agents at (comma-separated). Empty = any repo
  // the token can access.
  GITHUB_ALLOWED_REPOS: csv([]),
  GITHUB_BASE_BRANCH: z.string().default("main"),
  // Agents may only push to branches with this prefix
  AGENT_BRANCH_PREFIX: z.string().default("agent/"),

  GIT_AUTHOR_NAME: z.string().default("SDL Agent"),
  GIT_AUTHOR_EMAIL: z.string().default("sdl-agent@users.noreply.github.com"),

  // LangSmith sandbox (uses LANGSMITH_API_KEY)
  SANDBOX_SNAPSHOT_ID: z.string().optional(),
  SANDBOX_WORKDIR: z.string().default("/workspace"),
  SANDBOX_VCPUS: z.coerce.number().int().positive().default(2),
  SANDBOX_MEMORY_GB: z.coerce.number().positive().default(4),
  // Must be multiples of 60
  SANDBOX_IDLE_TTL_SECONDS: z.coerce.number().int().default(1800),
  SANDBOX_DELETE_AFTER_STOP_SECONDS: z.coerce.number().int().default(3600),
  SANDBOX_COMMAND_TIMEOUT_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(600),
  // Outbound HTTPS allow-list enforced by the sandbox proxy
  SANDBOX_ALLOWED_HOSTS: csv([
    "github.com",
    "codeload.github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "registry.npmjs.org",
    "registry.yarnpkg.com",
    "nodejs.org",
    "pypi.org",
    "files.pythonhosted.org",
  ]),
  // Keep the sandbox (stopped, not deleted) after a CLI run for debugging
  SANDBOX_KEEP: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
})

export const config = envSchema.parse(process.env)
