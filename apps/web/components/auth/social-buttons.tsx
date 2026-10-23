"use client"

import * as React from "react"
import { FaGithub, FaGoogle } from "react-icons/fa"

import { Button } from "@workspace/ui/components/button"
import { authClient } from "@/lib/auth-client"

const providers = [
  { id: "github", label: "GitHub", icon: FaGithub },
  { id: "google", label: "Google", icon: FaGoogle },
] as const

export function SocialButtons({
  callbackURL,
  onError,
}: {
  callbackURL: string
  onError: (message: string) => void
}) {
  const [pending, setPending] = React.useState<string | null>(null)

  async function signInWith(provider: (typeof providers)[number]["id"]) {
    setPending(provider)
    const { error } = await authClient.signIn.social({ provider, callbackURL })
    if (error) {
      onError(error.message ?? `Could not sign in with ${provider}`)
      setPending(null)
    }
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      {providers.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => signInWith(id)}
        >
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
