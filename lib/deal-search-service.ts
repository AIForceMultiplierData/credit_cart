import * as cheerio from "cheerio"
import { call_ai, safeJsonExtract } from "@/lib/llm-router"
import {
  buildFallbackResult,
  DEAL_SEARCH_SYSTEM_PROMPT,
  detectPlatform,
  normalizeCategory,
  type DealOffer,
  type DealSearchCategory,
  type DealSearchResult,
  type WalletCardInput,
} from "@/lib/deal-search"

type SearchRequestBody = {
  category?: string
  url?: string
  walletCards?: WalletCardInput[]
}

type UrlHints = {
  title?: string
  price?: number | null
}

type AiDealPayload = {
  product_title?: string
  platform?: string
  estimated_price?: number | null
  offers?: DealOffer[]
  summary?: string
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d.]/g, "")
  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

async function fetchUrlHints(url: string): Promise<UrlHints> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoolPayBot/1.0; +https://poolpay.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return {}
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $("title").first().text().trim()

    const priceRaw =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[itemprop="price"]').attr("content") ||
      $('[data-a-price-amount]').first().attr("data-a-price-amount") ||
      $(".a-price-whole").first().text()

    return {
      title: title || undefined,
      price: parsePrice(typeof priceRaw === "string" ? priceRaw : undefined),
    }
  } catch {
    return {}
  }
}

function normalizeOffers(
  offers: DealOffer[] | undefined,
  walletCards: WalletCardInput[],
  estimatedPrice: number | null,
  category: DealSearchCategory,
  url: string
): DealOffer[] {
  const walletById = new Map(walletCards.map((card) => [card.card_id, card]))

  const normalized = (offers ?? [])
    .filter((offer) => walletById.has(offer.card_id))
    .map((offer) => {
      const walletCard = walletById.get(offer.card_id)!
      const discountPercent = Number(offer.discount_percent) || 0
      const discountAmount =
        estimatedPrice !== null
          ? Math.round((estimatedPrice * discountPercent) / 100)
          : Number(offer.discount_amount) || 0

      return {
        card_id: walletCard.card_id,
        bank_name: walletCard.bank_name,
        card_name: walletCard.card_name,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        estimated_final_price:
          estimatedPrice !== null
            ? Math.max(estimatedPrice - discountAmount, 0)
            : offer.estimated_final_price ?? null,
        reason: offer.reason || "Wallet card offer",
        recommended: Boolean(offer.recommended),
      }
    })

  if (normalized.length === 0) {
    return buildFallbackResult(category, url, walletCards, estimatedPrice).offers
  }

  normalized.sort((a, b) => b.discount_percent - a.discount_percent)
  return normalized.map((offer, index) => ({
    ...offer,
    recommended: index === 0,
  }))
}

function buildAiResult(
  category: DealSearchCategory,
  url: string,
  walletCards: WalletCardInput[],
  aiPayload: AiDealPayload,
  hints: UrlHints
): DealSearchResult {
  const estimatedPrice = aiPayload.estimated_price ?? hints.price ?? null
  const offers = normalizeOffers(
    aiPayload.offers,
    walletCards,
    estimatedPrice,
    category,
    url
  )
  const bestOffer = offers.find((offer) => offer.recommended) ?? offers[0] ?? null

  return {
    product_title: aiPayload.product_title || hints.title || "Linked purchase",
    platform: aiPayload.platform || detectPlatform(url),
    category,
    source_url: url,
    estimated_price: estimatedPrice,
    best_offer: bestOffer,
    offers,
    summary:
      aiPayload.summary ||
      (bestOffer
        ? `Best wallet pick: ${bestOffer.bank_name} ${bestOffer.card_name}.`
        : "No wallet cards to compare."),
    used_ai: true,
  }
}

export async function searchDealsForWallet(
  category: DealSearchCategory,
  url: string,
  walletCards: WalletCardInput[]
): Promise<DealSearchResult> {
  const hints = await fetchUrlHints(url)

  try {
    const aiRaw = await call_ai(DEAL_SEARCH_SYSTEM_PROMPT, {
      category,
      url,
      pageHints: hints,
      walletCards,
    })

    const aiPayload =
      typeof aiRaw === "object" && aiRaw !== null
        ? (aiRaw as AiDealPayload)
        : (safeJsonExtract(String(aiRaw)) as AiDealPayload)

    return buildAiResult(category, url, walletCards, aiPayload, hints)
  } catch {
    const fallback = buildFallbackResult(
      category,
      url,
      walletCards,
      hints.price ?? null
    )

    if (hints.title) {
      fallback.product_title = hints.title
    }

    return fallback
  }
}

export function parseSearchRequestBody(body: SearchRequestBody): {
  category: DealSearchCategory
  url: string
  walletCards: WalletCardInput[]
} | { error: string } {
  const category = normalizeCategory(String(body.category ?? ""))
  const url = String(body.url ?? "").trim()
  const walletCards = Array.isArray(body.walletCards) ? body.walletCards : []

  if (!category) {
    return { error: "Select a category: flight, hotels, or product." }
  }

  if (!url) {
    return { error: "Paste a product or booking URL." }
  }

  if (!isValidHttpUrl(url)) {
    return { error: "Enter a valid http or https URL." }
  }

  if (walletCards.length === 0) {
    return { error: "Add at least one card to your wallet first." }
  }

  const sanitizedCards = walletCards
    .filter(
      (card) =>
        card &&
        typeof card.card_id === "string" &&
        typeof card.bank_name === "string" &&
        typeof card.card_name === "string"
    )
    .map((card) => ({
      card_id: card.card_id,
      bank_name: card.bank_name,
      card_name: card.card_name,
    }))

  if (sanitizedCards.length === 0) {
    return { error: "Wallet cards are invalid. Re-add cards in Wallet." }
  }

  return { category, url, walletCards: sanitizedCards }
}
