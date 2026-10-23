// Usage: pnpm --filter agents start "Add a /health route that returns 200"
import { randomUUID } from "node:crypto"
import { createInterface } from "node:readline/promises"

import { awaitAllCallbacks } from "@langchain/core/callbacks/promises"
import { AIMessage, type BaseMessage } from "@langchain/core/messages"
import { Command, MemorySaver, type StateSnapshot } from "@langchain/langgraph"
import type { Decision, HITLRequest } from "langchain"

import { getTeamSandbox } from "./sandbox.js"
import { resolveSettings } from "./settings.js"
import { createSdlTeam } from "./team.js"

const task = process.argv.slice(2).join(" ").trim()
if (!task) {
  console.error('Usage: pnpm --filter agents start "<what to build>"')
  process.exit(1)
}

const settings = resolveSettings()
const sandbox = getTeamSandbox({
  repo: settings.githubRepo,
  baseBranch: settings.baseBranch,
})
const agent = createSdlTeam(settings, {
  checkpointer: new MemorySaver(),
  sandbox,
})
const runConfig = {
  configurable: { thread_id: randomUUID() },
  recursionLimit: 500,
  // Shows up in LangSmith when LANGSMITH_TRACING=true
  runName: "sdl-team",
  tags: ["sdl-team", "cli"],
  metadata: { repo: settings.githubRepo, task },
}

const rl = createInterface({ input: process.stdin, output: process.stdout })

function label(namespace: string[]) {
  // Subagent runs are nested under a "tools:<id>" namespace
  return namespace.length === 0 ? "lead" : "subagent"
}

function logMessages(namespace: string[], messages: BaseMessage[]) {
  for (const message of messages) {
    if (!AIMessage.isInstance(message)) continue
    const who = label(namespace)
    for (const call of message.tool_calls ?? []) {
      const detail =
        call.name === "task"
          ? `${call.args.subagent_type}: ${String(call.args.description).slice(0, 120)}`
          : JSON.stringify(call.args).slice(0, 120)
      console.log(`[${who}] → ${call.name} ${detail}`)
    }
    if (message.text && namespace.length === 0)
      console.log(`[${who}] ${message.text}`)
  }
}

async function askForDecisions(request: HITLRequest): Promise<Decision[]> {
  const decisions: Decision[] = []
  for (const action of request.actionRequests) {
    console.log(`\n⏸  Approval needed: ${action.name}`)
    console.log(JSON.stringify(action.args, null, 2))
    const answer = (
      await rl.question("Approve? [y]es / [n]o (with reason): ")
    ).trim()
    if (/^y(es)?$/i.test(answer)) {
      decisions.push({ type: "approve" })
    } else {
      const reason = answer.replace(/^n(o)?\s*/i, "") || "Rejected by reviewer"
      decisions.push({ type: "reject", message: reason })
    }
  }
  return decisions
}

let input: unknown = { messages: [{ role: "user", content: task }] }

try {
  while (true) {
    const stream = await agent.stream(input as never, {
      ...runConfig,
      streamMode: "updates",
      subgraphs: true,
    })

    for await (const [namespace, update] of stream as AsyncIterable<
      [string[], Record<string, { messages?: BaseMessage[] } | undefined>]
    >) {
      for (const node of Object.values(update)) {
        if (node?.messages) logMessages(namespace, node.messages)
      }
    }

    const state: StateSnapshot = await agent.getState(runConfig, {
      subgraphs: true,
    })
    const interrupts = state.tasks.flatMap((t) => t.interrupts ?? [])
    if (interrupts.length === 0) {
      const values = state.values as { messages?: BaseMessage[] }
      const last = values.messages?.at(-1)
      if (last) console.log(`\n✅ ${last.text}`)
      break
    }

    const resume: Record<string, { decisions: Decision[] }> = {}
    for (const pending of interrupts) {
      resume[pending.id!] = {
        decisions: await askForDecisions(pending.value as HITLRequest),
      }
    }
    input = new Command({ resume })
  }
} finally {
  rl.close()
  await sandbox.dispose()
  // Make sure LangSmith receives the full trace before exiting
  await awaitAllCallbacks()
}
