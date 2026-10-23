import { revalidatePath } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from "payload"

import { slugField } from "@/payload/fields/slug"

function revalidatePost(slug?: string | null) {
  try {
    revalidatePath("/blog")
    if (slug) revalidatePath(`/blog/${slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    revalidatePath("/llms.txt")
    revalidatePath("/llms-full.txt")
  } catch {
    // Not inside a Next.js request (e.g. running from the Payload CLI)
  }
}

const afterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  context,
}) => {
  if (context.disableRevalidate) return doc
  revalidatePost(doc.slug)
  // The old URL needs to drop out of the cache when a post is renamed or unpublished
  if (previousDoc?.slug && previousDoc.slug !== doc.slug)
    revalidatePost(previousDoc.slug)
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (!context.disableRevalidate) revalidatePost(doc?.slug)
  return doc
}

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "publishedAt"],
  },
  access: {
    // Logged-in editors see drafts; everyone else only sees published posts
    read: ({ req: { user } }) =>
      user ? true : { _status: { equals: "published" } },
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [afterChange],
    afterDelete: [afterDelete],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "Shown on cards and used as the default meta description and llms.txt summary.",
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    slugField("title"),
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) =>
            siblingData._status === "published" && !value ? new Date() : value,
        ],
      },
    },
    {
      name: "authorName",
      type: "text",
      admin: { position: "sidebar" },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: { position: "sidebar" },
    },
  ],
}
