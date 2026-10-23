"use client"

import type { Message } from "@langchain/langgraph-sdk"
import {
  useStream,
  type UseDeepAgentStream,
  type UseDeepAgentStreamOptions,
} from "@langchain/langgraph-sdk/react"
import { ArrowUp, Bot, Square, Wrench } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { ApprovalCard } from "@/components/agents/approval-card"
import { Markdown } from "@/components/agents/markdown"
import { SubagentCard } from "@/components/agents/subagent-card"
import { ThreadList } from "@/components/agents/thread-list"
import { TodoPanel } from "@/components/agents/todo-panel"
import {
  isHITLRequest,
  messageText,
  type AgentState,
  type Decision,
} from "@/lib/agents/messages"

const EXAMPLES = [
  "Add a /api/health route that returns { ok: true } with a test",
  "Find and fix any TypeScript errors in apps/web",
  "Add a dark mode toggle to the marketing navbar",
]

export function AgentChat({ assistantId }: { assistantId: string }) {
  // The SDK needs an absolute URL; it's only known in the browser
  const [apiUrl, setApiUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    setApiUrl(`${window.location.origin}/api/agents`)
  }, [])

  if (!apiUrl) return <Skeleton className="h-full w-full rounded-xl" />
  return <ChatSession apiUrl={apiUrl} assistantId={assistantId} />
}

function ChatSession({
  apiUrl,
  assistantId,
}: {
  apiUrl: string
  assistantId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const threadId = searchParams.get("thread")
  const [threadsVersion, setThreadsVersion] = React.useState(0)

  const selectThread = React.useCallback(
    (id: string | null) => {
      router.replace(id ? `${pathname}?thread=${id}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router]
  )

  const options: UseDeepAgentStreamOptions<AgentState> = {
    apiUrl,
    assistantId,
    threadId,
    messagesKey: "messages",
    reconnectOnMount: true,
    // Subagent chatter is shown inside their cards, not the main transcript
    filterSubagentMessages: true,
    onThreadId: (id) => {
      selectThread(id)
      setThreadsVersion((v) => v + 1)
    },
    // Refresh the thread list once the run has written the thread's metadata
    onFinish: () => setThreadsVersion((v) => v + 1),
    onError: () => setThreadsVersion((v) => v + 1),
  }
  // Without the agent's compiled type the SDK can't infer deep-agent mode, so
  // use its deep-agent types directly; the runtime hook is the same.
  const stream = useStream(options as never) as unknown as ChatStream

  const interrupts = stream.interrupts.filter((i) => isHITLRequest(i.value))

  function send(text: string) {
    const message = { type: "human" as const, content: text }
    stream.submit(
      { messages: [message] },
      {
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            { ...message, id: crypto.randomUUID() },
          ],
        }),
      }
    )
  }

  function resume(interruptId: string | undefined, decisions: Decision[]) {
    stream.submit(undefined, {
      streamSubgraphs: true,
      command: {
        // Keyed by interrupt id so parallel approvals resume independently
        resume: interruptId ? { [interruptId]: { decisions } } : { decisions },
      },
    })
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_280px]">
      <aside className="hidden min-h-0 lg:block">
        <ThreadList
          apiUrl={apiUrl}
          assistantId={assistantId}
          activeThreadId={threadId}
          refreshKey={threadsVersion}
          onSelect={selectThread}
        />
      </aside>

      <section className="flex min-h-0 flex-col rounded-xl border bg-background">
        <Transcript stream={stream} onExample={send} />

        <div className="space-y-3 border-t p-3">
          {interrupts.map((interrupt, index) => (
            <ApprovalCard
              key={interrupt.id ?? index}
              request={interrupt.value as never}
              disabled={stream.isLoading}
              onSubmit={(decisions) => resume(interrupt.id, decisions)}
            />
          ))}
          {stream.error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
            >
              {stream.error instanceof Error
                ? stream.error.message
                : "The run failed. Check the agent server logs or LangSmith trace."}
            </p>
          ) : null}
          <Composer
            disabled={interrupts.length > 0}
            isLoading={stream.isLoading}
            onSend={send}
            onStop={() => stream.stop()}
          />
        </div>
      </section>

      <aside className="hidden min-h-0 space-y-6 overflow-y-auto xl:block">
        <TodoPanel todos={stream.values.todos ?? []} />
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Team activity</h2>
          {stream.activeSubagents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sub-agents running.
            </p>
          ) : (
            stream.activeSubagents.map((subagent) => (
              <SubagentCard key={subagent.id} subagent={subagent} />
            ))
          )}
        </section>
      </aside>
    </div>
  )
}

type ChatStream = UseDeepAgentStream<AgentState>

function Transcript({
  stream,
  onExample,
}: {
  stream: ChatStream
  onExample: (text: string) => void
}) {
  const endRef = React.useRef<HTMLDivElement>(null)
  const messages = stream.messages.filter((m) => m.type !== "tool")

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, stream.isLoading])

  if (messages.length === 0 && !stream.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Bot className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">What should the team build?</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The lead plans the work, delegates to the architect, engineer, QA,
            reviewer and release agents, and asks you before pushing or opening
            a pull request.
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              className="h-auto py-1.5 whitespace-normal"
              onClick={() => onExample(example)}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((message, index) => (
          <MessageView
            key={message.id ?? index}
            message={message}
            stream={stream}
          />
        ))}
        {stream.isLoading && stream.activeSubagents.length === 0 && (
          <p className="animate-pulse text-sm text-muted-foreground">
            Thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}

function MessageView({
  message,
  stream,
}: {
  message: Message
  stream: ChatStream
}) {
  const text = messageText(message.content)

  if (message.type === "human") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
        {text}
      </div>
    )
  }

  if (message.type !== "ai") return null

  const subagents = message.id ? stream.getSubagentsByMessage(message.id) : []
  const otherTools = stream
    .getToolCalls(message)
    .filter((toolCall) => toolCall.call.name !== "task")

  return (
    <div className="flex flex-col gap-2">
      {text && <Markdown>{text}</Markdown>}
      {otherTools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {otherTools.map((toolCall) => (
            <Badge
              key={toolCall.id}
              variant="outline"
              className="font-mono text-[11px]"
            >
              <Wrench />
              {toolCall.call.name}
            </Badge>
          ))}
        </div>
      )}
      {subagents.map((subagent) => (
        <SubagentCard key={subagent.id} subagent={subagent} />
      ))}
    </div>
  )
}

function Composer({
  disabled,
  isLoading,
  onSend,
  onStop,
}: {
  disabled: boolean
  isLoading: boolean
  onSend: (text: string) => void
  onStop: () => void
}) {
  const [value, setValue] = React.useState("")

  function submit() {
    const text = value.trim()
    if (!text || isLoading || disabled) return
    onSend(text)
    setValue("")
  }

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Textarea
        aria-label="Message the agent"
        value={value}
        rows={2}
        disabled={disabled}
        placeholder={
          disabled
            ? "Approve or reject the pending action first"
            : "Describe a change, bug fix or feature…"
        }
        className="resize-none pr-12"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />
      {isLoading ? (
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          className="absolute right-2 bottom-2"
          aria-label="Stop"
          onClick={onStop}
        >
          <Square />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon-sm"
          className="absolute right-2 bottom-2"
          aria-label="Send"
          disabled={!value.trim() || disabled}
        >
          <ArrowUp />
        </Button>
      )}
    </form>
  )
}
