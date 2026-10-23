import type { BaseCheckpointSaver } from "@langchain/langgraph"
import { createDeepAgent, type SubAgent } from "deepagents"

import { config } from "./config.js"
import { teamSandbox } from "./sandbox.js"
import {
  architectPrompt,
  engineerPrompt,
  orchestratorPrompt,
  qaPrompt,
  releasePrompt,
  reviewerPrompt,
} from "./prompts.js"
import {
  gitCommit,
  gitCreateBranch,
  gitDiff,
  gitPush,
  gitStatus,
} from "./tools/git.js"
import { openPullRequest } from "./tools/github.js"

const model = config.SUBAGENT_MODEL

const subagents: SubAgent[] = [
  {
    name: "architect",
    description: `Explores the codebase and writes an implementation plan to ${config.SANDBOX_WORKDIR}/.sdl/plan.md. Use first for any non-trivial change.`,
    systemPrompt: architectPrompt,
    model,
    tools: [gitStatus],
  },
  {
    name: "engineer",
    description:
      "Implements code changes from a plan and runs typecheck/lint/tests. Does not commit.",
    systemPrompt: engineerPrompt,
    model,
    tools: [gitStatus, gitDiff],
  },
  {
    name: "qa",
    description:
      "Adds/updates tests and runs the test suite. Returns PASS or FAIL with evidence.",
    systemPrompt: qaPrompt,
    model,
    tools: [gitStatus, gitDiff],
  },
  {
    name: "reviewer",
    description:
      "Reviews the current diff for bugs, security issues and maintainability. Returns APPROVE or REQUEST_CHANGES.",
    systemPrompt: reviewerPrompt,
    model,
    tools: [gitDiff],
  },
  {
    name: "release",
    description:
      "Creates the working branch, commits with conventional commits, pushes, and opens a draft PR.",
    systemPrompt: releasePrompt,
    model,
    tools: [
      gitStatus,
      gitDiff,
      gitCreateBranch,
      gitCommit,
      gitPush,
      openPullRequest,
    ],
    // Anything that leaves this machine needs a human in the loop
    interruptOn: {
      git_push: { allowedDecisions: ["approve", "reject"] },
      github_open_pull_request: {
        allowedDecisions: ["approve", "edit", "reject"],
      },
    },
  },
]

export function createSdlTeam({
  checkpointer,
}: { checkpointer?: BaseCheckpointSaver } = {}) {
  return createDeepAgent({
    name: "sdl-team",
    model: config.ORCHESTRATOR_MODEL,
    systemPrompt: orchestratorPrompt,
    subagents,
    // Every file and shell tool runs inside the LangSmith sandbox
    backend: teamSandbox,
    checkpointer,
  })
}
