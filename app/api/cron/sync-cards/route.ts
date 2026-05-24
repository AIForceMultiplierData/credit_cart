import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import * as cheerio from "cheerio"
import { resolveBankProfile } from "@/lib/bank-registry"
import { call_ai } from "@/lib/llm-router"

const CARD_EXTRACTION_PROMPT =
  "Extract any newly mentioned Indian credit cards. Return ONLY a valid JSON array of objects with keys: bank_name, card_name, style_classes (Tailwind gradient classes for brand colors), and optional network (visa/mastercard/rupay/diners), card_tier (entry/mid/premium), apply_url."

const DEFAULT_SCRAPE_URL =
  process.env.CARD_SCRAPE_URL ??
  "https://www.livemint.com/topic/credit-cards"

/** Vercel Cron: 30 0 * * * UTC = 06:00 IST daily (Cheerio scrape + LLM + Supabase upsert). */

type ExtractedCard = {
  bank_name: string
  card_name: string
  style_classes: string
  network?: string
  card_tier?: string
  apply_url?: string
}

type CardCatalogRow = {
  card_id: string
  bank_id: string
  bank_name: string
  bank_logo_url: string
  card_name: string
  style_classes: string
  network?: string | null
  card_tier?: string | null
  apply_url?: string | null
  is_active: boolean
}

type SyncSummary = {
  ok: true
  message: string
  scrapeUrl: string
  textChunks: number
  extracted: number
  upserted: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${cronSecret}`
}

function normalizeBankName(value: string): string {
  return value.trim().toUpperCase()
}

function normalizeCardName(value: string): string {
  return value.trim()
}

function toCardId(bankName: string, cardName: string): string {
  return `${bankName}_${cardName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function isExtractedCard(value: unknown): value is ExtractedCard {
  if (typeof value !== "object" || value === null) return false

  const row = value as Record<string, unknown>

  return (
    typeof row.bank_name === "string" &&
    row.bank_name.trim().length > 0 &&
    typeof row.card_name === "string" &&
    row.card_name.trim().length > 0 &&
    typeof row.style_classes === "string" &&
    row.style_classes.trim().length > 0
  )
}

function normalizeExtractedCards(raw: unknown): ExtractedCard[] {
  if (Array.isArray(raw)) {
    return raw.filter(isExtractedCard)
  }

  if (typeof raw === "object" && raw !== null) {
    const record = raw as Record<string, unknown>

    for (const key of ["cards", "data", "results", "items"]) {
      const candidate = record[key]
      if (Array.isArray(candidate)) {
        return candidate.filter(isExtractedCard)
      }
    }
  }

  return []
}

async function fetchTargetPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PoolPayCatalogBot/1.0 (+https://poolpay.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Scrape fetch failed (${response.status}) for ${url}`)
  }

  return response.text()
}

function extractAnnouncementChunks(html: string): string[] {
  const $ = cheerio.load(html)
  const chunks = new Set<string>()

  const selectors = [
    "article",
    "[class*='story']",
    "[class*='card']",
    "[class*='news']",
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "li",
  ]

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const text = $(element).text().replace(/\s+/g, " ").trim()

      if (text.length < 40) return
      if (!/(credit\s*card|debit\s*card|hdfc|axis|sbi|icici|bank|visa|mastercard|rupay)/i.test(text)) {
        return
      }

      chunks.add(text.slice(0, 600))
    })
  }

  return [...chunks].slice(0, 80)
}

async function scrapeAndExtractCards(): Promise<{
  scrapeUrl: string
  textChunks: string[]
  cards: ExtractedCard[]
  errors: string[]
}> {
  const errors: string[] = []
  const scrapeUrl = DEFAULT_SCRAPE_URL

  let textChunks: string[] = []

  try {
    const html = await fetchTargetPage(scrapeUrl)
    textChunks = extractAnnouncementChunks(html)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to scrape target URL"
    errors.push(message)
    return { scrapeUrl, textChunks, cards: [], errors }
  }

  if (textChunks.length === 0) {
    errors.push("No relevant card announcement text found on target page")
    return { scrapeUrl, textChunks, cards: [], errors }
  }

  try {
    const aiResult = await call_ai(CARD_EXTRACTION_PROMPT, {
      source: scrapeUrl,
      scraped_at: new Date().toISOString(),
      announcements: textChunks,
    })

    const cards = normalizeExtractedCards(aiResult)

    if (cards.length === 0) {
      errors.push("LLM returned no valid card objects")
    }

    return { scrapeUrl, textChunks, cards, errors }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "LLM extraction failed"
    errors.push(message)
    return { scrapeUrl, textChunks, cards: [], errors }
  }
}

