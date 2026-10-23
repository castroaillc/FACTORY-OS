import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Login2 } from "@/components/login2"
import { auth } from "@/lib/auth"
import { safeCallbackURL, siteConfig } from "@/lib/site"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const callbackURL = safeCallbackURL((await searchParams).callbackURL)

  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect(callbackURL)

  return (
    <Login2
      heading={`Sign in to ${siteConfig.name}`}
      logo={siteConfig.logo}
      buttonText="Sign in"
      callbackURL={callbackURL}
    />
  )
}
