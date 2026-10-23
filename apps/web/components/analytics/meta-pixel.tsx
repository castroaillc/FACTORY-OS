"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import * as React from "react"

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstLoad = React.useRef(true)

  React.useEffect(() => {
    // The init snippet already tracks the first PageView
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }
    window.fbq?.("track", "PageView")
  }, [pathname, searchParams])

  return null
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(pixelId)});
fbq('track', 'PageView');`}
      </Script>
      {/* useSearchParams needs a Suspense boundary to keep pages static */}
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
    </>
  )
}
