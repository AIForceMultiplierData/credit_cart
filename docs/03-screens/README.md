# Screen-by-screen reference

Each page documents: **UI purpose**, **data sources**, **calculation method** (AI / Serper / rules / DB / formula).

| Screen | File(s) |
|--------|---------|
| [Home](./home.md) | `components/home-view.tsx`, `deal-search-bar.tsx` |
| [Wallet](./wallet.md) | `components/wallet-view.tsx` |
| [Deals — Lender Desk](./lender-desk.md) | `app/deals/lender-feed.tsx` |
| [Deals — Viral feed](./viral-deals.md) | `components/deals-feed.tsx` |
| [Activity](./activity.md) | `components/activity-view.tsx` |
| [Ping drawer](./ping-drawer.md) | `components/ping-drawer.tsx` |
| [Credit card lead](./credit-card-lead.md) | `components/credit-card-lead-modal.tsx` |

---

## Navigation shell

**File:** `app/page.tsx`

Four tabs via `BottomNav`: `home | wallet | deals | activity`.

**Deals tab** uses a **mode toggle** (top-right): **Lending** vs **Hot deals live** — only one panel visible at a time. Preference saved in `localStorage`.

Ping flow: `DealsFeed` → `onDealClick` → `PingDrawer`.
