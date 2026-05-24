export type CatalogCard = {
  card_id: string
  bank_name: string
  card_name: string
  style_classes: string
  apply_url: string
}

/** Mirror of supabase/card_catalog.sql — used server-side for deal teasers. */
export const CARD_CATALOG: CatalogCard[] = [
  {
    card_id: "hdfc_millennia",
    bank_name: "HDFC",
    card_name: "Millennia",
    style_classes:
      "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100",
    apply_url:
      "https://www.hdfc.bank.in/credit-cards/millenia-credit-card",
  },
  {
    card_id: "hdfc_regalia",
    bank_name: "HDFC",
    card_name: "Regalia Gold",
    style_classes:
      "bg-gradient-to-br from-yellow-700 to-amber-950 text-yellow-100",
    apply_url:
      "https://www.hdfc.bank.in/credit-cards/regalia-gold-credit-card",
  },
  {
    card_id: "hdfc_diners",
    bank_name: "HDFC",
    card_name: "Diners Club Black",
    style_classes: "bg-gradient-to-br from-zinc-900 to-black text-slate-300",
    apply_url:
      "https://www.hdfc.bank.in/credit-cards/diners-club-black-credit-card",
  },
  {
    card_id: "sbi_cashback",
    bank_name: "SBI",
    card_name: "Cashback Card",
    style_classes: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
    apply_url:
      "https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.page",
  },
  {
    card_id: "sbi_simplyclick",
    bank_name: "SBI",
    card_name: "SimplyCLICK",
    style_classes: "bg-gradient-to-br from-teal-400 to-emerald-700 text-white",
    apply_url:
      "https://www.sbicard.com/en/personal/credit-cards/simplyclick-sbi-card.page",
  },
  {
    card_id: "icici_amazon",
    bank_name: "ICICI",
    card_name: "Amazon Pay",
    style_classes:
      "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100",
    apply_url:
      "https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-icici-bank-credit-card",
  },
  {
    card_id: "icici_sapphiro",
    bank_name: "ICICI",
    card_name: "Sapphiro",
    style_classes: "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200",
    apply_url:
      "https://www.icicibank.com/personal-banking/cards/credit-card/sapphiro-credit-card",
  },
  {
    card_id: "axis_flipkart",
    bank_name: "AXIS",
    card_name: "Flipkart Axis",
    style_classes:
      "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
    apply_url:
      "https://www.axis.bank.in/cards/credit-card/flipkart-axis-bank-credit-card",
  },
  {
    card_id: "axis_magnus",
    bank_name: "AXIS",
    card_name: "Magnus",
    style_classes: "bg-gradient-to-br from-zinc-800 to-red-950 text-red-100",
    apply_url:
      "https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card",
  },
]

export function getCatalogCard(cardId: string): CatalogCard | undefined {
  return CARD_CATALOG.find((card) => card.card_id === cardId)
}
