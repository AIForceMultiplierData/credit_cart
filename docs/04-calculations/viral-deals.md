# Viral deals calculation

**Files:** `lib/viral-deals-service.ts`, `lib/viral-deals.ts`

---

## Products

🔍 **Serper Shopping** only — queries in `VIRAL_SHOPPING_QUERIES` (Amazon ×2, Flipkart ×2, eBay ×1).

Dedupe by title prefix, filter `price > 0`.

---

## Per product

`buildMissingCardTeasers({ limit: 1 })` — best **non-wallet** catalog card.

Same math as deal search missing cards.

---

## Sort

Deals sorted by `cardDiscount` descending before return.

---

## No AI

Product discovery is 100% Serper. Card matching is catalog + Serper %.
