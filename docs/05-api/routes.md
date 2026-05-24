# API routes

All routes use `runtime = "nodejs"` for server-side secrets.

---

## POST `/api/deals/search`

**Body:**

```json
{
  "category": "product | flight | hotels",
  "url": "https://...",
  "searchCards": [
    {
      "card_id": "icici_amazon",
      "bank_name": "ICICI",
      "card_name": "Amazon Pay",
      "source": "wallet | circle",
      "owner_user_id": "uuid?",
      "owner_name": "Raj?"
    }
  ]
}
```

**Response:** `DealSearchResult` — see `lib/deal-search.ts`

**Logic:** `lib/deal-search-service.ts` → AI + Serper + enrich

**Timeout:** 30s (`maxDuration`)

---

## POST `/api/deals/viral`

**Body:**

```json
{ "searchCards": [ /* same shape */ ] }
```

**Response:**

```json
{
  "deals": [ /* ViralDeal[] */ ],
  "used_serper": true,
  "wallet_excluded_count": 3,
  "summary": "..."
}
```

**Logic:** `lib/viral-deals-service.ts`

**Timeout:** 45s

---

## POST `/api/leads/credit-card`

**Auth:** Required (Bearer from Supabase session)

**Body:** multipart or JSON with lead fields + optional PDFs

**Logic:** `lib/credit-card-lead.ts` validation → insert `credit_card_leads` + storage upload

---

## GET `/api/cron/sync-cards`

Syncs card catalog from external source (admin/cron). Requires cron secret if configured.

See `app/api/cron/sync-cards/route.ts`.
