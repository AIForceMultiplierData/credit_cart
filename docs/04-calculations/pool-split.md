# 50/50 pool split

**Constant:** `POOL_SPLIT_RATIO = 0.5` in `lib/deal-offer-breakdown.ts`

Applies when `offer.source === "circle"`.

---

## Formulas

```
totalCashback = discountAmount
yourShare     = round(totalCashback × 0.5)
ownerShare    = totalCashback - yourShare
effectiveCost = listPrice - yourShare
```

---

## Interpretation

- Buyer still **pays full list price** on friend's card at checkout (amount_to_pay uses full discount on card — split applies to **cashback/rewards**, not merchant checkout line).
- UI **effective cost** = what buyer net pays after receiving half the cashback back.

---

## Example

| | ₹ |
|--|---|
| List price | 1,30,999 |
| Card cashback | 13,100 |
| Your 50% | 6,550 |
| Friend 50% | 6,550 |
| Your effective cost | 1,24,449 |

---

## Wallet card (no split)

```
yourShare = discountAmount (100%)
effectiveCost = amountToPay = listPrice - discountAmount
```

---

## Where shown

- Home deal search — `DealOfferDetail` section "50/50 pool split"
- Viral deals — `splitHint` string in `lib/viral-deals.ts`
- Missing card teasers — copy mentions 100% if you get own card
