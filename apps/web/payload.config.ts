import path from "node:path"
import { fileURLToPath } from "node:url"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"
import { buildConfig } from "payload"
import sharp from "sharp"

import { siteConfig } from "@/lib/site"
import { Categories } from "@/payload/collections/Categories"
import { Media } from "@/payload/collections/Media"
import { Posts } from "@/payload/collections/Posts"
import { Users } from "@/payload/collections/Users"
import { migrations } from "@/payload/migrations"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ` · ${siteConfig.name} CMS`,
    },
  },
  collections: [Posts, Categories, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: siteConfig.url,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    // Own schema so Payload never touches Better Auth's tables in `public`
    schemaName: "payload",
    // Schema changes go through migrations (pnpm payload migrate:create), never dev push
    push: false,
    migrationDir: path.resolve(dirname, "payload/migrations"),
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: [Posts.slug],
      uploadsCollection: Media.slug,
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? ""} · ${siteConfig.name}`,
      generateDescription: ({ doc }) => doc?.excerpt ?? "",
      generateURL: ({ doc }) => `${siteConfig.url}/blog/${doc?.slug ?? ""}`,
    }),
    vercelBlobStorage({
      // Falls back to local disk (./media) when no Blob token is configured
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { [Media.slug]: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
