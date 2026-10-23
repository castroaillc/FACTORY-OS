import { track as vercelTrack } from "@vercel/analytics"

type Props = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    google_tag_manager?: unknown
  }
}

// Meta standard events; everything else is sent as a custom event
const metaStandardEvents: Record<string, string> = {
  sign_up: "CompleteRegistration",
  generate_lead: "Lead",
}

/**
 * Send a product event to every analytics tool the visitor consented to.
 * Google/Meta functions only exist once their (consent-gated) scripts load.
 */
export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return

  // Cookieless, no consent needed
  vercelTrack(event, props)

  // Prefer GTM when present so GA4 tags configured there don't double count
  if (window.google_tag_manager) {
    window.dataLayer?.push({ event, ...props })
  } else {
    window.gtag?.("event", event, props)
  }

  const metaEvent = metaStandardEvents[event]
  if (metaEvent) window.fbq?.("track", metaEvent, props)
  else window.fbq?.("trackCustom", event, props)
}
