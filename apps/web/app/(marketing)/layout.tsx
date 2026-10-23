import { Footer7 } from "@/components/footer7"
import { Navbar1 } from "@/components/navbar1"
import { siteConfig } from "@/lib/site"

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Navbar1 logo={siteConfig.logo} />
      </header>
      <main className="flex-1">{children}</main>
      <Footer7
        className="py-16"
        logo={siteConfig.logo}
        description={siteConfig.description}
        copyright={`© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`}
      />
    </div>
  )
}
