import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Signup2 } from "@/components/signup2"
import { auth } from "@/lib/auth"
import { siteConfig } from "@/lib/site"

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect("/dashboard")

  return <Signup2 heading="Create your account" logo={siteConfig.logo} />
}
