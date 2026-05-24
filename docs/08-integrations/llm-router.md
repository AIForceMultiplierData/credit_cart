# LLM router

**File:** `lib/llm-router.ts`

---

## Purpose

Call AI for deal ranking JSON with **fallback chain** and **key rotation**.

---

## Order

1. **Groq** — models: llama-3.3-70b, qwen-qwq, llama-3.1-8b
2. **Cerebras** — llama3.1-8b/70b
3. **Gemini** — gemini-2.5-flash

Each provider tries multiple API keys from env.

---

## Usage

```typescript
const result = await call_ai(DEAL_SEARCH_SYSTEM_PROMPT, payload)
```

Returns parsed JSON or raw string → `safeJsonExtract()`.

---

## Timeout

15 seconds per HTTP request.

---

## When AI is skipped

`deal-search-service.ts` catch block → `buildFallbackResult()` (rules only).

---

## Cost control

Serper + rules handle much of ranking; AI fills gaps and natural language reasons.
