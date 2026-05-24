import { NextResponse } from "next/server"
import {
  validateCreditCardLeadInput,
  validateLeadFile,
  type EmploymentType,
} from "@/lib/credit-card-lead"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

const LEAD_BUCKET = "credit-card-leads"

function extensionForMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf"
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    default:
      return "bin"
  }
}

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice("Bearer ".length).trim()
  if (!token) return null

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

async function uploadLeadDocument(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  leadId: string,
  kind: "aadhar" | "pan",
  file: File
): Promise<string | null> {
  const ext = extensionForMime(file.type)
  const path = `${userId}/${leadId}/${kind}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(LEAD_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new Error(`Could not upload ${kind} document: ${error.message}`)
  }

  return path
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Sign in is required to submit an application." },
        { status: 401 }
      )
    }

    const formData = await request.formData()

    const employmentRaw = String(formData.get("employment_type") ?? "")
    const employment_type =
      employmentRaw === "employed" || employmentRaw === "self_employed"
        ? (employmentRaw as EmploymentType)
        : ("" as const)

    const aadhar_document = formData.get("aadhar_document")
    const pan_document = formData.get("pan_document")

    const validation = validateCreditCardLeadInput({
      full_name: String(formData.get("full_name") ?? ""),
      aadhar_number: String(formData.get("aadhar_number") ?? ""),
      pan_number: String(formData.get("pan_number") ?? ""),
      monthly_in_hand_salary: String(formData.get("monthly_in_hand_salary") ?? ""),
      employment_type,
      employer_name: String(formData.get("employer_name") ?? ""),
      self_employed_description: String(
        formData.get("self_employed_description") ?? ""
      ),
      aadhar_document:
        aadhar_document instanceof File && aadhar_document.size > 0
          ? aadhar_document
          : null,
      pan_document:
        pan_document instanceof File && pan_document.size > 0 ? pan_document : null,
    })

    if (!validation.payload) {
      return NextResponse.json(
        { error: "Validation failed.", field_errors: validation.errors },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const leadId = crypto.randomUUID()

    let aadhar_document_path: string | null = null
    let pan_document_path: string | null = null

    if (aadhar_document instanceof File && aadhar_document.size > 0) {
      const fileError = validateLeadFile(aadhar_document)
      if (fileError) {
        return NextResponse.json(
          { error: fileError, field_errors: { aadhar_document: fileError } },
          { status: 400 }
        )
      }
      aadhar_document_path = await uploadLeadDocument(
        admin,
        user.id,
        leadId,
        "aadhar",
        aadhar_document
      )
    }

    if (pan_document instanceof File && pan_document.size > 0) {
      const fileError = validateLeadFile(pan_document)
      if (fileError) {
        return NextResponse.json(
          { error: fileError, field_errors: { pan_document: fileError } },
          { status: 400 }
        )
      }
      pan_document_path = await uploadLeadDocument(
        admin,
        user.id,
        leadId,
        "pan",
        pan_document
      )
    }

    const card_id = String(formData.get("card_id") ?? "").trim() || null
    const bank_name = String(formData.get("bank_name") ?? "").trim() || null
    const card_name = String(formData.get("card_name") ?? "").trim() || null
    const source = String(formData.get("source") ?? "apply_cta").trim() || "apply_cta"

    const { data, error } = await admin
      .from("credit_card_leads")
      .insert({
        id: leadId,
        user_id: user.id,
        card_id,
        bank_name,
        card_name,
        full_name: validation.payload.full_name,
        aadhar_number: validation.payload.aadhar_number,
        pan_number: validation.payload.pan_number,
        aadhar_document_path,
        pan_document_path,
        monthly_in_hand_salary: validation.payload.monthly_in_hand_salary,
        employment_type: validation.payload.employment_type,
        employer_name: validation.payload.employer_name ?? null,
        self_employed_description:
          validation.payload.self_employed_description ?? null,
        source,
        status: "new",
      })
      .select("id, created_at")
      .single()

    if (error) {
      if (aadhar_document_path) {
        await admin.storage.from(LEAD_BUCKET).remove([aadhar_document_path])
      }
      if (pan_document_path) {
        await admin.storage.from(LEAD_BUCKET).remove([pan_document_path])
      }

      if (
        error.message.includes("credit_card_leads") ||
        error.code === "PGRST205"
      ) {
        return NextResponse.json(
          {
            error:
              "Leads table not installed. Run supabase/credit_card_leads.sql in Supabase SQL Editor.",
          },
          { status: 503 }
        )
      }

      throw error
    }

    return NextResponse.json({
      ok: true,
      lead_id: data.id,
      created_at: data.created_at,
      message: "Application submitted. Our team will reach out shortly.",
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not submit application."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
