# Offer breakdown & terms

**File:** `lib/deal-offer-breakdown.ts`, `lib/card-offer-terms.ts`

---

## Discount amount (exact ₹)

```
rawDiscount = round(listPrice × discountPercent / 100)
discountAmount = min(rawDiscount, capPerTransaction)  // if cap defined
```

If capped, effective percent recalculated for display.

---

## Amount to pay

```
amountToPay = max(listPrice - discountAmount, 0)
```

For **wallet** cards this equals **effective cost** (100% cashback kept).

---

## Min spend

If `listPrice < rule.minTransaction`:

- `qualifies = false`
- `discountAmount = 0`
- UI shows qualification note

---

## Terms & conditions sources

| Priority | Source |
|----------|--------|
| 1 | `CARD_OFFER_RULES` static bullets per card + platform |
| 2 | AI `terms_and_conditions[]` if present |
| 3 | Serper market offer snippets (first 2) if card serper-backed |
| 4 | Auto cap line if cap applied |
| 5 | Circle split line if pooled |

Deduped by exact string match.

---

## Example — ICICI Amazon Pay @ ₹1,30,999

| Field | Value |
|-------|-------|
| Serper % | 10% |
| Raw discount | ₹13,100 |
| Cap (Amazon Pay) | ₹5,000 default in rules — **actual uses max(serper, platform)** |
| amount_to_pay | price − discount |

Note: Live Serper % can exceed catalog base 5% — enrichment uses the higher applied percent after override.

---

## UI component

`components/deal-offer-detail.tsx` renders breakdown table + T&C list.
