import type { TextField } from "payload"

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Slug that defaults to a slugified version of `fromField` when left empty
export function slugField(fromField: string): TextField {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique: true,
    index: true,
    admin: {
      position: "sidebar",
      description: `Generated from ${fromField} if left empty.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === "string" && value.length > 0)
            return toSlug(value)
          const source = data?.[fromField]
          return typeof source === "string" ? toSlug(source) : value
        },
      ],
    },
  }
}
