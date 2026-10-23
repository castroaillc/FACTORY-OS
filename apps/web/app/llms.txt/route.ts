import { absoluteUrl, getPublishedPosts, postUrl } from "@/lib/blog"
import { siteConfig } from "@/lib/site"

export const revalidate = 3600

// https://llmstxt.org — a concise, LLM-friendly index of the site
export async function GET() {
  const posts = await getPublishedPosts()

  const body = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${absoluteUrl("/")}): Product overview`,
    `- [Blog](${absoluteUrl("/blog")}): All articles`,
    `- [Sign up](${absoluteUrl("/signup")}): Create an account`,
    "",
    "## Blog",
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${absoluteUrl(postUrl(post))}): ${post.excerpt}`
    ),
    "",
    "## Optional",
    "",
    `- [Full blog content](${absoluteUrl("/llms-full.txt")}): Every article as Markdown`,
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
