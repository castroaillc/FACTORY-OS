import type { BaseCheckpointSaver } from "@langchain/langgraph"
import { createDeepAgent, LocalShellBackend, type SubAgent } from "deepagents"

import { config } from "./config.js"
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
    description:
      "Explores the codebase and writes an implementation plan to /.sdl/plan.md. Use first for any non-trivial change.",
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

/**
 * Shell + filesystem rooted at the workspace clone. Commands run with a
 * scrubbed environment so model API keys and the GitHub token aren't readable.
 * This is NOT a sandbox: run it in a container or swap in a sandbox backend
 * (e.g. deepagents' LangSmithSandbox) before pointing it at untrusted input.
 */
function createWorkspaceBackend() {
  return new LocalShellBackend({
    rootDir: config.workspaceDir,
    virtualMode: true,
    timeout: config.SHELL_TIMEOUT_SECONDS,
    inheritEnv: false,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      LANG: process.env.LANG ?? "en_US.UTF-8",
      CI: "1",
    },
  })
}

export function createSdlTeam({
  checkpointer,
}: { checkpointer?: BaseCheckpointSaver } = {}) {
  return createDeepAgent({
    name: "sdl-team",
    model: config.ORCHESTRATOR_MODEL,
    systemPrompt: orchestratorPrompt,
    subagents,
    backend: createWorkspaceBackend(),
    checkpointer,
  })
}
