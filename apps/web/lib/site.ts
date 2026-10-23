export const siteConfig = {
  name: "Acme",
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
