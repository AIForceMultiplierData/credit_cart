# System architecture (bird's-eye view)

## High-level diagram

```mermaid
flowchart TB
  subgraph Client["Browser PWA"]
    UI[Next.js App Router<br/>React 19 + Tailwind]
  end

  subgraph Vercel["Vercel Edge / Node"]
    API_SEARCH["/api/deals/search"]
    API_VIRAL["/api/deals/viral"]
    API_LEADS["/api/leads/credit-card"]
    LLM[lib/llm-router.ts]
    SERPER[lib/serper-client.ts]
  end

  subgraph External["External APIs"]
    GROQ[Groq LLM]
    CEREBRAS[Cerebras]
    GEMINI[Gemini]
    SERPER_API[Serper.dev]
  end

  subgraph Supabase["Supabase"]
    AUTH[Auth Google OAuth]
    DB[(PostgreSQL)]
    STORAGE[Storage bucket<br/>credit-card-leads]
    RPC[Security definer RPCs]
  end

  UI -->|JWT anon key| AUTH
  UI -->|RPC + RLS| DB
  UI --> API_SEARCH
  UI --> API_VIRAL
  UI --> API_LEADS

  API_SEARCH --> LLM
  API_SEARCH --> SERPER
  API_VIRAL --> SERPER
  API_LEADS --> STORAGE
  API_LEADS --> DB

  LLM --> GROQ
  LLM --> CEREBRAS
  LLM --> GEMINI
  SERPER --> SERPER_API
  RPC --> DB
```

---

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **UI** (`components/`, `app/`) | Auth state, forms, tabs, no secret keys |
| **Hooks** (`hooks/`) | Wallet load, circle cards merge, profile |
| **Lib** (`lib/`) | Deal ranking, breakdown, Serper, LLM, validation |
| **API routes** | Server-only keys, long-running search (30–45s) |
| **Supabase** | Source of truth: profiles, contracts, leads |

---

## Auth flow

```mermaid
sequenceDiagram
  participant U as User
  participant App as PoolPay
  participant SB as Supabase Auth

  U->>App: Sign in with Google
  App->>SB: signInWithOAuth
  SB-->>App: Session JWT
  App->>SB: RPC get_or_create_my_wallet
  SB-->>App: profiles.cards JSON
```

Google OAuth is configured in Supabase Dashboard → Authentication → Providers.

---

## Deal search pipeline

```mermaid
sequenceDiagram
  participant UI as DealSearchBar
  participant API as /api/deals/search
  participant SVC as deal-search-service
  participant SER as Serper
  participant AI as LLM Router
  participant ENR as deal-offer-breakdown

  UI->>API: POST url, category, searchCards
  API->>SVC: searchDealsForWallet()
  SVC->>SVC: fetchUrlHints (Cheerio scrape)
  SVC->>SER: fetchSerperDealContext
  SVC->>AI: rank offers JSON
  alt AI fails
    SVC->>SVC: buildFallbackResult (rules)
  end
  SVC->>ENR: enrichDealSearchResult (₹ + T&C + split)
  SVC-->>API: DealSearchResult
  API-->>UI: JSON
```

---

## Security model

| Asset | Protection |
|-------|------------|
| User wallet cards | RLS on `profiles` + RPC `upsert_my_wallet` |
| Contracts | RLS: buyer/lender + pending visible to authenticated |
| Leads + PDFs | RLS + storage policies; API uses service role for admin paths |
| API keys | Only on server (`SERPER_KEYS`, `GROQ_KEYS`, etc.) |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

---

## Deployment

- **Git push to `main`** → Vercel auto-build (`next build`)
- Env vars set in Vercel project settings (mirror `.env.local`)

See [../07-setup/deployment.md](../07-setup/deployment.md).
