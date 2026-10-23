import type { BaseCheckpointSaver } from "@langchain/langgraph"
import { createDeepAgent, type SubAgent } from "deepagents"

import { config } from "./config.js"
import { createGit } from "./git.js"
import { buildPrompts } from "./prompts.js"
import { getTeamSandbox, type TeamSandbox } from "./sandbox.js"
import type { TeamSettings } from "./settings.js"
import { createGitTools } from "./tools/git.js"
import { createGitHubTools } from "./tools/github.js"

export function createSdlTeam(
  settings: TeamSettings,
  {
    checkpointer,
    sandbox = getTeamSandbox({
      repo: settings.githubRepo,
      baseBranch: settings.baseBranch,
    }),
  }: { checkpointer?: BaseCheckpointSaver; sandbox?: TeamSandbox } = {}
) {
  const prompts = buildPrompts(settings)
  const git = createGit(sandbox)
  const { gitStatus, gitDiff, gitCreateBranch, gitCommit, gitPush } =
    createGitTools(git)
  const { openPullRequest } = createGitHubTools(git, settings)
  const model = settings.subagentModel

  const subagents: SubAgent[] = [
    {
      name: "architect",
      description: `Explores the codebase and writes an implementation plan to ${config.SANDBOX_WORKDIR}/.sdl/plan.md. Use first for any non-trivial change.`,
      systemPrompt: prompts.architect,
      model,
      tools: [gitStatus],
    },
    {
      name: "engineer",
      description:
        "Implements code changes from a plan and runs typecheck/lint/tests. Does not commit.",
      systemPrompt: prompts.engineer,
      model,
      tools: [gitStatus, gitDiff],
    },
    {
      name: "qa",
      description:
        "Adds/updates tests and runs the test suite. Returns PASS or FAIL with evidence.",
      systemPrompt: prompts.qa,
      model,
      tools: [gitStatus, gitDiff],
    },
    {
      name: "reviewer",
      description:
        "Reviews the current diff for bugs, security issues and maintainability. Returns APPROVE or REQUEST_CHANGES.",
      systemPrompt: prompts.reviewer,
      model,
      tools: [gitDiff],
    },
    {
      name: "release",
      description:
        "Creates the working branch, commits with conventional commits, pushes, and opens a draft PR.",
      systemPrompt: prompts.release,
      model,
      tools: [
        gitStatus,
        gitDiff,
        gitCreateBranch,
        gitCommit,
        gitPush,
        openPullRequest,
      ],
      // Anything that leaves the sandbox needs a human in the loop
      interruptOn: {
        git_push: { allowedDecisions: ["approve", "reject"] },
        github_open_pull_request: {
          allowedDecisions: ["approve", "edit", "reject"],
        },
      },
    },
  ]

  return createDeepAgent({
    name: "sdl-team",
    model: settings.orchestratorModel,
    systemPrompt: prompts.orchestrator,
    subagents,
    // Every file and shell tool runs inside the LangSmith sandbox
    backend: sandbox,
    checkpointer,
  })
}
