export const MAX_LEAD_PDF_BYTES = 2 * 1024 * 1024

export const LEAD_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type EmploymentType = "employed" | "self_employed"

export type CardLeadFormContext = {
  card_id?: string
  bank_name?: string
  card_name?: string
  style_classes?: string
  source?: string
}

export type CreditCardLeadPayload = {
  full_name: string
  aadhar_number: string
  pan_number: string
  monthly_in_hand_salary: number
  employment_type: EmploymentType
  employer_name?: string
  self_employed_description?: string
  card_id?: string
  bank_name?: string
  card_name?: string
  source?: string
}

export type LeadFieldErrors = Partial<
  Record<
    | "full_name"
    | "aadhar_number"
    | "pan_number"
    | "monthly_in_hand_salary"
    | "employment_type"
    | "employer_name"
    | "self_employed_description"
    | "aadhar_document"
    | "pan_document",
    string
  >
>

export function normalizeAadhar(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12)
}

export function normalizePan(value: string): string {
  return value.replace(/\s/g, "").toUpperCase().slice(0, 10)
}

export function validateLeadFile(file: File | null | undefined): string | null {
  if (!file) return null

  if (!LEAD_ALLOWED_MIME_TYPES.includes(file.type as (typeof LEAD_ALLOWED_MIME_TYPES)[number])) {
    return "Upload PDF, JPG, PNG, or WebP only."
  }

  if (file.type === "application/pdf" && file.size > MAX_LEAD_PDF_BYTES) {
    return "PDF must be 2MB or smaller."
  }

  if (file.size > MAX_LEAD_PDF_BYTES) {
    return "File must be 2MB or smaller."
  }

  return null
}

export function validateCreditCardLeadInput(input: {
  full_name: string
  aadhar_number: string
  pan_number: string
  monthly_in_hand_salary: string
  employment_type: EmploymentType | ""
  employer_name: string
  self_employed_description: string
  aadhar_document?: File | null
  pan_document?: File | null
}): { errors: LeadFieldErrors; payload?: CreditCardLeadPayload } {
  const errors: LeadFieldErrors = {}

  const full_name = input.full_name.trim()
  if (!full_name) {
    errors.full_name = "Full name is required."
  }

  const aadhar_number = normalizeAadhar(input.aadhar_number)
  if (aadhar_number.length !== 12) {
    errors.aadhar_number = "Enter a valid 12-digit Aadhaar number."
  }

  const pan_number = normalizePan(input.pan_number)
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_number)) {
    errors.pan_number = "Enter a valid PAN (e.g. ABCDE1234F)."
  }

  const salary = Number(input.monthly_in_hand_salary.replace(/,/g, ""))
  if (!Number.isFinite(salary) || salary <= 0) {
    errors.monthly_in_hand_salary = "Enter your monthly in-hand salary."
  }

  if (input.employment_type !== "employed" && input.employment_type !== "self_employed") {
    errors.employment_type = "Select employment type."
  }

  const employer_name = input.employer_name.trim()
  const self_employed_description = input.self_employed_description.trim()

  if (input.employment_type === "employed" && !employer_name) {
    errors.employer_name = "Employer / organization name is required."
  }

  if (input.employment_type === "self_employed" && !self_employed_description) {
    errors.self_employed_description = "Describe what you do."
  }

  const aadharDocError = validateLeadFile(input.aadhar_document)
  if (aadharDocError) errors.aadhar_document = aadharDocError

  const panDocError = validateLeadFile(input.pan_document)
  if (panDocError) errors.pan_document = panDocError

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    errors,
    payload: {
      full_name,
      aadhar_number,
      pan_number,
      monthly_in_hand_salary: salary,
      employment_type: input.employment_type as EmploymentType,
      employer_name:
        input.employment_type === "employed" ? employer_name : undefined,
      self_employed_description:
        input.employment_type === "self_employed"
          ? self_employed_description
          : undefined,
    },
  }
}

export const DEFAULT_LEAD_CARD_STYLE =
  "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200"
