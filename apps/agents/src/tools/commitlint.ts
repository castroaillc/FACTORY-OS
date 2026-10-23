import lint from "@commitlint/lint"
import load from "@commitlint/load"

const loaded = load({ extends: ["@commitlint/config-conventional"] })

/** Returns a list of problems, empty when the message is a valid conventional commit. */
export async function lintCommitMessage(message: string) {
  const { rules, parserPreset } = await loaded
  const result = await lint(
    message,
    rules,
    parserPreset?.parserOpts
      ? { parserOpts: parserPreset.parserOpts as Record<string, unknown> }
      : {}
  )
  return [...result.errors, ...result.warnings].map(
    (problem) => `${problem.name}: ${problem.message}`
  )
}
