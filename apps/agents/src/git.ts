import { config } from "./config.js"
import { sh, teamSandbox } from "./sandbox.js"

const MAX_OUTPUT = 50_000

/**
 * Run git in the sandbox repo. Remote operations authenticate through the
 * sandbox proxy, so no credentials are passed here.
 */
export async function git(args: string[]) {
  // Frame the output with our own exit-code marker: backends decorate output
  // differently (e.g. "<no output>"), and git's real output must be exact.
  const result = await teamSandbox.execute(
    `{ git ${args.map(sh).join(" ")}; } 2>&1; printf '\\n${EXIT_MARKER}%d' $?`
  )
  const at = result.output.lastIndexOf(`\n${EXIT_MARKER}`)
  if (at === -1)
    throw new Error(truncate(result.output) || `git ${args[0]} failed`)
  const output = truncate(result.output.slice(0, at).trim())
  const exitCode = Number(result.output.slice(at + EXIT_MARKER.length + 1))
  if (exitCode !== 0) throw new Error(output || `git ${args[0]} failed`)
  return output
}

const EXIT_MARKER = "__SDL_GIT_EXIT__"

function truncate(text: string) {
  return text.length > MAX_OUTPUT
    ? `${text.slice(0, MAX_OUTPUT)}\n… (truncated ${text.length - MAX_OUTPUT} chars)`
    : text
}

export async function currentBranch() {
  return git(["rev-parse", "--abbrev-ref", "HEAD"])
}

export const baseRef = () => `origin/${config.GITHUB_BASE_BRANCH}`
