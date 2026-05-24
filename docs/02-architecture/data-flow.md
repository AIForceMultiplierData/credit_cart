# Data flow — end to end

```mermaid
flowchart TD
  subgraph Onboarding
    A1[Google sign-in] --> A2[profiles row]
    A2 --> A3[Add cards to wallet JSON]
  end

  subgraph DealFind
    B1[Paste URL] --> B2[Scrape + Serper + AI]
    B2 --> B3[Rank wallet + circle cards]
    B3 --> B4[Enrich ₹ + T&C + split]
    B4 --> B5{Best card owned?}
  end

  subgraph Execute
    B5 -->|Yes| C1[Pay on merchant with own card]
    B5 -->|No| C2[Ping circle]
    C2 --> C3[contracts pending]
    C3 --> C4[Lender Desk]
    C4 --> C5[Accept + escrow_locked]
    C5 --> C6[Activity tab]
  end

  subgraph Grow
    D1[Missing card teaser] --> D2[Lead form]
    D2 --> D3[credit_card_leads]
  end

  B3 --> D1
```

---

## Data stores touched

| Action | Tables / storage |
|--------|------------------|
| Wallet save | `profiles.cards` |
| Deal search | None (stateless API) |
| Ping | `contracts` |
| Accept | `contracts`, `transactions` |
| Lead | `credit_card_leads`, storage |
| Stats | `profiles` columns |

---

## External calls per deal search

1. Merchant URL fetch (Cheerio)
2. Serper (2–4 queries typical)
3. LLM (1 call if keys present)

Cache: none currently — each search is live.
