import { Octokit } from "@octokit/rest"
import { tool } from "langchain"
import { z } from "zod"

import { config } from "../config.js"
import type { Git } from "../git.js"
import type { TeamSettings } from "../settings.js"
import { lintCommitMessage } from "./commitlint.js"

export function createGitHubTools(
  { currentBranch }: Git,
  { githubRepo, baseBranch }: TeamSettings
) {
  const openPullRequest = tool(
    async ({ title, body, draft }) => {
      // Squash merges use the PR title as the commit message, so lint it too
      const problems = await lintCommitMessage(title)
      if (problems.length > 0) {
        return `PR title rejected by commitlint:\n- ${problems.join("\n- ")}`
      }
      if (!githubRepo || !config.GITHUB_TOKEN) {
        throw new Error("A GitHub repo and GITHUB_TOKEN must be configured")
      }
      const head = await currentBranch()
      if (!head.startsWith(config.AGENT_BRANCH_PREFIX)) {
        return `Refusing to open a PR from "${head}"; push an agent branch first.`
      }
      const [owner, repo] = githubRepo.split("/") as [string, string]
      const octokit = new Octokit({ auth: config.GITHUB_TOKEN })
      const { data } = await octokit.pulls.create({
        owner,
        repo,
        head,
        base: baseBranch,
        title,
        body,
        draft,
      })
      return `Opened PR #${data.number}: ${data.html_url}`
    },
    {
      name: "github_open_pull_request",
      description:
        "Open a pull request from the current (already pushed) agent branch into the base branch. Requires human approval.",
      schema: z.object({
        title: z
          .string()
          .describe(
            "Conventional commit style, e.g. feat(api): add health route"
          ),
        body: z
          .string()
          .describe(
            "Markdown: summary, what changed, how it was tested, and any risks"
          ),
        draft: z.boolean().default(true),
      }),
    }
  )

  return { openPullRequest }
}
