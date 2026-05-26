/** Dev / QA — any tester can sign in with this code */
export const POOLPAY_TEST_OTP = "0000"

export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`
  if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(3)}`
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`
  return null
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function phoneToAuthEmail(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "")
  return `phone_${digits}@poolpay.auth`
}
