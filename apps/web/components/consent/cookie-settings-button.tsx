"use client"

import { useConsent } from "@/components/consent/consent-provider"

export function CookieSettingsButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent()

  return (
    <button type="button" className={className} onClick={openPreferences}>
      Cookie settings
    </button>
  )
}
