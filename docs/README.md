# PoolPay — Project Documentation

**Production:** https://poolpay.forcemultiplierdata.com/  
**Repo:** `AIForceMultiplierData/credit_cart` (branch `main`)  
**Stack:** Next.js 16 · React 19 · Tailwind v4 · Supabase · Serper · Groq/Cerebras/Gemini

This documentation is written for a developer with **~1–2 years of experience** joining the project. Read in order for onboarding, or jump via the index below.

---

## Documentation map

| Folder | What you will learn |
|--------|---------------------|
| [01-product](./01-product/) | What PoolPay is, who it is for, user stories |
| [02-architecture](./02-architecture/) | Bird's-eye view, system & data-flow diagrams |
| [03-screens](./03-screens/) | Every UI tab — what it shows and how numbers are computed |
| [04-calculations](./04-calculations/) | Formulas, AI vs rules vs Serper, caps, 50/50 split |
| [05-api](./05-api/) | Next.js API routes and request/response shapes |
| [06-database](./06-database/) | Supabase tables, RLS, RPCs, SQL run order |
| [07-setup](./07-setup/) | Clone → env → SQL → local dev → Vercel deploy |
| [08-integrations](./08-integrations/) | LLM router, Serper, auth |

---

## Quick start (experienced dev)

```bash
git clone https://github.com/AIForceMultiplierData/credit_cart.git
cd credit_cart
pnpm install
cp .env.example .env.local   # fill keys — see 07-setup/environment.md
pnpm dev
```

Run SQL scripts in [06-database/setup-order.md](./06-database/setup-order.md) in Supabase SQL Editor **before** testing wallet, deals, or lender desk.

---

## App structure (code)

```
app/
  page.tsx                 # Main shell: tabs Home | Wallet | Deals | Activity
  api/deals/search/        # AI + Serper deal finder
  api/deals/viral/         # Viral products feed (Serper shopping)
  api/leads/credit-card/   # Card application leads
  deals/lender-feed.tsx    # Lender Desk UI
components/                # UI: wallet, deal search, ping drawer, etc.
lib/                       # Business logic (ranking, breakdown, Serper, LLM)
hooks/                     # useAuth, useWalletCards, useDealSearchCards
supabase/                  # SQL migrations (run manually in Supabase)
```

---

## Core concepts (30-second version)

1. **Wallet** — User stores which credit cards they own (`profiles.cards` JSON).
2. **Circle** — Trusted friends' cards (via `circle_members` + RPC `get_deal_search_cards`).
3. **Deal search** — Paste Amazon/Flipkart/travel URL → rank best card (wallet + circle) with **exact ₹** and **T&C**.
4. **Viral deals** — Trending products + best card **not in wallet** (apply or ping 50/50).
5. **Ping** — Buyer creates `contracts` row → lenders see it on **Lender Desk**.
6. **Earning toggle** — Wallet card `active_for_lending` → card visible to buyers on Lender Desk.

---

## Change log (doc maintenance)

| Date | Notes |
|------|--------|
| 2026-05 | Initial E2E documentation after viral deals, offer breakdown, lender RPC |

When you change calculation logic, update **04-calculations** and the matching **03-screens** page in the same PR.
