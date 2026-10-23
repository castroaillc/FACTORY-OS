import { CheckCircle2, Circle, Loader2 } from "lucide-react"

import type { Todo } from "@/lib/agents/messages"

const icons = {
  completed: <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />,
  in_progress: (
    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
  ),
  pending: <Circle className="size-4 shrink-0 text-muted-foreground" />,
}

export function TodoPanel({ todos }: { todos: Todo[] }) {
  const done = todos.filter((t) => t.status === "completed").length

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Plan</h2>
        {todos.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{todos.length}
          </span>
        )}
      </div>
      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The lead&apos;s task list shows up here once it starts planning.
        </p>
      ) : (
        <ol className="space-y-2">
          {todos.map((todo, index) => (
            <li key={index} className="flex gap-2 text-sm">
              {icons[todo.status]}
              <span
                className={
                  todo.status === "completed"
                    ? "text-muted-foreground line-through"
                    : ""
                }
              >
                {todo.content}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
