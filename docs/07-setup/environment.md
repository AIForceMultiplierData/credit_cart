# Environment variables

| Variable | Required | Client? | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Client auth + RLS queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Lead uploads, admin API |
| `SERPER_KEYS` | Yes* | No | Deal search + viral products |
| `GROQ_KEYS` | Yes* | No | Primary LLM |
| `CEREBRAS_KEYS` | No | No | LLM fallback |
| `GEMINI_KEYS` | No | No | LLM fallback |

\*App works in degraded mode without them (rules-only deals, empty viral feed).

---

## Key rotation

Multiple keys comma-separated — router rotates on rate limit:

```
SERPER_KEYS=key1,key2,key3
GROQ_KEYS=gsk_a,gsk_b
```

Implemented in `lib/llm-router.ts`.

---

## Vercel

Project → Settings → Environment Variables — add all server keys to **Production** and **Preview**.

Redeploy after changes.

---

## Security

- Never commit `.env.local`
- Never prefix secret keys with `NEXT_PUBLIC_`
- Service role bypasses RLS — only use in API routes
