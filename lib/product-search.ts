import { buildProductSerperQuery as buildProductSerperQueryFromRules } from "@/lib/search-category-rules"

export type ProductSort = "best_card" | "cheapest"

export type ProductSearchParams = {
  /** What the user is shopping for */
  category: string | null
  subcategory: string | null
  brandModel: string | null
  /** Optional direct product URL (still cross-lists other stores) */
  pastedUrl: string | null
  estimatedPrice: number | null
  selectedListingId: string | null
  sort: ProductSort
}

export const PRODUCT_SORT_OPTIONS: Array<{ id: ProductSort; label: string }> = [
  { id: "best_card", label: "Best card + store combo" },
  { id: "cheapest", label: "Cheapest listing first" },
]

export function defaultProductSearchParams(): ProductSearchParams {
  return {
    category: null,
    subcategory: null,
    brandModel: null,
    pastedUrl: null,
    estimatedPrice: null,
    selectedListingId: null,
    sort: "best_card",
  }
}

export function buildProductSerperQuery(params: ProductSearchParams): string {
  const query = `${params.category} ${params.subcategory} ${params.brandModel}`
  return buildProductSerperQueryFromRules({ ...params, query })
}

export function buildProductReferenceUrl(params: ProductSearchParams): string {
  if (params.pastedUrl?.trim()) return params.pastedUrl.trim()
  const q = encodeURIComponent(
    `${params.category} ${params.subcategory} ${params.brandModel}`
  )
  return `https://www.google.com/search?tbm=shop&q=${q}`
}

export function buildProductProductTitle(params: ProductSearchParams): string {
  const q = `${params.category} ${params.subcategory} ${params.brandModel}`.trim()
  if (q.length > 0) return q
  if (params.pastedUrl) {
    try {
      const host = new URL(params.pastedUrl).hostname.replace(/^www\./, "")
      return `Product on ${host}`
    } catch {
      return "Product purchase"
    }
  }
  return "Product purchase"
}

export function validateProductSearch(
  params: ProductSearchParams,
  options?: { requirePrice?: boolean }
): { ok: true } | { ok: false; message: string } {
  const { category, subcategory, brandModel } = params
  const url = params.pastedUrl?.trim() ?? ""

  if (!category || !subcategory || !brandModel) {
    return {
      ok: false,
      message: "Please select a category, subcategory, and brand/model to search.",
    }
  }

  if (url && !/^https?:\/\//i.test(url)) {
    return { ok: false, message: "Paste a valid http or https product URL." }
  }

  const requirePrice = options?.requirePrice !== false
  if (
    requirePrice &&
    !params.selectedListingId &&
    (params.estimatedPrice === null || params.estimatedPrice <= 0)
  ) {
    return {
      ok: false,
      message: "Pick a store listing below, or enter price (₹) from checkout.",
    }
  }

  return { ok: true }
}

export function parseProductSearchBody(raw: unknown): ProductSearchParams | null {
  if (typeof raw !== "object" || raw === null) return null
  const b = raw as Record<string, unknown>
  const fare = Number(b.estimatedPrice)

  return {
    category: typeof b.category === "string" ? b.category : null,
    subcategory: typeof b.subcategory === "string" ? b.subcategory : null,
    brandModel: typeof b.brandModel === "string" ? b.brandModel : null,
    pastedUrl:
      typeof b.pastedUrl === "string" && b.pastedUrl.trim()
        ? b.pastedUrl.trim()
        : null,
    estimatedPrice:
      Number.isFinite(fare) && fare > 0 ? Math.round(fare) : null,
    selectedListingId:
      typeof b.selectedListingId === "string" ? b.selectedListingId : null,
    sort: (PRODUCT_SORT_OPTIONS.some((s) => s.id === b.sort)
      ? b.sort
      : "best_card") as ProductSort,
  }
}
