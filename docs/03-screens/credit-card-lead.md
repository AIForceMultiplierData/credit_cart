# Credit card lead form

**Files:** `credit-card-lead-modal.tsx`, `card-lead-provider.tsx`, `app/api/leads/credit-card/route.ts`

---

## Purpose

In-app **Apply now** for cards shown in missing-card teasers or viral deals.

---

## Validation

**Zod** schema in `lib/credit-card-lead.ts`:

- Full name, 12-digit Aadhaar, PAN format
- Salary > 0, employment type
- PDF/image uploads ≤ 2MB → Supabase Storage `credit-card-leads` bucket

---

## API

`POST /api/leads/credit-card` — requires auth Bearer token.

Uses `SUPABASE_SERVICE_ROLE_KEY` for storage upload path (server only).

---

## Calculation

None — form capture only. Status workflow: `new → contacted → submitted → closed`.

SQL: `supabase/credit_card_leads.sql`
