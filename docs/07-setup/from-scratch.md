# Setup from scratch

Complete checklist for a new developer machine + fresh Supabase project.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ (`corepack enable`) |
| Git | any |
| Supabase account | free tier OK |
| Vercel account | for deploy |
| API keys | Serper, Groq (min), optional Cerebras/Gemini |

---

## 2. Clone & install

```bash
git clone https://github.com/AIForceMultiplierData/credit_cart.git
cd credit_cart
pnpm install
```

---

## 3. Create Supabase project

1. [supabase.com](https://supabase.com) → New project
2. Note **Project URL** and **anon key**
3. Settings → API → copy **service_role** key (server only)

---

## 4. Run SQL migrations

Follow [../06-database/setup-order.md](../06-database/setup-order.md) — copy/paste each file into SQL Editor.

Minimum for core app:

- profiles, card_catalog, wallet_policies, contracts, lender_feed_fix, wallet_lending_toggle

---

## 5. Configure Google OAuth

Supabase → Authentication → Providers → Google:

- Client ID / secret from Google Cloud Console
- Redirect URLs: `http://localhost:3000/**`, production domain

---

## 6. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server only (never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

SERPER_KEYS=key1,key2
GROQ_KEYS=gsk_...
CEREBRAS_KEYS=
GEMINI_KEYS=
```

Details: [environment.md](./environment.md)

---

## 7. Run locally

```bash
pnpm dev
```

Open http://localhost:3000

---

## 8. Smoke test

| Test | Expected |
|------|----------|
| Sign in Google | Profile created |
| Wallet → Add card | Card persists after refresh |
| Home → paste Amazon URL | Deal result with ₹ breakdown |
| Deals tab | Lender Desk "connected" (no amber SQL hint) |
| Apply now on missing card | Lead form submits |

---

## 9. Deploy

See [deployment.md](./deployment.md)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wallet save fails RLS | Run `wallet_policies.sql` |
| Deal search always rules-only | Add `GROQ_KEYS`, `SERPER_KEYS` |
| Lender amber setup hint | Run `lender_opportunities_rpc.sql` |
| Viral deals empty | Serper keys on Vercel |
