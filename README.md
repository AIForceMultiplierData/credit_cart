# PoolPay (credit_cart)

A co-buying marketplace PWA — pool credit cards with your trusted circle to unlock merchant discounts.

**Live:** https://poolpay.forcemultiplierdata.com/

## Documentation

Full end-to-end project documentation for developers:

→ **[docs/README.md](./docs/README.md)**

Includes architecture diagrams, every screen’s logic (AI vs formula vs DB), Supabase setup order, and deployment guide.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # see docs/07-setup/environment.md
pnpm dev
```

Run Supabase SQL scripts in order: [docs/06-database/setup-order.md](./docs/06-database/setup-order.md)

## Stack

Next.js 16 · React 19 · Supabase · Serper · Groq/Cerebras/Gemini
