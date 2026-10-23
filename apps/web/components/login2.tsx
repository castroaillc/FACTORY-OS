"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { cn } from "cn"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Divider, SocialButtons } from "@/components/auth/social-buttons"
import { authClient } from "@/lib/auth-client"
interface Login2Props {
  heading?: string
  logo: {
    url: string
    src: string
    alt: string
    title?: string
    className?: string
  }
  buttonText?: string
  signupText?: string
  signupUrl?: string
  callbackURL?: string
  className?: string
}

const Login2 = ({
  heading = "Login",
  logo,
  buttonText = "Login",
  signupText = "Need an account?",
  signupUrl = "/signup",
  callbackURL = "/dashboard",
  className,
}: Login2Props) => {
  const router = useRouter()
  const [pending, setPending] = React.useState<"password" | "magic" | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [magicLinkSentTo, setMagicLinkSentTo] = React.useState<string | null>(
    null
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setPending("password")
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL,
    })
    if (error) {
      setError(error.message ?? "Invalid email or password")
      setPending(null)
      return
    }
    router.push(callbackURL)
    router.refresh()
  }

  async function sendMagicLink(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    const emailInput = form?.elements.namedItem("email") as HTMLInputElement
    if (!emailInput.reportValidity()) return
    setError(null)
    setPending("magic")
    const { error } = await authClient.signIn.magicLink({
      email: emailInput.value,
      callbackURL,
    })
    setPending(null)
    if (error) {
      setError(error.message ?? "Could not send magic link")
      return
    }
    setMagicLinkSentTo(emailInput.value)
  }

  return (
    <section className={cn("min-h-svh bg-muted px-4", className)}>
      <div className="flex min-h-svh items-center justify-center py-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 lg:justify-start">
          {/* Logo */}
          <Link href={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </Link>
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col items-center gap-y-4 rounded-md border border-muted bg-background px-6 py-8 shadow-md"
          >
            {heading && <h1 className="text-xl font-semibold">{heading}</h1>}
            {magicLinkSentTo ? (
              <p className="text-center text-sm text-muted-foreground">
                Check{" "}
                <span className="font-medium text-foreground">
                  {magicLinkSentTo}
                </span>{" "}
                for a sign-in link.
              </p>
            ) : (
              <>
                <SocialButtons callbackURL={callbackURL} onError={setError} />
                <Divider>or continue with email</Divider>
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    className="text-sm"
                    required
                  />
                </div>
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    className="text-sm"
                    required
                  />
                </div>
                {error && (
                  <p role="alert" className="w-full text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending !== null}
                >
                  {pending === "password" ? "Signing in…" : buttonText}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={pending !== null}
                  onClick={sendMagicLink}
                >
                  {pending === "magic"
                    ? "Sending link…"
                    : "Email me a magic link"}
                </Button>
              </>
            )}
          </form>
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>{signupText}</p>
            <Link
              href={signupUrl}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Login2 }
