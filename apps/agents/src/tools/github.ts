import { Octokit } from "@octokit/rest"
import { tool } from "langchain"
import { z } from "zod"

import { config } from "../config.js"
import { currentBranch } from "../git.js"
import { lintCommitMessage } from "./commitlint.js"

function repo() {
  if (!config.GITHUB_REPO || !config.GITHUB_TOKEN) {
    throw new Error("GITHUB_REPO and GITHUB_TOKEN must be set")
  }
  const [owner, name] = config.GITHUB_REPO.split("/") as [string, string]
  return {
    owner,
    repo: name,
    octokit: new Octokit({ auth: config.GITHUB_TOKEN }),
  }
}

export const openPullRequest = tool(
  async ({ title, body, draft }) => {
    // Squash merges use the PR title as the commit message, so lint it too
    const problems = await lintCommitMessage(title)
    if (problems.length > 0) {
      return `PR title rejected by commitlint:\n- ${problems.join("\n- ")}`
    }
    const head = await currentBranch()
    if (!head.startsWith(config.AGENT_BRANCH_PREFIX)) {
      return `Refusing to open a PR from "${head}"; push an agent branch first.`
    }
    const { owner, repo: name, octokit } = repo()
    const { data } = await octokit.pulls.create({
      owner,
      repo: name,
      head,
      base: config.GITHUB_BASE_BRANCH,
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
