import type { TeamSandbox } from "./sandbox.js"
import { sh } from "./sandbox.js"

const MAX_OUTPUT = 50_000
const EXIT_MARKER = "__SDL_GIT_EXIT__"

function truncate(text: string) {
  return text.length > MAX_OUTPUT
    ? `${text.slice(0, MAX_OUTPUT)}\n… (truncated ${text.length - MAX_OUTPUT} chars)`
    : text
}

/**
 * Git bound to one team's sandbox repo. Remote operations authenticate through
 * the sandbox proxy, so no credentials are passed here.
 */
export function createGit(sandbox: TeamSandbox) {
  async function git(args: string[]) {
    // Frame the output with our own exit-code marker: backends decorate output
    // differently (e.g. "<no output>"), and git's real output must be exact.
    const result = await sandbox.execute(
      `{ git ${args.map(sh).join(" ")}; } 2>&1; printf '\\n${EXIT_MARKER}%d' $?`
    )
    const at = result.output.lastIndexOf(`\n${EXIT_MARKER}`)
    if (at === -1) {
      throw new Error(truncate(result.output) || `git ${args[0]} failed`)
    }
    const output = truncate(result.output.slice(0, at).trim())
    const exitCode = Number(result.output.slice(at + EXIT_MARKER.length + 1))
    if (exitCode !== 0) throw new Error(output || `git ${args[0]} failed`)
    return output
  }

  return {
    git,
    currentBranch: () => git(["rev-parse", "--abbrev-ref", "HEAD"]),
    baseRef: () => `origin/${sandbox.target.baseBranch}`,
  }
}

export type Git = ReturnType<typeof createGit>
