# Deals — Viral feed (Live viral picks)

**Components:** `deals-feed.tsx`  
**API:** `POST /api/deals/viral`

---

## Purpose

Surface **trending products** from Amazon, Flipkart, eBay with the **best card not in the user's wallet**. Encourage Apply (lead form) or Ping 50/50.

---

## Pipeline

| Step | Engine |
|------|--------|
| Product list | **Serper Shopping** (`VIRAL_SHOPPING_QUERIES` in `lib/viral-deals.ts`) |
| Per-product best card | **Rules** `buildMissingCardTeasers()` — same as deal search missing cards |
| Wallet filter | **Identity match** `lib/card-identity.ts` — skip owned cards |
| Circle OK | Show "In circle" badge — still shown if not in wallet |

**Not AI** for product list. **Not AI** for card matching (catalog + Serper %).

---

## Header copy

- Title: **Cashback outside your wallet**
- Explains 50% split when pooling

---

## CTAs

| Button | Action |
|--------|--------|
| Apply | `openLeadForm({ source: "viral_deals_feed" })` |
| Ping 50/50 | Opens `PingDrawer` with deal mapped to contract fields |

---

## Refresh

Client re-fetches when wallet cards load or user taps Refresh.

Requires `SERPER_KEYS` on server — empty feed if missing.
