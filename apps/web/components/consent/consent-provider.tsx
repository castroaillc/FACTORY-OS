"use client"

import * as React from "react"

import {
  readConsent,
  writeConsent,
  type Consent,
  type ConsentCategory,
} from "@/lib/consent"
import { CookieBanner } from "@/components/consent/cookie-banner"
import { CookiePreferences } from "@/components/consent/cookie-preferences"

type ConsentContextValue = {
  consent: Consent | null
  save: (choices: Record<ConsentCategory, boolean>) => void
  openPreferences: () => void
}

const ConsentContext = React.createContext<ConsentContextValue | null>(null)

export function useConsent() {
  const context = React.useContext(ConsentContext)
  if (!context)
    throw new Error("useConsent must be used within ConsentProvider")
  return context
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // undefined = not read yet (SSR / first paint), null = no choice made
  const [consent, setConsent] = React.useState<Consent | null | undefined>()
  const [preferencesOpen, setPreferencesOpen] = React.useState(false)

  React.useEffect(() => {
    setConsent(readConsent())
  }, [])

  const save = React.useCallback(
    (choices: Record<ConsentCategory, boolean>) => {
      const revoked =
        (consent?.analytics && !choices.analytics) ||
        (consent?.marketing && !choices.marketing)
      setConsent(writeConsent(choices))
      setPreferencesOpen(false)
      // Already-loaded tracking scripts can't be unloaded, so start fresh
      if (revoked) window.location.reload()
    },
    [consent]
  )

  const value = React.useMemo(
    () => ({
      consent: consent ?? null,
      save,
      openPreferences: () => setPreferencesOpen(true),
    }),
    [consent, save]
  )

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {consent === null && !preferencesOpen && <CookieBanner />}
      <CookiePreferences
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </ConsentContext.Provider>
  )
}
