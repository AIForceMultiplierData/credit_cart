# Deal search calculation

## Overview

**Entry:** `searchDealsForWallet()` in `lib/deal-search-service.ts`

---

## Step 1 — Price & title

| Source | Method |
|--------|--------|
| URL scrape | Cheerio: `og:title`, `product:price:amount`, Amazon price selectors |
| Serper | Product + shopping snippets |
| AI | `estimated_price`, `product_title` in JSON |

Priority merge: AI payload → Serper → scrape hints.

---

## Step 2 — Per-card offers

For each `searchCards` entry (wallet + circle):

1. **AI** returns `discount_percent`, `reason`, optional `terms_and_conditions`
2. **Rules fallback** (`buildFallbackResult`) if AI off — platform regex in `deal-search.ts`
3. **Serper override** (`applySerperOverrides`):
   - Extract max % from snippets mentioning card
   - `discount_percent = max(ai, serper, rules)`
   - `discount_amount = round(price × percent / 100)`

---

## Step 3 — Ranking (`sortOffersStrict`)

Score order:

1. Highest `discount_amount` (₹ saved)
2. Highest `discount_percent`
3. Serper-backed flag
4. Wallet source tie-break (+500 internal bonus)

Constants in `deal-search-ranking.ts`:

- `SERPER_BACKED_BONUS = 50_000` (sort tie-breaker scale)
- `WALLET_PRIORITY_BONUS = 500`

---

## Step 4 — Enrichment (`enrichDealSearchResult`)

📐 **Formula** + 📋 **T&C catalog**:

- Apply per-transaction caps from `card-offer-terms.ts`
- Min spend qualification
- 50/50 split fields for `source === "circle"`
- Merge Serper snippet lines into T&C

---

## Step 5 — Missing card teasers

See [missing-cards.md](./missing-cards.md).

---

## Fallback when AI fails

Entire pipeline uses **rules only** + Serper overrides — no LLM call.

---

## AI prompt location

`DEAL_SEARCH_SYSTEM_PROMPT` in `lib/deal-search.ts`

Models tried: Groq → Cerebras → Gemini (`lib/llm-router.ts`).
