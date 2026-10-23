import { Hero7 } from "@/components/hero7"

export default function Page() {
  return (
    <Hero7
      heading="The fastest way to launch your next app."
      description="Authentication, a polished app shell, and a marketing site out of the box — so you can focus on the product your users actually came for."
      buttons={{
        primary: { text: "Get started for free", url: "/signup" },
      }}
    />
  )
}
