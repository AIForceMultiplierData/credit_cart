export type BankProfile = {
  bank_id: string
  bank_name: string
  logo_url: string
  brand_color: string
  style_classes: string
  display_order: number
}

const BANK_ROWS: (Omit<BankProfile, "display_order"> & { order: number })[] = [
  { bank_id: "hdfc", bank_name: "HDFC", logo_url: "/banks/hdfc.svg", brand_color: "#004C8F", style_classes: "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100", order: 10 },
  { bank_id: "sbi", bank_name: "SBI", logo_url: "/banks/sbi.svg", brand_color: "#0096D6", style_classes: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white", order: 20 },
  { bank_id: "icici", bank_name: "ICICI", logo_url: "/banks/icici.svg", brand_color: "#F37021", style_classes: "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100", order: 30 },
  { bank_id: "axis", bank_name: "AXIS", logo_url: "/banks/axis.svg", brand_color: "#971237", style_classes: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white", order: 40 },
  { bank_id: "kotak", bank_name: "KOTAK", logo_url: "/banks/kotak.svg", brand_color: "#ED1C24", style_classes: "bg-gradient-to-br from-red-700 to-red-950 text-red-100", order: 50 },
  { bank_id: "idfc", bank_name: "IDFC", logo_url: "/banks/idfc.svg", brand_color: "#9D2235", style_classes: "bg-gradient-to-br from-rose-800 to-slate-900 text-rose-100", order: 60 },
  { bank_id: "indusind", bank_name: "INDUSIND", logo_url: "/banks/indusind.svg", brand_color: "#832729", style_classes: "bg-gradient-to-br from-amber-800 to-red-950 text-amber-100", order: 70 },
  { bank_id: "pnb", bank_name: "PNB", logo_url: "/banks/pnb.svg", brand_color: "#7D1935", style_classes: "bg-gradient-to-br from-red-900 to-amber-950 text-amber-100", order: 80 },
  { bank_id: "bob", bank_name: "BOB", logo_url: "/banks/bob.svg", brand_color: "#F57C00", style_classes: "bg-gradient-to-br from-orange-600 to-red-800 text-white", order: 90 },
  { bank_id: "canara", bank_name: "CANARA", logo_url: "/banks/canara.svg", brand_color: "#0084C7", style_classes: "bg-gradient-to-br from-blue-600 to-yellow-700 text-white", order: 100 },
  { bank_id: "union", bank_name: "UNION", logo_url: "/banks/union.svg", brand_color: "#D71920", style_classes: "bg-gradient-to-br from-red-600 to-blue-800 text-white", order: 110 },
  { bank_id: "boi", bank_name: "BOI", logo_url: "/banks/boi.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-800 to-orange-700 text-white", order: 120 },
  { bank_id: "iob", bank_name: "IOB", logo_url: "/banks/iob.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-700 to-orange-600 text-white", order: 130 },
  { bank_id: "idbi", bank_name: "IDBI", logo_url: "/banks/idbi.svg", brand_color: "#008C3A", style_classes: "bg-gradient-to-br from-green-700 to-orange-800 text-white", order: 140 },
  { bank_id: "yes", bank_name: "YES", logo_url: "/banks/yes.svg", brand_color: "#004A8F", style_classes: "bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100", order: 150 },
  { bank_id: "rbl", bank_name: "RBL", logo_url: "/banks/rbl.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-700 to-slate-900 text-white", order: 160 },
  { bank_id: "hsbc", bank_name: "HSBC", logo_url: "/banks/hsbc.svg", brand_color: "#DB0011", style_classes: "bg-gradient-to-br from-red-700 to-slate-900 text-white", order: 170 },
  { bank_id: "amex", bank_name: "AMEX", logo_url: "/banks/amex.svg", brand_color: "#006FCF", style_classes: "bg-gradient-to-br from-blue-700 to-slate-800 text-white", order: 180 },
  { bank_id: "citi", bank_name: "CITI", logo_url: "/banks/citi.svg", brand_color: "#004B8D", style_classes: "bg-gradient-to-br from-blue-800 to-red-900 text-white", order: 190 },
  { bank_id: "sc", bank_name: "SC", logo_url: "/banks/sc.svg", brand_color: "#00857F", style_classes: "bg-gradient-to-br from-teal-600 to-green-700 text-white", order: 200 },
  { bank_id: "au", bank_name: "AU", logo_url: "/banks/au.svg", brand_color: "#6B21A8", style_classes: "bg-gradient-to-br from-purple-700 to-orange-600 text-white", order: 210 },
  { bank_id: "central", bank_name: "CENTRAL", logo_url: "/banks/central.svg", brand_color: "#004B8D", style_classes: "bg-gradient-to-br from-blue-800 to-slate-900 text-white", order: 220 },
  { bank_id: "uco", bank_name: "UCO", logo_url: "/banks/uco.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-700 to-slate-900 text-white", order: 230 },
  { bank_id: "indian", bank_name: "INDIAN", logo_url: "/banks/indian.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-800 to-blue-950 text-white", order: 240 },
  { bank_id: "bom", bank_name: "BOM", logo_url: "/banks/bom.svg", brand_color: "#0054A6", style_classes: "bg-gradient-to-br from-blue-700 to-indigo-900 text-white", order: 250 },
  { bank_id: "default", bank_name: "BANK", logo_url: "/banks/default.svg", brand_color: "#64748B", style_classes: "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200", order: 999 },
]

/** Master bank dimension — mirrored in supabase/card_banks. */
export const BANK_REGISTRY: BankProfile[] = BANK_ROWS.map((row) => ({
  bank_id: row.bank_id,
  bank_name: row.bank_name,
  logo_url: row.logo_url,
  brand_color: row.brand_color,
  style_classes: row.style_classes,
  display_order: row.order,
}))

const NAME_ALIASES: Record<string, string> = {
  "HDFC BANK": "HDFC",
  "HDFC BANK LTD": "HDFC",
  "STATE BANK OF INDIA": "SBI",
  "SBI CARD": "SBI",
  "ICICI BANK": "ICICI",
  "AXIS BANK": "AXIS",
  "KOTAK MAHINDRA": "KOTAK",
  "KOTAK MAHINDRA BANK": "KOTAK",
  "IDFC FIRST": "IDFC",
  "IDFC FIRST BANK": "IDFC",
  "INDUSIND BANK": "INDUSIND",
  "PUNJAB NATIONAL BANK": "PNB",
  "BANK OF BARODA": "BOB",
  "CANARA BANK": "CANARA",
  "UNION BANK": "UNION",
  "UNION BANK OF INDIA": "UNION",
  "BANK OF INDIA": "BOI",
  "INDIAN OVERSEAS BANK": "IOB",
  "YES BANK": "YES",
  "RBL BANK": "RBL",
  "STANDARD CHARTERED": "SC",
  "AMERICAN EXPRESS": "AMEX",
  "CITIBANK": "CITI",
  "AU SMALL FINANCE BANK": "AU",
  "CENTRAL BANK OF INDIA": "CENTRAL",
  "UCO BANK": "UCO",
  "INDIAN BANK": "INDIAN",
  "BANK OF MAHARASHTRA": "BOM",
}

const byName = new Map(
  BANK_REGISTRY.filter((b) => b.bank_id !== "default").map((b) => [
    b.bank_name.toUpperCase(),
    b,
  ])
)

const byId = new Map(BANK_REGISTRY.map((b) => [b.bank_id, b]))

function normalizeBankKey(bankName: string): string {
  return bankName.trim().toUpperCase().replace(/\s+/g, " ")
}

export function toBankId(bankName: string): string {
  const normalized = normalizeBankKey(bankName)
  const alias = NAME_ALIASES[normalized]
  if (alias) {
    const known = byName.get(alias)
    if (known) return known.bank_id
  }
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

  const normalized = normalizeBankKey(bankName)
  const alias = NAME_ALIASES[normalized]
  if (alias && byName.has(alias)) {
    return byName.get(alias)!
  }
  return byName.get(normalized) ?? byId.get("default")!
}

export function getBankLogoUrl(
  bankName: string,
  bankLogoUrl?: string | null
): string {
  if (bankLogoUrl?.trim()) return bankLogoUrl
  return resolveBankProfile(bankName).logo_url
}
