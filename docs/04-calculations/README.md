# Calculations index

Every user-visible number should trace to one of:

| Tag | Meaning |
|-----|---------|
| 🤖 **AI** | LLM JSON response |
| 🔍 **Serper** | Live web search API |
| 📐 **Formula** | Deterministic TypeScript math |
| 📋 **Rules** | Static catalog / regex platform rules |
| 🗄️ **DB** | Supabase column or RPC |

---

## Documents

| Topic | File |
|-------|------|
| Deal search ranking | [deal-search.md](./deal-search.md) |
| Offer breakdown & T&C | [offer-breakdown.md](./offer-breakdown.md) |
| 50/50 pool split | [pool-split.md](./pool-split.md) |
| Missing card teasers | [missing-cards.md](./missing-cards.md) |
| Viral deals | [viral-deals.md](./viral-deals.md) |
| Lender credits | [lender-credits.md](./lender-credits.md) |

---

## Key files (code)

```
lib/deal-search-service.ts    # Orchestration
lib/deal-search-ranking.ts    # Sort + Serper override
lib/deal-offer-breakdown.ts   # ₹ math + split
lib/card-offer-terms.ts       # T&C + caps
lib/deal-search-missing-cards.ts
lib/viral-deals-service.ts
lib/card-identity.ts          # Fuzzy card matching
```
