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
interface Signup2Props {
  heading?: string
  logo: {
    url: string
    src: string
    alt: string
    title?: string
  }
  buttonText?: string
  signupText?: string
  signupUrl?: string
  callbackURL?: string
  className?: string
}

const Signup2 = ({
  heading = "Signup",
  logo,
  buttonText = "Create Account",
  signupText = "Already a user?",
  signupUrl = "/login",
  callbackURL = "/dashboard",
  className,
}: Signup2Props) => {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password"))
    if (password !== form.get("confirmPassword")) {
      setError("Passwords do not match")
      return
    }
    setError(null)
    setPending(true)
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password,
      callbackURL,
    })
    if (error) {
      setError(error.message ?? "Could not create account")
      setPending(false)
      return
    }
    router.push(callbackURL)
    router.refresh()
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
            <SocialButtons callbackURL={callbackURL} onError={setError} />
            <Divider>or sign up with email</Divider>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Name"
                className="text-sm"
                required
              />
            </div>
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
                autoComplete="new-password"
                placeholder="Password"
                className="text-sm"
                minLength={8}
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Password"
                className="text-sm"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p role="alert" className="w-full text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : buttonText}
            </Button>
          </form>
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>{signupText}</p>
            <Link
              href={signupUrl}
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Signup2 }
