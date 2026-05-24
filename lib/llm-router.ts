/**
 * Multi-layer LLM fallback router (Groq → Cerebras → Gemini).
 * Translated from the Python PoolPay pipeline with key rotation.
 */

type ChatMessage = {
  role: "user" | "system" | "assistant"
  content: string
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "qwen-qwq-32b",
  "llama-3.1-8b-instant",
] as const

const CEREBRAS_MODELS = ["llama3.1-8b", "llama3.1-70b"] as const

const GEMINI_MODEL = "gemini-2.5-flash"

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions"
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models"

let GROQ_INDEX = 0
let CEREBRAS_INDEX = 0
let GEMINI_INDEX = 0

function parseEnvKeys(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
}

export const GROQ_API_KEYS = parseEnvKeys(process.env.GROQ_KEYS)
export const CEREBRAS_API_KEYS = parseEnvKeys(process.env.CEREBRAS_KEYS)
export const GEMINI_API_KEYS = parseEnvKeys(process.env.GEMINI_KEYS)
export const SERPER_API_KEYS = parseEnvKeys(process.env.SERPER_KEYS)

const REQUEST_TIMEOUT_MS = 15_000

export function safeJsonExtract(text: string): unknown {
  let cleaned = text.trim()

  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")

  try {
    return JSON.parse(cleaned)
  } catch {
  }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0])
    } catch {
    }
  }

  const objectMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0])
    } catch {
    }
  }

  throw new Error("Failed to parse JSON from LLM response")
}

function buildPrompt(systemPrompt: string, payload?: Record<string, unknown>): string {
  return `SYSTEM:\n${systemPrompt}\n\nINPUT:\n${JSON.stringify(payload ?? {})}`
}

async function postJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return {
        ok: false,
        status: response.status,
        data: null,
        error: errorText.slice(0, 300) || response.statusText,
      }
    }

    const data = (await response.json()) as T
    return { ok: true, status: response.status, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed"
    return { ok: false, status: 0, data: null, error: message }
  } finally {
    clearTimeout(timeout)
  }
}

async function callGroqModel(
  model: string,
  apiKey: string,
  fullPrompt: string
): Promise<unknown | null> {
  const messages: ChatMessage[] = [{ role: "user", content: fullPrompt }]

  const result = await postJson<OpenAIChatResponse>(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
    }),
  })

  if (!result.ok || !result.data) {
    return null
  }

  const content = result.data.choices?.[0]?.message?.content
  if (!content) return null

  try {
    return safeJsonExtract(content)
  } catch {
    return null
  }
}

async function callCerebrasModel(
  model: string,
  apiKey: string,
  fullPrompt: string
): Promise<unknown | null> {
  const messages: ChatMessage[] = [{ role: "user", content: fullPrompt }]

  const result = await postJson<OpenAIChatResponse>(CEREBRAS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
    }),
  })

  if (!result.ok || !result.data) {
    return null
  }

  const content = result.data.choices?.[0]?.message?.content
  if (!content) return null

  try {
    return safeJsonExtract(content)
  } catch {
    return null
  }
}

async function callGeminiModel(
  apiKey: string,
  fullPrompt: string
): Promise<unknown | null> {
  const url = `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`

  const result = await postJson<GeminiGenerateResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  })

  if (!result.ok || !result.data) {
    return null
  }

  const text =
    result.data.candidates?.[0]?.content?.parts?.[0]?.text ?? undefined

  if (!text) return null

  try {
    return safeJsonExtract(text)
  } catch {
    return null
  }
}

/**
 * Routes a prompt through Groq → Cerebras → Gemini with key rotation.
 */
export async function call_ai(
  systemPrompt: string,
  payload?: Record<string, unknown>
): Promise<unknown> {
  const fullPrompt = buildPrompt(systemPrompt, payload)
  const errors: string[] = []

  if (GROQ_API_KEYS.length > 0) {
    for (const model of GROQ_MODELS) {
      for (let attempt = 0; attempt < GROQ_API_KEYS.length; attempt += 1) {
        const apiKey = GROQ_API_KEYS[GROQ_INDEX]
        const parsed = await callGroqModel(model, apiKey, fullPrompt)

        if (parsed !== null) {
          return parsed
        }

        errors.push(`Groq ${model} failed with key index ${GROQ_INDEX}`)
        GROQ_INDEX = (GROQ_INDEX + 1) % GROQ_API_KEYS.length
      }
    }
  } else {
    errors.push("No GROQ_KEYS configured")
  }

  if (CEREBRAS_API_KEYS.length > 0) {
    for (const model of CEREBRAS_MODELS) {
      for (let attempt = 0; attempt < CEREBRAS_API_KEYS.length; attempt += 1) {
        const apiKey = CEREBRAS_API_KEYS[CEREBRAS_INDEX]
        const parsed = await callCerebrasModel(model, apiKey, fullPrompt)

        if (parsed !== null) {
          return parsed
        }

        errors.push(`Cerebras ${model} failed with key index ${CEREBRAS_INDEX}`)
        CEREBRAS_INDEX = (CEREBRAS_INDEX + 1) % CEREBRAS_API_KEYS.length
      }
    }
  } else {
    errors.push("No CEREBRAS_KEYS configured")
  }

  if (GEMINI_API_KEYS.length > 0) {
    for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt += 1) {
      const apiKey = GEMINI_API_KEYS[GEMINI_INDEX]
      const parsed = await callGeminiModel(apiKey, fullPrompt)

      if (parsed !== null) {
        return parsed
      }

      errors.push(`Gemini ${GEMINI_MODEL} failed with key index ${GEMINI_INDEX}`)
      GEMINI_INDEX = (GEMINI_INDEX + 1) % GEMINI_API_KEYS.length
    }
  } else {
    errors.push("No GEMINI_KEYS configured")
  }

  throw new Error(
    `All LLM providers failed: ${errors.slice(0, 6).join("; ")}`
  )
}

/**
 * Reserved for future Serper-powered discovery in the scraper pipeline.
 */
export function getSerperApiKey(): string | null {
  if (SERPER_API_KEYS.length === 0) return null
  return SERPER_API_KEYS[0] ?? null
}
