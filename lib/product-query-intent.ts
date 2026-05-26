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
  /\bcompatible\s+with\b/i,
  /\bfor\s+iphone\b/i,
  /\bfor\s+galaxy\b/i,
  /\bfor\s+pixel\b/i,
  /\bmagnetic\s+back\b/i,
  /\bmagsafe\s+case\b/i,
  /\bsilicone\b/i,
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
    /\biphone\b|\bgalaxy\s*(s|z|a|m)?\d|\bz\s*fold\b|\bfold\s*[67]\b|\bsamsung\s*fold\b|\bpixel\s*\d|\boneplus\b|\bnothing\s*phone|\biqoo\b|\breno\b|\bvivo\s*x|\bredmi\b|\brealme\s*\d|\bmotorola\s*edge/i.test(
      q
    )
  ) {
    const isPremiumPhone =
      /\biphone\s*(1[0-9]|[6-9])\b|\biphone\s*pro\b|\biphone\s*air\b|\bgalaxy\s*s2[4-9]\b|\bgalaxy\s*z\s*fold\b|\bgalaxy\s*z\s*flip\b|\bz\s*fold\s*[67]\b|\bsamsung\s*galaxy\s*z\s*fold\b|\bpixel\s*[89]\b/i.test(
        q
      )
    return {
      kind: "phone",
      minPrice: isPremiumPhone ? 45_000 : 8_000,
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
  const t = title.toLowerCase()
  if (intent.excludeTitlePatterns.some((p) => p.test(title))) return true
  if (intent.kind !== "phone") return false
  if (/\b(case|cover|skin|pouch|strap|guard|bumper)\b/i.test(t)) return true
  if (/\bcompatible\b/i.test(t) && /\b(iphone|galaxy|pixel|oneplus)\b/i.test(t)) {
    return true
  }
  return false
}

/** True when title looks like a handset, not an accessory */
export function isPhoneDeviceListing(title: string, intent: ProductIntent): boolean {
  if (intent.kind !== "phone") return true
  if (isAccessoryListing(title, intent)) return false
  const t = title.toLowerCase()
  if (/\b(smartphone|mobile\s*phone|5g\s*phone|cell\s*phone)\b/i.test(t)) {
    return true
  }
  if (/\b(128gb|256gb|512gb|1tb)\b/i.test(t) && !/\b(case|cover)\b/i.test(t)) {
    return true
  }
  if (
    /\b(iphone|galaxy\s*(s|z|a)?\d|z\s*fold|fold\s*[67]|pixel\s*\d|oneplus\s*\d|nothing\s*phone)\b/i.test(
      t
    ) &&
    !/\b(for|compatible|case|cover|silicone|magnetic)\b/i.test(t)
  ) {
    return true
  }
  return false
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
