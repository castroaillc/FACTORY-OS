"use client"

import { GitPullRequest, ShieldAlert, Upload } from "lucide-react"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import type {
  ActionRequest,
  Decision,
  DecisionType,
  HITLRequest,
} from "@/lib/agents/messages"

const actionLabels: Record<string, { title: string; icon: React.ReactNode }> = {
  git_push: {
    title: "Push branch to GitHub",
    icon: <Upload className="size-4" />,
  },
  github_open_pull_request: {
    title: "Open pull request",
    icon: <GitPullRequest className="size-4" />,
  },
}

/** Approve, edit or reject the actions a paused agent wants to take. */
export function ApprovalCard({
  request,
  disabled,
  onSubmit,
}: {
  request: HITLRequest
  disabled?: boolean
  onSubmit: (decisions: Decision[]) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="size-4 text-amber-600" />
        Approval needed
      </div>
      <ActionForms request={request} disabled={disabled} onSubmit={onSubmit} />
    </div>
  )
}

function ActionForms({
  request,
  disabled,
  onSubmit,
}: {
  request: HITLRequest
  disabled?: boolean
  onSubmit: (decisions: Decision[]) => void
}) {
  // One decision per requested action, in order
  const [drafts, setDrafts] = React.useState(() =>
    request.actionRequests.map((action) => ({
      args: { ...action.args },
      reason: "",
    }))
  )

  const allowed = (action: ActionRequest): DecisionType[] =>
    request.reviewConfigs.find((c) => c.actionName === action.name)
      ?.allowedDecisions ?? ["approve", "reject"]

  function decide(type: "approve" | "reject") {
    onSubmit(
      request.actionRequests.map((action, index): Decision => {
        const draft = drafts[index]!
        if (type === "reject") {
          return {
            type: "reject",
            message: draft.reason || "Rejected by reviewer",
          }
        }
        const edited =
          JSON.stringify(draft.args) !== JSON.stringify(action.args)
        return edited && allowed(action).includes("edit")
          ? {
              type: "edit",
              editedAction: { name: action.name, args: draft.args },
            }
          : { type: "approve" }
      })
    )
  }

  return (
    <div className="space-y-4">
      {request.actionRequests.map((action, index) => {
        const label = actionLabels[action.name]
        const draft = drafts[index]!
        const editable = allowed(action).includes("edit")
        const setArg = (key: string, value: unknown) =>
          setDrafts((prev) =>
            prev.map((d, i) =>
              i === index ? { ...d, args: { ...d.args, [key]: value } } : d
            )
          )

        return (
          <div key={index} className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {label?.icon}
              <span className="font-medium">{label?.title ?? action.name}</span>
            </div>
            {action.name === "github_open_pull_request" && editable ? (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`pr-title-${index}`}>Title</Label>
                  <Input
                    id={`pr-title-${index}`}
                    value={String(draft.args.title ?? "")}
                    onChange={(e) => setArg("title", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`pr-body-${index}`}>Description</Label>
                  <Textarea
                    id={`pr-body-${index}`}
                    rows={6}
                    value={String(draft.args.body ?? "")}
                    onChange={(e) => setArg("body", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              Object.keys(action.args).length > 0 && (
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(action.args, null, 2)}
                </pre>
              )
            )}
            <Input
              aria-label="Reason if rejecting"
              placeholder="Reason if rejecting (sent back to the agent)"
              value={draft.reason}
              onChange={(e) =>
                setDrafts((prev) =>
                  prev.map((d, i) =>
                    i === index ? { ...d, reason: e.target.value } : d
                  )
                )
              }
            />
          </div>
        )
      })}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => decide("reject")}
        >
          Reject
        </Button>
        <Button disabled={disabled} onClick={() => decide("approve")}>
          Approve
        </Button>
      </div>
    </div>
  )
}
