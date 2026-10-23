// Seeds a sample category and published post.
// Run with: pnpm payload run payload/seed.ts
import config from "@payload-config"
import { getPayload } from "payload"

type LexicalNode = { type: string; version: number; [key: string]: unknown }

const text = (value: string, format = 0): LexicalNode => ({
  type: "text",
  text: value,
  format,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
})

const block = (type: string, children: LexicalNode[], extra = {}) => ({
  type,
  children,
  direction: "ltr" as const,
  format: "" as const,
  indent: 0,
  version: 1,
  ...extra,
})

const paragraph = (...children: LexicalNode[]) =>
  block("paragraph", children, { textFormat: 0, textStyle: "" })
const heading = (tag: "h2" | "h3", value: string) =>
  block("heading", [text(value)], { tag })

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

const existing = await payload.find({
  collection: "posts",
  where: { slug: { equals: "hello-world" } },
  limit: 1,
})

if (existing.docs.length > 0) {
  payload.logger.info("Seed post already exists, skipping")
} else {
  const category = await payload.create({
    collection: "categories",
    data: { title: "Announcements", slug: "" },
    context,
  })

  await payload.create({
    collection: "posts",
    context,
    data: {
      title: "Hello, world",
      slug: "hello-world",
      excerpt:
        "Welcome to the blog. Here is what we're building and why it matters.",
      authorName: "The Team",
      categories: [category.id],
      _status: "published",
      content: {
        root: block("root", [
          paragraph(
            text("This post was created by the seed script. Edit it in the "),
            text("Payload admin", 1),
            text(" at /admin.")
          ),
          heading("h2", "What you get"),
          paragraph(
            text(
              "Server-rendered posts with Open Graph tags, JSON-LD, a sitemap, an RSS feed, and llms.txt for AI search engines."
            )
          ),
        ]),
      },
    },
  })
  payload.logger.info("Seeded category and post: /blog/hello-world")
}

process.exit(0)
