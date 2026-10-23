"use client"

import type { SubagentStreamInterface } from "@langchain/langgraph-sdk/react"
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Loader2,
  XCircle,
} from "lucide-react"
import * as React from "react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { Markdown } from "@/components/agents/markdown"
import { messageText } from "@/lib/agents/messages"

const statusIcon = {
  pending: <CircleDashed className="size-4 text-muted-foreground" />,
  running: <Loader2 className="size-4 animate-spin text-primary" />,
  complete: <CheckCircle2 className="size-4 text-emerald-600" />,
  error: <XCircle className="size-4 text-destructive" />,
}

function elapsed(from: Date | null, to: Date | null) {
  if (!from) return null
  const seconds = Math.round(
    ((to ?? new Date()).getTime() - from.getTime()) / 1000
  )
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function SubagentCard({
  subagent,
}: {
  subagent: SubagentStreamInterface
}) {
  const { toolCall, status, result, messages } = subagent
  const type = String(toolCall.args.subagent_type ?? "subagent")
  const description = String(toolCall.args.description ?? "")
  const [open, setOpen] = React.useState(false)

  // The subagent's own tool calls, newest last, for a live activity trail
  const steps = messages.flatMap((message) =>
    message.type === "ai" ? (message.tool_calls ?? []).map((c) => c.name) : []
  )
  const latestText = [...messages]
    .reverse()
    .find((m) => m.type === "ai" && messageText(m.content).trim())

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-card text-card-foreground"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left">
        {statusIcon[status]}
        <Badge variant="secondary" className="capitalize">
          {type}
        </Badge>
        <span className="line-clamp-1 flex-1 text-sm text-muted-foreground">
          {description}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {elapsed(subagent.startedAt, subagent.completedAt)}
        </span>
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t p-3">
        <p className="text-sm whitespace-pre-wrap">{description}</p>
        {steps.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {steps.map((name, index) => (
              <Badge
                key={`${name}-${index}`}
                variant="outline"
                className="font-mono text-[11px]"
              >
                {name}
              </Badge>
            ))}
          </div>
        )}
        {result ? (
          <Markdown className="rounded-md bg-muted/50 p-3">{result}</Markdown>
        ) : (
          latestText && (
            <Markdown className="text-muted-foreground">
              {messageText(latestText.content)}
            </Markdown>
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
