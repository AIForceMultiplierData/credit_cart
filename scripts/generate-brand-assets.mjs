import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const banksDir = path.join(root, "public", "banks")
const cardsDir = path.join(root, "public", "cards")

fs.mkdirSync(banksDir, { recursive: true })
fs.mkdirSync(cardsDir, { recursive: true })

const banks = {
  hdfc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#004C8F" d="M8 6h18v28H8z"/><path fill="#ED232A" d="M8 6h10v10H8z"/><text x="34" y="27" fill="#004C8F" font-family="Arial,sans-serif" font-size="14" font-weight="700">HDFC Bank</text></svg>`,
  sbi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><circle cx="20" cy="20" r="14" fill="#0096D6"/><path fill="#fff" d="M20 12a8 8 0 0 1 0 16 6 6 0 0 0 0-12 4 4 0 0 0 0 8 10 10 0 0 1 0-20z"/><text x="40" y="26" fill="#0096D6" font-family="Arial,sans-serif" font-size="11" font-weight="700">SBI</text></svg>`,
  icici: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><ellipse cx="22" cy="20" rx="16" ry="14" fill="#F37021"/><text x="22" y="26" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="700" font-style="italic">i</text><text x="44" y="26" fill="#F37021" font-family="Arial,sans-serif" font-size="13" font-weight="700" font-style="italic">ICICI Bank</text></svg>`,
  axis: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#971237" d="M10 30 L20 8 L30 30 Z"/><text x="38" y="18" fill="#971237" font-family="Arial,sans-serif" font-size="10" font-weight="700">AXIS</text><text x="38" y="28" fill="#971237" font-family="Arial,sans-serif" font-size="8" font-weight="600">BANK</text></svg>`,
  kotak: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="none" stroke="#003874" stroke-width="4" d="M8 22c8-12 16-12 24 0s16 12 24 0"/><circle cx="20" cy="22" r="3" fill="#ED232A"/><text x="42" y="26" fill="#003874" font-family="Arial,sans-serif" font-size="12" font-weight="700">kotak</text></svg>`,
  indusind: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><text x="4" y="18" fill="#832729" font-family="Georgia,serif" font-size="11" font-weight="700" font-style="italic">IndusInd</text><text x="4" y="30" fill="#832729" font-family="Georgia,serif" font-size="9" font-style="italic">Bank</text></svg>`,
  pnb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="6" width="28" height="28" rx="4" fill="#7D1935"/><text x="18" y="28" text-anchor="middle" fill="#F9B233" font-family="Arial,sans-serif" font-size="20" font-weight="900">P</text><text x="38" y="26" fill="#7D1935" font-family="Arial,sans-serif" font-size="10" font-weight="700">PNB</text></svg>`,
  bob: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><circle cx="18" cy="20" r="12" fill="#F57C00"/><path fill="#fff" d="M18 10v20M12 14h12M12 26h12"/><text x="36" y="26" fill="#F57C00" font-family="Arial,sans-serif" font-size="9" font-weight="700">Bank of Baroda</text></svg>`,
  idfc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="8" width="32" height="24" rx="2" fill="#9D2235"/><text x="8" y="22" fill="#fff" font-family="Arial,sans-serif" font-size="8" font-weight="700">IDFC FIRST</text><text x="8" y="30" fill="#fff" font-family="Arial,sans-serif" font-size="7">Bank</text></svg>`,
  canara: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#0084C7" d="M10 20 L18 10 L26 20 L18 30Z"/><path fill="#FFCB05" d="M14 20 L18 14 L22 20 L18 26Z"/><text x="32" y="26" fill="#0084C7" font-family="Arial,sans-serif" font-size="10" font-weight="700">Canara Bank</text></svg>`,
  union: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#D71920" d="M12 28c0-8 6-14 14-14s14 6 14 14"/><path fill="#004C8F" d="M12 28c0-8 6-14 14-14"/><text x="34" y="26" fill="#004C8F" font-family="Arial,sans-serif" font-size="9" font-weight="700">Union Bank</text></svg>`,
  boi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><polygon points="18,8 26,28 10,28" fill="#F57C00"/><circle cx="18" cy="22" r="4" fill="#fff"/><text x="32" y="26" fill="#0054A6" font-family="Arial,sans-serif" font-size="9" font-weight="700">Bank of India</text></svg>`,
  iob: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="6" y="10" width="24" height="20" fill="#0054A6"/><rect x="10" y="14" width="8" height="12" fill="#F57C00"/><text x="36" y="26" fill="#0054A6" font-family="Arial,sans-serif" font-size="8" font-weight="700">IOB</text></svg>`,
  idbi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="8" width="32" height="24" rx="3" fill="#008C3A"/><circle cx="20" cy="20" r="8" fill="#F57C00"/><text x="40" y="26" fill="#008C3A" font-family="Arial,sans-serif" font-size="11" font-weight="700">IDBI</text></svg>`,
  yes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="10" width="36" height="20" rx="2" fill="#004A8F"/><text x="8" y="24" fill="#fff" font-family="Arial,sans-serif" font-size="11" font-weight="900">YES BANK</text></svg>`,
  rbl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><text x="4" y="26" fill="#0054A6" font-family="Arial,sans-serif" font-size="18" font-weight="700">RBL</text><text x="4" y="34" fill="#0054A6" font-family="Arial,sans-serif" font-size="7">Bank</text></svg>`,
  hsbc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><polygon points="18,8 26,20 18,32 10,20" fill="#DB0011"/><text x="32" y="26" fill="#000" font-family="Arial,sans-serif" font-size="14" font-weight="700">HSBC</text></svg>`,
  amex: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="10" width="32" height="20" rx="3" fill="#006FCF"/><text x="8" y="24" fill="#fff" font-family="Arial,sans-serif" font-size="7" font-weight="700">AMERICAN</text><text x="8" y="32" fill="#fff" font-family="Arial,sans-serif" font-size="7" font-weight="700">EXPRESS</text></svg>`,
  citi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#004B8D" d="M8 28 Q20 8 32 28" stroke="#004B8D" stroke-width="3" fill="none"/><text x="8" y="24" fill="#D71F2D" font-family="Arial,sans-serif" font-size="16" font-weight="700">citi</text></svg>`,
  sc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><path fill="#00857F" d="M8 20a10 10 0 0 1 20 0"/><path fill="#38D200" d="M18 20a6 6 0 0 1 12 0"/><text x="34" y="18" fill="#004B8D" font-family="Arial,sans-serif" font-size="7" font-weight="700">Standard</text><text x="34" y="28" fill="#004B8D" font-family="Arial,sans-serif" font-size="7" font-weight="700">Chartered</text></svg>`,
  au: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="8" width="28" height="24" rx="4" fill="#6B21A8"/><circle cx="18" cy="20" r="8" fill="#F97316"/><text x="36" y="26" fill="#6B21A8" font-family="Arial,sans-serif" font-size="12" font-weight="800">AU</text></svg>`,
  central: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="6" y="10" width="20" height="20" fill="#004B8D"/><rect x="10" y="14" width="12" height="12" fill="#fff"/><text x="32" y="26" fill="#004B8D" font-family="Arial,sans-serif" font-size="8" font-weight="700">Central Bank</text></svg>`,
  uco: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="6" y="10" width="20" height="20" fill="#0054A6"/><text x="10" y="24" fill="#fff" font-family="Arial,sans-serif" font-size="8" font-weight="700">UCO</text><text x="32" y="26" fill="#0054A6" font-family="Arial,sans-serif" font-size="9" font-weight="700">UCO Bank</text></svg>`,
  indian: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><rect x="4" y="10" width="32" height="20" fill="#0054A6"/><text x="8" y="24" fill="#fff" font-family="Arial,sans-serif" font-size="9" font-weight="700">Indian Bank</text></svg>`,
  bom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><circle cx="18" cy="20" r="12" fill="#0054A6"/><text x="12" y="24" fill="#fff" font-family="Arial,sans-serif" font-size="7" font-weight="700">BOM</text><text x="34" y="26" fill="#0054A6" font-family="Arial,sans-serif" font-size="7" font-weight="700">Maharashtra</text></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" role="img"><text x="60" y="26" text-anchor="middle" fill="#64748B" font-family="Arial,sans-serif" font-size="14" font-weight="700">BANK</text></svg>`,
}

