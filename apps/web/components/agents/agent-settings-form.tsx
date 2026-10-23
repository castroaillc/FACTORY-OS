"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import type { AgentFormState } from "@/app/(frontend)/dashboard/agents/actions"
import { MODEL_SUGGESTIONS, type AgentFormValues } from "@/lib/agents/settings"

type Field = {
  name: keyof AgentFormValues
  label: string
  placeholder?: string
  hint?: string
  list?: string
}

const sections: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Agent",
    description: "How this team appears in the dashboard.",
    fields: [
      { name: "name", label: "Name", placeholder: "Factory OS engineers" },
      {
        name: "description",
        label: "Description",
        placeholder: "Ships small features and fixes for the web app",
      },
    ],
  },
  {
    title: "Repository",
    description:
      "Where the team works. The agent server's GitHub token must have access, and the repo must be in GITHUB_ALLOWED_REPOS if that is set.",
    fields: [
      {
        name: "githubRepo",
        label: "GitHub repository",
        placeholder: "owner/name",
        hint: "Leave empty to use GITHUB_REPO from the agent server.",
      },
      {
        name: "baseBranch",
        label: "Base branch",
        placeholder: "main",
        hint: "Branches are created from and PRs target this branch.",
      },
    ],
  },
  {
    title: "Models",
    description:
      'Any "provider:model" supported by LangChain. The matching API key must be set on the agent server.',
    fields: [
      {
        name: "orchestratorModel",
        label: "Lead (orchestrator)",
        placeholder: "Server default",
        list: "model-suggestions",
      },
      {
        name: "subagentModel",
        label: "Sub-agents",
        placeholder: "Server default",
        list: "model-suggestions",
      },
    ],
  },
]

export function AgentSettingsForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: (state: AgentFormState, formData: FormData) => Promise<AgentFormState>
  defaults?: Partial<AgentFormValues>
  submitLabel: string
  cancelHref: string
}) {
  const [state, formAction, pending] = React.useActionState(action, {})
  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0]
  const valueFor = (name: keyof AgentFormValues) =>
    state.values?.[name] ?? defaults?.[name] ?? ""

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8">
      <datalist id="model-suggestions">
        {MODEL_SUGGESTIONS.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>

      {sections.map((section) => (
        <fieldset
          key={section.title}
          className="grid gap-6 border-b pb-8 md:grid-cols-[220px_1fr]"
        >
          <div className="space-y-1">
            <legend className="font-medium">{section.title}</legend>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  list={field.list}
                  placeholder={field.placeholder}
                  defaultValue={valueFor(field.name)}
                  aria-invalid={Boolean(errorFor(field.name))}
                  autoComplete="off"
                />
                {errorFor(field.name) ? (
                  <p className="text-xs text-destructive">
                    {errorFor(field.name)}
                  </p>
                ) : (
                  field.hint && (
                    <p className="text-xs text-muted-foreground">
                      {field.hint}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <legend className="font-medium">Instructions</legend>
          <p className="text-sm text-muted-foreground">
            Added to the lead&apos;s system prompt, e.g. conventions, areas to
            avoid, or how to run tests.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Textarea
            id="instructions"
            name="instructions"
            rows={6}
            maxLength={4000}
            placeholder="Use pnpm. Run `pnpm typecheck && pnpm lint` before handing off. Never touch apps/web/payload/migrations."
            defaultValue={valueFor("instructions")}
            aria-invalid={Boolean(errorFor("instructions"))}
          />
          {errorFor("instructions") && (
            <p className="text-xs text-destructive">
              {errorFor("instructions")}
            </p>
          )}
        </div>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          render={<Link href={cancelHref} />}
          nativeButton={false}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