async function upsertBanksFromCards(
  supabase: SupabaseClient,
  cards: Array<{ bank_name: string }>
): Promise<string[]> {
  const errors: string[] = []
  const uniqueBanks = new Map<string, ReturnType<typeof resolveBankProfile>>()

  for (const card of cards) {
    const bankName = normalizeBankName(card.bank_name)
    const profile = resolveBankProfile(bankName)
    uniqueBanks.set(profile.bank_id, profile)
  }

  if (uniqueBanks.size === 0) return errors

  const rows = [...uniqueBanks.values()].map((bank) => ({
    bank_id: bank.bank_id,
    bank_name: bank.bank_name,
    logo_url: bank.logo_url,
    brand_color: bank.brand_color,
    style_classes: bank.style_classes,
    display_order: bank.display_order,
    is_active: true,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from("card_banks").upsert(rows, {
    onConflict: "bank_id",
  })

  if (error) {
    errors.push(`Failed to upsert card_banks: ${error.message}`)
  }

  return errors
}

async function upsertCardsToCatalog(
  supabase: SupabaseClient,
  cards: ExtractedCard[]
): Promise<Pick<SyncSummary, "upserted" | "inserted" | "updated" | "skipped" | "errors">> {
  const errors: string[] = []
  let inserted = 0
  let updated = 0
  let skipped = 0

  if (cards.length === 0) {
    return { upserted: 0, inserted, updated, skipped, errors }
  }

  const normalized = cards.map((card) => {
    const bankName = normalizeBankName(card.bank_name)
    const bank = resolveBankProfile(bankName)

    return {
      bank_name: bankName,
      bank_id: bank.bank_id,
      bank_logo_url: bank.logo_url,
      card_name: normalizeCardName(card.card_name),
      style_classes: card.style_classes.trim() || bank.style_classes,
      network: card.network?.trim().toLowerCase() ?? null,
      card_tier: card.card_tier?.trim().toLowerCase() ?? null,
      apply_url: card.apply_url?.trim() ?? null,
    }
  })

  const cardIds = normalized.map((card) =>
    toCardId(card.bank_name, card.card_name)
  )

  const { data: existingRows, error: fetchError } = await supabase
    .from("card_catalog")
    .select("card_id")
    .in("card_id", cardIds)

  if (fetchError) {
    errors.push(`Failed to read existing catalog rows: ${fetchError.message}`)
    return { upserted: 0, inserted, updated, skipped: normalized.length, errors }
  }

  const existingIds = new Set(
    (existingRows ?? []).map((row) => String(row.card_id))
  )

  const rowsToUpsert: CardCatalogRow[] = []

  for (const card of normalized) {
    const cardId = toCardId(card.bank_name, card.card_name)

    if (!cardId) {
      skipped += 1
      errors.push(
        `Skipped invalid card slug for ${card.bank_name}/${card.card_name}`
      )
      continue
    }

    rowsToUpsert.push({
      card_id: cardId,
      bank_id: card.bank_id,
      bank_name: card.bank_name,
      bank_logo_url: card.bank_logo_url,
      card_name: card.card_name,
      style_classes: card.style_classes,
      network: card.network,
      card_tier: card.card_tier,
      apply_url: card.apply_url,
      is_active: true,
    })

    if (existingIds.has(cardId)) {
      updated += 1
    } else {
      inserted += 1
    }
  }

  if (rowsToUpsert.length === 0) {
    return { upserted: 0, inserted, updated, skipped, errors }
  }

  const { error: upsertError } = await supabase
    .from("card_catalog")
    .upsert(rowsToUpsert, { onConflict: "card_id" })

  if (upsertError) {
    errors.push(`Supabase upsert failed: ${upsertError.message}`)
    return { upserted: 0, inserted: 0, updated: 0, skipped: rowsToUpsert.length, errors }
  }

  return {
    upserted: rowsToUpsert.length,
    inserted,
    updated,
    skipped,
    errors,
  }
}

function buildSuccessSummary(
  partial: Omit<SyncSummary, "ok" | "message">
): SyncSummary {
  const hasErrors = partial.errors.length > 0
  const noCards = partial.extracted === 0

  let message = "Card catalog sync completed"

  if (noCards && hasErrors) {
    message = "Card catalog sync finished with no new cards (see errors)"
  } else if (noCards) {
    message = "Card catalog sync finished — no new cards found today"
  } else if (hasErrors) {
    message = "Card catalog sync completed with warnings"
  }

  return {
    ok: true,
    message,
    ...partial,
  }
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { ok: false, error: "Server misconfiguration: CRON_SECRET is not set" },
      { status: 500 }
    )
  }

  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const summaryErrors: string[] = []

  try {
    const { scrapeUrl, textChunks, cards, errors: scrapeErrors } =
      await scrapeAndExtractCards()

    summaryErrors.push(...scrapeErrors)

    let upsertStats = {
      upserted: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    if (cards.length > 0) {
      try {
        const supabase = createAdminClient()
        const bankErrors = await upsertBanksFromCards(supabase, cards)
        summaryErrors.push(...bankErrors)
        upsertStats = await upsertCardsToCatalog(supabase, cards)
        summaryErrors.push(...upsertStats.errors)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Supabase sync failed"
        summaryErrors.push(message)
      }
    }

    const summary = buildSuccessSummary({
      scrapeUrl,
      textChunks: textChunks.length,
      extracted: cards.length,
      upserted: upsertStats.upserted,
      inserted: upsertStats.inserted,
      updated: upsertStats.updated,
      skipped: upsertStats.skipped,
      errors: summaryErrors,
    })

    console.info("[cron/sync-cards]", summary)

    return Response.json(summary, { status: 200 })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected sync-cards failure"

    console.error("[cron/sync-cards]", message)

    return Response.json(
      buildSuccessSummary({
        scrapeUrl: DEFAULT_SCRAPE_URL,
        textChunks: 0,
        extracted: 0,
        upserted: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [message],
      }),
      { status: 200 }
    )
  }
}
