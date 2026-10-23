"use client"

import { Client, type Thread } from "@langchain/langgraph-sdk"
import { MessageSquarePlus } from "lucide-react"
import * as React from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"
import { threadTitle, type AgentState } from "@/lib/agents/messages"

const statusVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  busy: "secondary",
  interrupted: "outline",
  error: "destructive",
}

export function ThreadList({
  apiUrl,
  assistantId,
  activeThreadId,
  refreshKey,
  onSelect,
}: {
  apiUrl: string
  assistantId: string
  activeThreadId: string | null
  refreshKey: unknown
  onSelect: (threadId: string | null) => void
}) {
  const [threads, setThreads] = React.useState<Thread<AgentState>[] | null>(
    null
  )

  React.useEffect(() => {
    let cancelled = false
    new Client({ apiUrl }).threads
      .search<AgentState>({
        metadata: { assistant_id: assistantId },
        limit: 30,
        sortBy: "updated_at",
        sortOrder: "desc",
      })
      .then((result) => !cancelled && setThreads(result))
      .catch(() => !cancelled && setThreads([]))
    return () => {
      cancelled = true
    }
  }, [apiUrl, assistantId, refreshKey])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Button
        variant="outline"
        className="justify-start"
        onClick={() => onSelect(null)}
      >
        <MessageSquarePlus />
        New conversation
      </Button>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-1 pr-2">
          {threads === null && (
            <li className="px-2 py-1 text-sm text-muted-foreground">
              Loading…
            </li>
          )}
          {threads?.length === 0 && (
            <li className="px-2 py-1 text-sm text-muted-foreground">
              No conversations yet.
            </li>
          )}
          {threads?.map((thread) => (
            <li key={thread.thread_id}>
              <button
                type="button"
                onClick={() => onSelect(thread.thread_id)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  thread.thread_id === activeThreadId && "bg-muted"
                )}
              >
                <span className="line-clamp-1">
                  {threadTitle(thread.values?.messages)}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {new Date(thread.updated_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {statusVariant[thread.status] && (
                    <Badge
                      variant={statusVariant[thread.status]}
                      className="h-4 px-1 text-[10px] capitalize"
                    >
                      {thread.status === "interrupted"
                        ? "needs approval"
                        : thread.status}
                    </Badge>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
