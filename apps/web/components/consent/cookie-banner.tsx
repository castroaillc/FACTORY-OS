"use client"

import { Cookie } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useConsent } from "@/components/consent/consent-provider"

export function CookieBanner() {
  const { save, openPreferences } = useConsent()

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl animate-in rounded-xl border bg-background p-4 shadow-lg duration-300 fade-in-0 slide-in-from-bottom-4 sm:p-5"
    >
      <div className="flex gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">We value your privacy</p>
            <p className="text-sm text-muted-foreground">
              We use cookies for analytics and marketing to improve the site.
              Nothing is tracked until you choose. You can change this anytime
              from &ldquo;Cookie settings&rdquo; in the footer.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={openPreferences}>
              Customize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              Reject all
            </Button>
            <Button
              size="sm"
              onClick={() => save({ analytics: true, marketing: true })}
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
