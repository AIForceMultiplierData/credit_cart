/** Infer shopping intent from free-text query — filters accessories & junk prices */

export type ProductKind =
  | "phone"
  | "laptop"
  | "tablet"
  | "watch"
  | "headphones"
  | "generic"

export type ProductIntent = {
  kind: ProductKind
  minPrice: number
  maxPrice: number
  excludeTitlePatterns: RegExp[]
}

const ACCESSORY_PATTERNS = [
  /\bback\s*cover\b/i,
  /\bcase\s+for\b/i,
  /\bcover\s+for\b/i,
  /\bflip\s*cover\b/i,
  /\btempered\s*glass\b/i,
  /\bscreen\s*guard\b/i,
  /\bprotector\b/i,
  /\bphone\s*case\b/i,
  /\bsilicone\s*case\b/i,
  /\bbumper\b/i,
  /\bstrap\b/i,
  /\bband\s+for\b/i,
  /\bcharger\b/i,
  /\bcable\b/i,
  /\badapter\b/i,
  /\bpower\s*bank\b/i,
  /\bmount\b/i,
  /\bstand\s+for\b/i,
  /\bskin\b/i,
  /\bpouch\b/i,
  /\brental\b/i,
  /\brent\s+/i,
  /\blease\b/i,
  /\bsharepal\b/i,
  /\bsubscription\b/i,
  /\brefurbished\s*grade\b/i,
]

export function inferProductIntent(query: string): ProductIntent {
  const q = query.toLowerCase().replace(/\s+/g, " ").trim()

  if (
    /\biphone\b|\bgalaxy\s*(s|z|a|m)?\d|\bpixel\s*\d|\boneplus\b|\bnothing\s*phone|\biqoo\b|\breno\b|\bvivo\s*x|\bredmi\b|\brealme\s*\d|\bmotorola\s*edge/i.test(
      q
    )
  ) {
    return {
      kind: "phone",
      minPrice: 8_000,
      maxPrice: 250_000,
      excludeTitlePatterns: ACCESSORY_PATTERNS,
    }
  }

  if (/\blaptop\b|\bmacbook\b|\bnotebook\b|\bultrabook\b/i.test(q)) {
    return {
      kind: "laptop",
      minPrice: 18_000,
      maxPrice: 400_000,
      excludeTitlePatterns: ACCESSORY_PATTERNS,
    }
  }

  if (/\bipad\b|\btablet\b|\btab\s+s\d/i.test(q)) {
    return {
      kind: "tablet",
      minPrice: 8_000,
      maxPrice: 200_000,
      excludeTitlePatterns: ACCESSORY_PATTERNS,
    }
  }

  if (/\bwatch\b|\bwatch\s*ultra\b|\bgalaxy\s*watch|\bfitbit\b/i.test(q)) {
    return {
      kind: "watch",
      minPrice: 1_500,
      maxPrice: 120_000,
      excludeTitlePatterns: [
        ...ACCESSORY_PATTERNS,
        /\bwatch\s*strap\b/i,
      ],
    }
  }

  if (
    /\bheadphone\b|\bearbuds\b|\bear\s*pods\b|\bairpods\b|\bneckband\b|\bspeaker\b/i.test(
      q
    )
  ) {
    return {
      kind: "headphones",
      minPrice: 499,
      maxPrice: 80_000,
      excludeTitlePatterns: [
        ...ACCESSORY_PATTERNS,
        /\bear\s*tip\b/i,
      ],
    }
  }

  return {
    kind: "generic",
    minPrice: 299,
    maxPrice: 500_000,
    excludeTitlePatterns: [
      /\bback\s*cover\b/i,
      /\bcase\s+for\b/i,
      /\bsharepal\b/i,
      /\brental\b/i,
    ],
  }
}

export function isAccessoryListing(title: string, intent: ProductIntent): boolean {
  return intent.excludeTitlePatterns.some((p) => p.test(title))
}

export function titleMatchesQuery(title: string, query: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
  const t = normalize(title)
  const q = normalize(query)
  const tokens = q.split(" ").filter((w) => w.length > 2)
  if (tokens.length === 0) return true
  const matched = tokens.filter((tok) => t.includes(tok)).length
  return matched >= Math.min(2, tokens.length)
}
