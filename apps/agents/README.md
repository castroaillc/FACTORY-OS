# SDL agent team

A [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) orchestrator that runs a software development lifecycle team on LangGraph. It takes a request, plans it, writes the code, tests and reviews it, and opens a pull request on GitHub. Every run is traced in LangSmith.

```
                    ┌──────────────── lead (orchestrator) ────────────────┐
 request ──────────▶│ write_todos · task() delegation · review loop (≤3) │──▶ PR URL
                    └───┬─────────┬─────────┬──────────┬──────────┬───────┘
                        ▼         ▼         ▼          ▼          ▼
                    architect  engineer    qa      reviewer    release
                    plan.md    code+build  tests   diff review branch/commit/push/PR
                                                                (human approval)
```

| Agent | Does | Extra tools |
| --- | --- | --- |
| lead | Plans, delegates, loops engineer ↔ qa/reviewer, reports | `task`, `write_todos` |
| architect | Explores the repo, writes `/.sdl/plan.md` | `git_status` |
| engineer | Implements the plan, runs typecheck/lint/tests | `git_status`, `git_diff` |
| qa | Adds/runs tests, returns PASS/FAIL with evidence | `git_status`, `git_diff` |
| reviewer | Reviews the diff, returns APPROVE/REQUEST_CHANGES | `git_diff` |
| release | Branch, commit, push, draft PR | git + GitHub tools |

All agents also get Deep Agents' built-in file tools and `execute` (shell), both rooted at the workspace clone.

## Guardrails

The following are enforced in tool code, not just in prompts:

- **Commits** must pass commitlint (`@commitlint/config-conventional`), and so must PR titles.
- **Branches:** agents only commit and push on `AGENT_BRANCH_PREFIX` branches (`agent/*`). They never write to the base branch, and there is no force push.
- **Human in the loop:** `git_push` and `github_open_pull_request` pause for approval.
- **Secrets:**
  - The GitHub token is passed to git through `GIT_CONFIG_*` env vars, only for remote commands. It never goes on the command line, into `.git/config`, or to the agents.
  - Shell commands run with a scrubbed environment (`PATH`, `HOME`, `LANG`, `CI`), so model API keys aren't readable.
- **Scratch files:** agent notes in `.sdl/` are excluded from git.

> **The local shell backend is not a sandbox.** Agents can run any command as your user inside the workspace. Run this in a container or VM, or swap `LocalShellBackend` in `src/team.ts` for a sandbox backend such as `LangSmithSandbox`, before giving it untrusted input.

## Setup

```bash
cp apps/agents/.env.example apps/agents/.env
```

Fill in the following:

1. **Model keys (bring your own):** set `ORCHESTRATOR_MODEL` and `SUBAGENT_MODEL` to any `provider:model` that LangChain's `initChatModel` supports, plus that provider's key. For example, `anthropic:claude-opus-5-5` needs `ANTHROPIC_API_KEY`, and `openai:gpt-5` needs `OPENAI_API_KEY`. Other providers need their `@langchain/<provider>` package installed.
2. **LangSmith:** set `LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY` and `LANGSMITH_PROJECT`.
3. **GitHub:** set `GITHUB_REPO` (owner/name) and a fine-grained `GITHUB_TOKEN` scoped to that repo, with Contents and Pull requests set to read/write. The repo is cloned into `WORKSPACE_DIR` on first run.

## Run

```bash
# One task from the terminal; approve push/PR prompts inline
pnpm --filter agents start "Add a /api/health route that returns { ok: true }"

# LangGraph Studio / Agent Server on http://localhost:2024
pnpm --filter agents studio
```

In Studio, open the `sdl_team` graph. Approvals show up as interrupts, and you resume them with `{ "decisions": [{ "type": "approve" }] }` or `{ "type": "reject", "message": "…" }`.

## Customize

- **Prompts:** `src/prompts.ts`
- **Team members, tools and approval rules:** `src/team.ts`
- **New tools:** add them in `src/tools/` and attach them to the sub-agents that need them.
