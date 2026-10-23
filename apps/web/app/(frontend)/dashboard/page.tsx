import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  // Layouts don't re-run on every navigation, so pages verify the session too
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?callbackURL=/dashboard")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back, {session.user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.email}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="aspect-video rounded-xl bg-muted/50" />
        ))}
      </div>
      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50" />
    </div>
  )
}
