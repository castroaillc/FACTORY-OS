"use client"

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import { Analytics as VercelAnalytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import * as React from "react"

import { MetaPixel } from "@/components/analytics/meta-pixel"
import { useConsent } from "@/components/consent/consent-provider"

const gtmId = process.env.NEXT_PUBLIC_GTM_ID
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

// Google Consent Mode v2: tell Google tags what the visitor agreed to
function GoogleConsentMode({
  analytics,
  marketing,
}: {
  analytics: boolean
  marketing: boolean
}) {
  const initialized = React.useRef(false)

  React.useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function gtag() {
        // gtag.js expects the `arguments` object, not an array
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments)
      }
    window.gtag("consent", initialized.current ? "update" : "default", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: marketing ? "granted" : "denied",
      ad_user_data: marketing ? "granted" : "denied",
      ad_personalization: marketing ? "granted" : "denied",
    })
    initialized.current = true
  }, [analytics, marketing])

  return null
}

export function Analytics() {
  const { consent } = useConsent()
  const analytics = consent?.analytics ?? false
  const marketing = consent?.marketing ?? false
  const loadGoogle = analytics && Boolean(gtmId || gaId)

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
      {/* Must render before the Google tags so the consent default is queued first */}
      {loadGoogle && (
        <GoogleConsentMode analytics={analytics} marketing={marketing} />
      )}
      {loadGoogle && gtmId && <GoogleTagManager gtmId={gtmId} />}
      {loadGoogle && gaId && <GoogleAnalytics gaId={gaId} />}
      {marketing && metaPixelId && <MetaPixel pixelId={metaPixelId} />}
    </>
  )
}