function cardSvg(id, bg, label, sub, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" role="img">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="100%" stop-color="${bg[1]}"/></linearGradient></defs>
  <rect width="380" height="240" rx="16" fill="url(#g)"/>
  ${extra}
  <rect x="28" y="52" width="44" height="34" rx="6" fill="#D4AF37" opacity="0.9"/>
  <text x="50" y="74" text-anchor="middle" fill="#1a1a1a" font-size="8" font-weight="700">CHIP</text>
  <text x="28" y="200" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700">${label}</text>
  <text x="28" y="220" fill="#fff" opacity="0.75" font-family="Arial,sans-serif" font-size="12">${sub}</text>
  <text x="320" y="210" fill="#fff" opacity="0.5" font-family="Arial,sans-serif" font-size="14" font-weight="700">VISA</text>
</svg>`
}

const cards = {
  hdfc_millennia: cardSvg("hdfc_millennia", ["#0c4a8f", "#1e3a5f"], "Millennia", "HDFC Bank", '<g opacity="0.15" fill="#fff">' + Array.from({length:8},(_,i)=>`<circle cx="${60+i*40}" cy="${40+(i%3)*30}" r="12"/>`).join('') + '</g>'),
  hdfc_regalia: cardSvg("hdfc_regalia", ["#1a1a1a", "#422006"], "Regalia Gold", "HDFC Bank", '<path fill="#C9A227" opacity="0.4" d="M200 0 L380 0 L380 240 L120 240Z"/>'),
  hdfc_diners: cardSvg("hdfc_diners", ["#0f0f0f", "#27272a"], "Diners Black", "HDFC Bank"),
  hdfc_swiggy: cardSvg("hdfc_swiggy", ["#F97316", "#7C3AED"], "Swiggy", "HDFC Bank", '<circle cx="300" cy="80" r="50" fill="#fff" opacity="0.15"/>'),
  hdfc_tata_neu: cardSvg("hdfc_tata_neu", ["#6B21A8", "#312e81"], "Tata NeuCard", "HDFC Bank", '<text x="280" y="100" fill="#fff" opacity="0.25" font-size="72" font-weight="900">N</text>'),
  hdfc_freedom: cardSvg("hdfc_freedom", ["#004C8F", "#1e40af"], "Freedom", "HDFC Bank", '<path fill="#EF4444" opacity="0.6" d="M180 120 L320 80 L320 160Z"/>'),
  sbi_cashback: cardSvg("sbi_cashback", ["#0891b2", "#1d4ed8"], "Cashback", "SBI Card"),
  sbi_simplyclick: cardSvg("sbi_simplyclick", ["#0d9488", "#065f46"], "SimplyCLICK", "SBI Card", '<circle cx="300" cy="100" r="60" fill="none" stroke="#fff" stroke-width="8" opacity="0.2"/>'),
  sbi_elite: cardSvg("sbi_elite", ["#1e3a5f", "#0f172a"], "Elite", "SBI Card"),
  icici_amazon: cardSvg("icici_amazon", ["#1f2937", "#c2410c"], "Amazon Pay", "ICICI Bank", '<text x="260" y="110" fill="#fff" opacity="0.2" font-size="48" font-weight="700">a</text>'),
  icici_sapphiro: cardSvg("icici_sapphiro", ["#475569", "#1e293b"], "Sapphiro", "ICICI Bank"),
  axis_flipkart: cardSvg("axis_flipkart", ["#971237", "#581c87"], "Flipkart Axis", "Axis Bank"),
  axis_magnus: cardSvg("axis_magnus", ["#7f1d1d", "#1c1917"], "Magnus", "Axis Bank"),
  axis_vistara: cardSvg("axis_vistara", ["#5B21B6", "#312e81"], "Vistara", "Axis Bank", '<g fill="#C9A227" opacity="0.35">' + Array.from({length:6},(_,i)=>`<circle cx="${220+i*25}" cy="${30+(i%2)*20}" r="18"/>`).join('') + '</g>'),
  axis_airtel: cardSvg("axis_airtel", ["#0f0f0f", "#881337"], "Airtel", "Axis Bank", '<ellipse cx="280" cy="90" rx="40" ry="30" fill="none" stroke="#fff" stroke-width="6" opacity="0.25"/>'),
}

for (const [id, svg] of Object.entries(banks)) {
  fs.writeFileSync(path.join(banksDir, `${id}.svg`), svg.trim())
}
for (const [id, svg] of Object.entries(cards)) {
  fs.writeFileSync(path.join(cardsDir, `${id}.svg`), svg.trim())
}
console.log("wrote", Object.keys(banks).length, "banks,", Object.keys(cards).length, "cards")
