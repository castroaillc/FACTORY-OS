import type { Metadata } from "next"

import { Blog7 } from "@/components/blog7"
import {
  absoluteUrl,
  categoriesOf,
  formatDate,
  getPublishedPosts,
  mediaOf,
  postUrl,
} from "@/lib/blog"
import { siteConfig } from "@/lib/site"

export const revalidate = 3600

const description = `Guides, product updates, and ideas from the ${siteConfig.name} team.`

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    title: `Blog · ${siteConfig.name}`,
    description,
    url: absoluteUrl("/blog"),
  },
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  return (
    <Blog7
      heading="Blog"
      description={description}
      posts={posts.map((post) => {
        const cover = mediaOf(post.coverImage)
        return {
          id: post.id,
          title: post.title,
          summary: post.excerpt,
          href: postUrl(post),
          image: cover?.url
            ? { src: cover.sizes?.card?.url ?? cover.url, alt: cover.alt }
            : undefined,
          category: categoriesOf(post)[0]?.title,
          author: post.authorName ?? undefined,
          date: formatDate(post.publishedAt),
          dateTime: post.publishedAt ?? undefined,
        }
      })}
    />
  )
}
