# Serper integration

**File:** `lib/serper-client.ts`

---

## Purpose

Live Google search for:

- Product prices & titles
- Card offer snippets ("10% off with HDFC…")
- Shopping results (viral feed)

---

## Endpoints used

| Function | Serper API |
|----------|------------|
| `fetchSerperDealContext` | Search + Shopping |
| `fetchSerperShopping` | Shopping only |
| `fetchSerperPlatformCardOffers` | Search for card offers |

---

## Price parsing

`parseInrPrice()` — handles `₹`, `Rs.`, commas.

---

## Override logic

When snippet mentions a wallet/circle card by name:

- Extract max `%` from snippet text
- Beat AI/rules percent in `applySerperOverrides`
- Mark `serper_backed: true` for UI badge

---

## Env

`SERPER_KEYS=key1,key2` — rotated like LLM keys.

---

## Without Serper

- Deal search: scrape + AI/rules only
- Viral feed: empty with summary message
