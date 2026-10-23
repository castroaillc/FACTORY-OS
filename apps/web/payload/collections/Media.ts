import type { CollectionConfig } from "payload"

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "card", width: 768 },
      // 1200x630 is the recommended Open Graph image size
      { name: "og", width: 1200, height: 630, crop: "center" },
    ],
  },
}
