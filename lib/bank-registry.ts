export type BankProfile = {
  bank_id: string
  bank_name: string
  logo_url: string
  brand_color: string
  style_classes: string
  display_order: number
}

/** Master bank dimension — mirrored in supabase/card_banks. */
export const BANK_REGISTRY: BankProfile[] = [
  {
    bank_id: "hdfc",
    bank_name: "HDFC",
    logo_url: "/banks/hdfc.svg",
    brand_color: "#004C8F",
    style_classes: "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100",
    display_order: 10,
  },
  {
    bank_id: "sbi",
    bank_name: "SBI",
    logo_url: "/banks/sbi.svg",
    brand_color: "#0096D6",
    style_classes: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
    display_order: 20,
  },
  {
    bank_id: "icici",
    bank_name: "ICICI",
    logo_url: "/banks/icici.svg",
    brand_color: "#F37021",
    style_classes:
      "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100",
    display_order: 30,
  },
  {
    bank_id: "axis",
    bank_name: "AXIS",
    logo_url: "/banks/axis.svg",
    brand_color: "#971237",
    style_classes:
      "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
    display_order: 40,
  },
  {
    bank_id: "kotak",
    bank_name: "KOTAK",
    logo_url: "/banks/kotak.svg",
    brand_color: "#ED1C24",
    style_classes: "bg-gradient-to-br from-red-700 to-red-950 text-red-100",
    display_order: 50,
  },
  {
    bank_id: "idfc",
    bank_name: "IDFC",
    logo_url: "/banks/idfc.svg",
    brand_color: "#9D2235",
    style_classes: "bg-gradient-to-br from-rose-800 to-slate-900 text-rose-100",
    display_order: 60,
  },
  {
    bank_id: "indusind",
    bank_name: "INDUSIND",
    logo_url: "/banks/indusind.svg",
    brand_color: "#832729",
    style_classes: "bg-gradient-to-br from-amber-800 to-red-950 text-amber-100",
    display_order: 70,
  },
  {
    bank_id: "default",
    bank_name: "BANK",
    logo_url: "/banks/default.svg",
    brand_color: "#64748B",
    style_classes: "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200",
    display_order: 999,
  },
]

const byName = new Map(
  BANK_REGISTRY.filter((b) => b.bank_id !== "default").map((b) => [
    b.bank_name.toUpperCase(),
    b,
  ])
)

const byId = new Map(BANK_REGISTRY.map((b) => [b.bank_id, b]))

export function toBankId(bankName: string): string {
  const normalized = bankName.trim().toUpperCase()
  const known = byName.get(normalized)
  if (known) return known.bank_id

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function resolveBankProfile(
  bankName: string,
  bankId?: string | null
): BankProfile {
  if (bankId && byId.has(bankId)) {
    return byId.get(bankId)!
  }

  const normalized = bankName.trim().toUpperCase()
  return byName.get(normalized) ?? byId.get("default")!
}

export function getBankLogoUrl(
  bankName: string,
  bankLogoUrl?: string | null
): string {
  if (bankLogoUrl?.trim()) return bankLogoUrl
  return resolveBankProfile(bankName).logo_url
}
