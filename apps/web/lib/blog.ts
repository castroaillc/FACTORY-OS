import "server-only"

import config from "@payload-config"
import {
  convertLexicalToMarkdown,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical"
import { getPayload } from "payload"
import { cache } from "react"

import type { Category, Media, Post } from "@/payload-types"
import { siteConfig } from "@/lib/site"

export type { Post }

const getPayloadClient = cache(() => getPayload({ config }))

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${siteConfig.url}${path}`
}

export function postUrl(post: Pick<Post, "slug">) {
  return `/blog/${post.slug}`
}

export function mediaOf(value: Post["coverImage"]): Media | null {
  return value && typeof value === "object" ? value : null
}

export function categoriesOf(post: Post): Category[] {
  return (post.categories ?? []).filter(
    (c): c is Category => typeof c === "object"
  )
}

export function formatDate(value?: string | null) {
  if (!value) return undefined
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
    new Date(value)
  )
}

export const getPublishedPosts = cache(async (limit = 100) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" } },
    sort: "-publishedAt",
    limit,
    depth: 1,
    // Public pages must never leak drafts, regardless of who is logged in
    overrideAccess: false,
  })
  return docs
})

export const getPostBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "posts",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

export async function postToMarkdown(post: Post) {
  const payload = await getPayloadClient()
  const editorConfig = await editorConfigFactory.default({
    config: payload.config,
  })
  return convertLexicalToMarkdown({ data: post.content, editorConfig })
}
