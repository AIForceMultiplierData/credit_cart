# Home tab

**Components:** `home-view.tsx`, `deal-search-bar.tsx`, `deal-offer-detail.tsx`, `missing-card-teasers.tsx`

---

## Layout

1. Welcome hero
2. **AI deal finder** (category + URL + search button)
3. Stats row: Saved | Circle | Deals
4. Wallet cards summary
5. Quick actions → other tabs

---

## Stats row

| Stat | Source | Calculation |
|------|--------|-------------|
| **Saved** | `profiles.total_saved` | **DB column** — defaults to 0 if column missing |
| **Circle** | `useProfile().circleCount` | **DB** count of `circle_members` |
| **Deals** | `profiles.active_deals_count` | **DB column** — defaults to 0 |

Not AI-generated. Requires `profile_dashboard_stats.sql` for non-zero aggregates.

---

## Deal finder (main feature)

### Input

- Category: `flight | hotels | product`
- URL: Amazon, Flipkart, OTA links
- Implicit: user's `searchCards` = wallet + circle (`useDealSearchCards`)

### API

`POST /api/deals/search` → `lib/deal-search-service.ts`

### Pipeline (see [../04-calculations/deal-search.md](../04-calculations/deal-search.md))

| Step | Engine |
|------|--------|
| Product title & price | **Cheerio** scrape + **Serper** + **AI** |
| Per-card discount % | **AI** merged with **rules** fallback |
| Serper override | **Serper** snippets beat generic AI % |
| Ranking | **Formula** — highest ₹ saved; Serper bonus; wallet tie-break |
| ₹ breakdown + T&C | **Formula** + **static T&C catalog** |
| Missing cards | **Rules catalog** — excludes wallet cards by identity |

### UI output

- **Best card** — full breakdown (`DealOfferDetail`)
- **Cards you're missing** — catalog cards not in wallet that beat wallet best
- **All cards** — compact breakdown per wallet/circle card
- **Live offers (Serper)** — raw snippets for transparency

---

## Empty / error states

| Condition | UX |
|-----------|-----|
| Not signed in | Deal search triggers sign-in |
| No wallet cards | Toast + navigate to Wallet |
| Cards loading | Wait before search (race fix) |
