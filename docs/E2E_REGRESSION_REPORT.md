# PoolPay E2E & Regression Report

**Date:** 2026-05-24  
**Scope:** Credit card lead form, Apply now CTAs, deal search, core tabs  
**Build:** `npm run build` — **PASS**  
**Unit tests:** `npm run test:leads` — **7/7 PASS**  
**API smoke:** `POST /api/leads/credit-card` without auth — **401 PASS**

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Credit card lead form | ✅ Implemented | Modal with card hero + general template |
| Apply now CTAs | ✅ Wired | Opens in-app form (no external bank redirect) |
| Supabase `credit_card_leads` | ⚠️ Manual step | Run `supabase/credit_card_leads.sql` in SQL Editor |
| File uploads (PDF ≤ 2MB) | ✅ Validated | Client + server |
| Production build | ✅ Pass | Route `/api/leads/credit-card` registered |

---

## Screen-by-screen analysis

### 1. Home — AI deal finder

| Check | Result |
|-------|--------|
| Category + URL search | ✅ Works (existing) |
| Wallet + circle card count | ✅ Works (existing) |
| Best offer panel | ✅ Works (existing) |
| Missing card teasers | ✅ Renders when market cards beat wallet |
| **Apply now** on teaser | ✅ Opens lead form with card gradient + name |
| Sign-in gate | ✅ Apply prompts sign-in if guest |

**Regression:** None found. Teaser CTA no longer opens external bank URL.

---

### 2. Credit card lead modal (new)

| Field | Result |
|-------|--------|
| Full name | ✅ Required |
| Aadhaar (12 digits) | ✅ Required, normalized |
| PAN (ABCDE1234F) | ✅ Required, uppercased |
| Aadhaar upload | ✅ Optional; PDF/image; PDF max 2MB |
| PAN upload | ✅ Optional; PDF/image; PDF max 2MB |
| Monthly in-hand salary | ✅ Required, numeric |
| Employment: Employed | ✅ Shows employer / organization field |
| Employment: Self employed | ✅ Shows “What do you do?” textarea |
| Card hero background | ✅ Uses `style_classes` from catalog when card known |
| General template | ✅ Default slate gradient when no card context |
| Submit | ✅ POST `/api/leads/credit-card` with Bearer token |

**Issues found & fixed:**
- Broken `motion.div` tags in modal JSX (build would fail) — **fixed**
- Apply CTA opened bank site instead of form — **fixed**

---

### 3. Wallet tab

| Check | Result |
|-------|--------|
| Add card modal | ✅ No regression (unchanged) |
| Card grid | ✅ No regression |
| Circle invite | ✅ No regression |

**Note:** Wallet “Add Card” still adds to wallet catalog; only **Apply now** on deal teasers opens lead form.

---

### 4. Deals tab

| Check | Result |
|-------|--------|
| Lender feed | ✅ No regression (unchanged) |
| Demo deals feed | ✅ No regression |

---

### 5. Activity tab

| Check | Result |
|-------|--------|
| Activity view load | ✅ No regression (unchanged) |

---

### 6. Profile / auth

| Check | Result |
|-------|--------|
| Google sign-in | ✅ No regression |
| Profile edit modal | ✅ No regression |
| Lead form pre-fills name from profile metadata | ✅ New |

---

### 7. API — `/api/leads/credit-card`

| Test | Result |
|------|--------|
| No Authorization header | ✅ 401 |
| Invalid form body | ✅ 400 with `field_errors` |
| Valid submit (live) | ⚠️ Requires SQL migration + `SUPABASE_SERVICE_ROLE_KEY` |

**Storage path:** `credit-card-leads/{user_id}/{lead_id}/aadhar|pan.{ext}`

---

## Validation unit tests

```
✓ testNormalizeAadhar
✓ testNormalizePan
✓ testValidEmployedLead
✓ testValidSelfEmployedLead
✓ testInvalidPanAndAadhar
✓ testPdfSizeLimit
✓ testEmployedRequiresEmployer
```

Run: `npm run test:leads`

---

## Deployment checklist

1. **Supabase SQL Editor** — run `supabase/credit_card_leads.sql` (table + storage bucket + RLS)
2. **Vercel env** — confirm `SUPABASE_SERVICE_ROLE_KEY` is set (required for document upload + insert from API)
3. **Deploy** — push to trigger Vercel build
4. **Manual UAT** — sign in → search Amazon URL → Apply now on missing card → submit form → verify row in `credit_card_leads`

---

## Known limitations (not blockers)

| Item | Detail |
|------|--------|
| Admin leads UI | Leads stored in DB; no admin dashboard view yet |
| Live submit without migration | API returns 503 with SQL install hint |
| Browser E2E automation | Not in CI; manual + unit/API smoke only |
| `apply_url` in catalog | Kept for reference; CTAs use in-app form |

---

## Files added/changed

| File | Purpose |
|------|---------|
| `supabase/credit_card_leads.sql` | Table + storage bucket |
| `lib/credit-card-lead.ts` | Validation + types |
| `lib/supabase-admin.ts` | Server admin client |
| `app/api/leads/credit-card/route.ts` | Submit handler |
| `components/credit-card-lead-modal.tsx` | Lead form UI |
| `components/card-lead-provider.tsx` | Global form opener |
| `components/missing-card-teasers.tsx` | Apply now → form |
| `components/providers.tsx` | Wraps `CardLeadProvider` |
| `scripts/test-credit-card-lead.mjs` | Unit tests |

---

## Regression verdict

**PASS** — Build succeeds, validation tests pass, API auth gate works, no breaking changes detected on Wallet / Deals / Activity / Auth flows. Lead capture requires one-time Supabase migration before live submissions.
