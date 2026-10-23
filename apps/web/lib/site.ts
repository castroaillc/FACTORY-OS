export const siteConfig = {
  name: "Acme",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
  description:
    "Ship your product faster with a secure, ready-to-go app foundation.",
  logo: {
    url: "/",
    src: "/logo.svg",
    alt: "Acme logo",
    title: "Acme",
  },
}

// Only allow same-origin relative paths to avoid open redirects via ?callbackURL=
export function safeCallbackURL(
  value: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback
  return value
}
