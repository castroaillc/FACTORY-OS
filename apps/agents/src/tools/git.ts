import { tool } from "langchain"
import { z } from "zod"

import { config } from "../config.js"
import type { Git } from "../git.js"
import { lintCommitMessage } from "./commitlint.js"

function toBranchSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, "-")
    .replace(/^[-/.]+|[-/.]+$/g, "")
    .slice(0, 60)
}

export function createGitTools({ git, currentBranch, baseRef }: Git) {
  async function assertAgentBranch() {
    const branch = await currentBranch()
    if (
      `origin/${branch}` === baseRef() ||
      !branch.startsWith(config.AGENT_BRANCH_PREFIX)
    ) {
      throw new Error(
        `Refusing to modify "${branch}". Create a branch with git_create_branch first; agents may only write to "${config.AGENT_BRANCH_PREFIX}*" branches.`
      )
    }
    return branch
  }

  const gitStatus = tool(async () => git(["status", "--short", "--branch"]), {
    name: "git_status",
    description: "Show the current branch and changed files in the workspace.",
    schema: z.object({}),
  })

  const gitDiff = tool(
    async ({ against }) => {
      if (against) {
        return (await git(["diff", `${against}...HEAD`])) || "No changes."
      }
      // Intent-to-add so brand-new files show up in the diff too
      await git(["add", "--intent-to-add", "--all"])
      return (await git(["diff", "HEAD"])) || "No changes."
    },
    {
      name: "git_diff",
      description:
        "Show code changes. Without `against`, shows uncommitted changes. With `against` (e.g. origin/main), shows everything committed on this branch since it diverged.",
      schema: z.object({
        against: z
          .string()
          .regex(/^\w[\w./-]*$/, "Must be a git ref, not an option")
          .optional()
          .describe("Ref to compare the current branch against"),
      }),
    }
  )

  const gitCreateBranch = tool(
    async ({ name }) => {
      const branch = `${config.AGENT_BRANCH_PREFIX}${toBranchSlug(name)}`
      const base = baseRef().replace(/^origin\//, "")
      await git(["fetch", "origin", base])
      await git(["switch", "-c", branch, baseRef()])
      return `Created and switched to ${branch} from ${baseRef()}.`
    },
    {
      name: "git_create_branch",
      description: `Create a new working branch from the latest base branch. The "${config.AGENT_BRANCH_PREFIX}" prefix is added automatically.`,
      schema: z.object({
        name: z
          .string()
          .min(3)
          .describe("Short kebab-case summary, e.g. add-health-route"),
      }),
    }
  )

  const gitCommit = tool(
    async ({ message }) => {
      const problems = await lintCommitMessage(message)
      if (problems.length > 0) {
        return `Commit rejected by commitlint (conventional commits):\n- ${problems.join("\n- ")}\nFix the message and try again.`
      }
      await assertAgentBranch()
      await git(["add", "-A"])
      const staged = await git(["diff", "--cached", "--name-only"])
      if (!staged) return "Nothing to commit."
      await git(["commit", "-m", message])
      return `Committed ${await git(["rev-parse", "--short", "HEAD"])}:\n${staged}`
    },
    {
      name: "git_commit",
      description:
        'Stage all workspace changes and commit them. The message must follow Conventional Commits (e.g. "feat(api): add health route") and is validated with commitlint.',
      schema: z.object({
        message: z.string().min(1),
      }),
    }
  )

  const gitPush = tool(
    async () => {
      const branch = await assertAgentBranch()
      // Plain push only: never --force
      await git(["push", "--set-upstream", "origin", branch])
      return `Pushed ${branch} to origin.`
    },
    {
      name: "git_push",
      description:
        "Push the current agent branch to GitHub. Requires human approval.",
      schema: z.object({}),
    }
  )

  return { gitStatus, gitDiff, gitCreateBranch, gitCommit, gitPush }
}
