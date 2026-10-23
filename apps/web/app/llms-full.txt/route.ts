import {
  absoluteUrl,
  getPublishedPosts,
  postToMarkdown,
  postUrl,
} from "@/lib/blog"
import { siteConfig } from "@/lib/site"

export const revalidate = 3600

// Full article text as Markdown so AI answer engines can quote it accurately
export async function GET() {
  const posts = await getPublishedPosts()

  const articles = await Promise.all(
    posts.map(async (post) =>
      [
        `## ${post.title}`,
        "",
        `URL: ${absoluteUrl(postUrl(post))}`,
        post.publishedAt ? `Published: ${post.publishedAt.slice(0, 10)}` : "",
        post.authorName ? `Author: ${post.authorName}` : "",
        "",
        `> ${post.excerpt}`,
        "",
        // Demote headings so they nest under the article's own "##" title
        (await postToMarkdown(post)).replace(/^(#{1,5}) /gm, "#$1 "),
      ]
        .filter((line, i, all) => line !== "" || all[i - 1] !== "")
        .join("\n")
    )
  )

  const body = [
    `# ${siteConfig.name} Blog`,
    "",
    `> ${siteConfig.description}`,
    "",
    ...articles.flatMap((article) => [article, "", "---", ""]),
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
