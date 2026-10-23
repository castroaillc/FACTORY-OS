import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ApplicationShell1 } from "@/components/application-shell1"
import { auth } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?callbackURL=/dashboard")

  const { name, email, image } = session.user

  return (
    <ApplicationShell1 user={{ name, email, image }}>
      {children}
    </ApplicationShell1>
  )
}
