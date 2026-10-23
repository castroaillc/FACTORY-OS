export const CONSENT_COOKIE = "cookie_consent"
// Bump when categories change so everyone is asked again
export const CONSENT_VERSION = 1
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export type ConsentCategory = "analytics" | "marketing"

export type Consent = Record<ConsentCategory, boolean> & {
  version: number
  updatedAt: string
}

export function readConsent(): Consent | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1)
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Consent
    return parsed.version === CONSENT_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function writeConsent(choices: Record<ConsentCategory, boolean>) {
  const consent: Consent = {
    ...choices,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  }
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(consent)
  )}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  return consent
}
