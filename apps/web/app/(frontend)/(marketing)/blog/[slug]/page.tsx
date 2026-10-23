import { RichText } from "@payloadcms/richtext-lexical/react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Blogpost2 } from "@/components/blogpost2"
import { JsonLd } from "@/components/seo/json-ld"
import {
  absoluteUrl,
  categoriesOf,
  formatDate,
  getPostBySlug,
  getPublishedPosts,
  mediaOf,
  postUrl,
} from "@/lib/blog"
import { siteConfig } from "@/lib/site"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post) return {}

  const title = post.meta?.title || post.title
  const description = post.meta?.description || post.excerpt
  const image = mediaOf(post.meta?.image) ?? mediaOf(post.coverImage)
  const ogImage = image?.sizes?.og?.url ?? image?.url

  return {
    // meta.title already includes the site name, so skip the layout template
    title: post.meta?.title ? { absolute: post.meta.title } : post.title,
    description,
    alternates: { canonical: postUrl(post) },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(postUrl(post)),
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: categoriesOf(post).map((c) => c.title),
      images: ogImage
        ? [
            {
              url: absoluteUrl(ogImage),
              alt: image?.alt,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()

  const cover = mediaOf(post.coverImage)
  const url = absoluteUrl(postUrl(post))

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          url,
          mainEntityOfPage: url,
          datePublished: post.publishedAt ?? post.createdAt,
          dateModified: post.updatedAt,
          image: cover?.url ? [absoluteUrl(cover.url)] : undefined,
          author: post.authorName
            ? { "@type": "Person", name: post.authorName }
            : { "@type": "Organization", name: siteConfig.name },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            logo: absoluteUrl(siteConfig.logo.src),
          },
          keywords: categoriesOf(post)
            .map((c) => c.title)
            .join(", "),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Blog",
              item: absoluteUrl("/blog"),
            },
            { "@type": "ListItem", position: 2, name: post.title, item: url },
          ],
        }}
      />
      <Blogpost2
        title={post.title}
        date={formatDate(post.publishedAt)}
        dateTime={post.publishedAt ?? undefined}
        image={cover?.url ? { src: cover.url, alt: cover.alt } : undefined}
        author={post.authorName ? { name: post.authorName } : undefined}
        body={<RichText data={post.content} />}
      />
    </>
  )
}
