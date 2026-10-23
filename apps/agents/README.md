# SDL agent team

A [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) orchestrator that runs a software development lifecycle team on LangGraph. It takes a request, plans it, writes the code, tests and reviews it, and opens a pull request on GitHub. All code runs in a [LangSmith sandbox](https://docs.langchain.com/langsmith/sandbox-auth-proxy), and every run is traced in LangSmith.

```
 host (this process)                               LangSmith sandbox
 ┌─────────────────────────────────────┐          ┌────────────────────────────────┐
 │ lead (orchestrator)                  │  files,  │ /workspace  (git clone)        │
 │   ├─ architect  ├─ engineer          │  shell,  │ node / git / pnpm              │
 │   ├─ qa         ├─ reviewer          │──git────▶│                                │
 │   └─ release ── github_open_pull_req │          │ egress proxy                   │
 │ model calls (your keys)              │          │  • allow-list: GitHub, npm, …  │
 │ PR creation (Octokit, GITHUB_TOKEN)  │          │  • injects GitHub auth for     │
 └─────────────────────────────────────┘          │    GITHUB_REPO git traffic only│
                                                   └────────────────────────────────┘
```

| Agent | Does | Extra tools |
| --- | --- | --- |
| lead | Plans, delegates, loops engineer ↔ qa/reviewer, reports | `task`, `write_todos` |
| architect | Explores the repo, writes `/workspace/.sdl/plan.md` | `git_status` |
| engineer | Implements the plan, runs typecheck/lint/tests | `git_status`, `git_diff` |
| qa | Adds/runs tests, returns PASS/FAIL with evidence | `git_status`, `git_diff` |
| reviewer | Reviews the diff, returns APPROVE/REQUEST_CHANGES | `git_diff` |
| release | Branch, commit, push, draft PR | git + GitHub tools |

Every agent's file tools and `execute` (shell) run inside the sandbox.

## Security model

- **Isolation:** code and shell commands run in a LangSmith sandbox, never on this machine. Outbound traffic is limited to `SANDBOX_ALLOWED_HOSTS` (GitHub and package registries by default).
- **No credentials in the sandbox:**
  - Model calls run on the host, so model API keys never enter the sandbox.
  - The GitHub token is handed to the sandbox proxy as an `opaque` (write-only) secret. The proxy injects it only into git traffic for `github.com/GITHUB_REPO`, so agents can't read it or use it on other repos.
- **Guardrails enforced in tool code:**
  - Commits and PR titles must pass commitlint.
  - Writes and pushes are only allowed on `agent/*` branches, never the base branch, and there is no force push.
- **Human in the loop:** `git_push` and `github_open_pull_request` pause for approval.
- **Lifecycle:** the CLI deletes its sandbox when it finishes (`SANDBOX_KEEP=true` stops it instead). Idle sandboxes stop after `SANDBOX_IDLE_TTL_SECONDS` and are deleted `SANDBOX_DELETE_AFTER_STOP_SECONDS` later.

## Setup

```bash
cp apps/agents/.env.example apps/agents/.env
```

1. **LangSmith:** set `LANGSMITH_API_KEY` (used for both tracing and sandboxes) and `LANGSMITH_PROJECT`.
2. **Sandbox image:** run this once and copy the printed id into `SANDBOX_SNAPSHOT_ID`:

   ```bash
   pnpm --filter agents sandbox:snapshot              # node:22-bookworm (git, corepack)
   pnpm --filter agents sandbox:snapshot python:3.13  # or any image your repo needs
   ```

3. **Models (bring your own keys):** set `ORCHESTRATOR_MODEL` and `SUBAGENT_MODEL` to any `provider:model` and add the matching key. For example, `anthropic:claude-opus-5-5` needs `ANTHROPIC_API_KEY`, and `openai:gpt-5` needs `OPENAI_API_KEY`.
4. **Local models (optional):** run models on the agent server's machine with no API key:
   - **Ollama:** `ollama pull gpt-oss:20b`, then use `ollama:gpt-oss:20b`. The server sends `OLLAMA_NUM_CTX` (default 32768), because Ollama's small default context silently truncates agent prompts.
   - **LM Studio, vLLM, llama.cpp, LocalAI:** start the OpenAI-compatible server, set `OPENAI_COMPATIBLE_BASE_URL`, and use `openai-compatible:<model>`.

   Pick models that support **tool calling**: gpt-oss, qwen3, qwen2.5-coder and llama3.1+ work; plain chat models don't. You can mix providers, for example a hosted lead with local sub-agents. Local models must be reachable from the agent server, so a LangSmith-hosted deployment can't use `localhost` models.
5. **GitHub:** set `GITHUB_REPO` (owner/name) and a fine-grained `GITHUB_TOKEN` scoped to that repo, with Contents and Pull requests set to read/write.

## Run

```bash
# One task from the terminal; approve push/PR prompts inline
pnpm --filter agents start "Add a /api/health route that returns { ok: true }"

# LangGraph Studio / Agent Server on http://localhost:2024
pnpm --filter agents studio
```

The sandbox is created on the first tool call. In Studio, all threads in one server process share a sandbox, so run one task at a time. Approvals show up as interrupts, and you resume them with `{ "decisions": [{ "type": "approve" }] }` or `{ "type": "reject", "message": "…" }`.

## Dashboard

The web app has an agents UI at **/dashboard/agents**:

- **Agents:** create, configure and delete agents. Each agent is a LangGraph *assistant* of the `sdl_team` graph with its own settings: repo, base branch, lead and sub-agent models, and extra instructions. `src/graph.ts` is a factory that builds the team from each assistant's `config.configurable`. Unset fields fall back to this server's env.
- **Chat:** conversations per agent with streamed replies, live sub-agent cards, the lead's plan (todos), and approve/edit/reject cards for `git_push` and `github_open_pull_request`.

The browser never talks to this server directly. `apps/web` proxies `/api/agents/*` and checks the user's session and `AGENTS_ADMIN_EMAILS`. Configure it in `apps/web/.env.local`:

```bash
LANGGRAPH_API_URL=http://localhost:2024   # or your LangSmith deployment URL
LANGGRAPH_API_KEY=                        # deployment only
AGENTS_ADMIN_EMAILS=you@example.com       # verified emails required in production
```

Model keys and the GitHub token stay on this server. The dashboard only stores settings. Set `GITHUB_ALLOWED_REPOS` here to limit which repos the dashboard can point agents at.

## Customize

- **Prompts:** `src/prompts.ts`
- **Team members, tools and approval rules:** `src/team.ts`
- **Sandbox size, network policy and workspace setup:** `src/sandbox.ts`
- **New tools:** add them in `src/tools/`. Anything that runs code should go through `teamSandbox.execute`.
