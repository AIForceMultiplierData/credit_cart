/** Parse storage / colour hints from marketplace titles */

export type ProductVariantHints = {
  storage_gb?: string
  color?: string
  variant_label?: string
}

const STORAGE_RE =
  /\b(64|128|256|512|1024|1)\s*(gb|tb)\b/i

const COLOR_WORDS = [
  "natural titanium",
  "blue titanium",
  "white titanium",
  "black titanium",
  "desert titanium",
  "cosmic orange",
  "deep purple",
  "phantom black",
  "midnight",
  "starlight",
  "graphite",
  "silver",
  "gold",
  "rose gold",
  "space black",
  "space grey",
  "space gray",
  "product red",
  "pacific blue",
  "sierra blue",
  "alpine green",
  "lavender",
  "mint",
  "coral",
  "teal",
  "black",
  "white",
  "blue",
  "green",
  "pink",
  "purple",
  "red",
  "yellow",
  "orange",
  "grey",
  "gray",
]

export function parseProductVariantHints(title: string): ProductVariantHints {
  const t = title.trim()
  if (!t) return {}

  const storageMatch = t.match(STORAGE_RE)
  const storage_gb = storageMatch
    ? `${storageMatch[1]}${storageMatch[2].toLowerCase() === "tb" ? "TB" : "GB"}`
    : undefined

  const lower = t.toLowerCase()
  let color: string | undefined
  for (const c of COLOR_WORDS) {
    if (lower.includes(c)) {
      color = c.replace(/\b\w/g, (ch) => ch.toUpperCase())
      break
    }
  }

  const parts = [storage_gb, color].filter(Boolean)
  const variant_label = parts.length > 0 ? parts.join(" · ") : undefined

  return { storage_gb, color, variant_label }
}
