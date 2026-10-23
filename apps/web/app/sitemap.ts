import type { MetadataRoute } from "next"

import { absoluteUrl, getPublishedPosts, postUrl } from "@/lib/blog"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts(1000)

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/blog"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/signup"), changeFrequency: "yearly", priority: 0.5 },
    ...posts.map((post) => ({
      url: absoluteUrl(postUrl(post)),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
