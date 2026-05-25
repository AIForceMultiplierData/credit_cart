/**
 * Downloads transparent bank logos into public/banks/
 * Run: node scripts/download-bank-logos.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, "..", "public", "banks")

/** Wikimedia thumb PNG (transparent) or Clearbit fallback */
const BANK_SOURCES = {
  hdfc: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Bank_Logo.svg/320px-HDFC_Bank_Logo.svg.png",
  sbi: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/State_Bank_of_India_logo.svg/320px-State_Bank_of_India_logo.svg.png",
  icici: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/320px-ICICI_Bank_Logo.svg.png",
  axis: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Axis_Bank_logo.svg/320px-Axis_Bank_logo.svg.png",
  kotak: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kotak_Mahindra_Bank_logo.svg/320px-Kotak_Mahindra_Bank_logo.svg.png",
  indusind: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/IndusInd_Bank_logo.svg/320px-IndusInd_Bank_logo.svg.png",
  pnb: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Punjab_National_Bank_logo.svg/320px-Punjab_National_Bank_logo.svg.png",
  bob: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Bank_of_Baroda_logo.svg/320px-Bank_of_Baroda_logo.svg.png",
  canara: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Canara_Bank_logo.svg/320px-Canara_Bank_logo.svg.png",
  union: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Union_Bank_of_India_logo.svg/320px-Union_Bank_of_India_logo.svg.png",
  boi: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bank_of_India_logo.svg/320px-Bank_of_India_logo.svg.png",
  iob: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Indian_Overseas_Bank_logo.svg/320px-Indian_Overseas_Bank_logo.svg.png",
  idbi: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/IDBI_Bank_logo.svg/320px-IDBI_Bank_logo.svg.png",
  yes: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Yes_Bank_logo.svg/320px-Yes_Bank_logo.svg.png",
  rbl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/RBL_Bank_logo.svg/320px-RBL_Bank_logo.svg.png",
  hsbc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/320px-HSBC_logo_%282018%29.svg.png",
  amex: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/320px-American_Express_logo_%282018%29.svg.png",
  citi: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Citibank_logo.svg/320px-Citibank_logo.svg.png",
  sc: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Standard_Chartered_%282021%29.svg/320px-Standard_Chartered_%282021%29.svg.png",
  idfc: "https://logo.clearbit.com/idfcfirstbank.com",
  au: "https://logo.clearbit.com/aubank.in",
  central: "https://logo.clearbit.com/centralbankofindia.co.in",
  uco: "https://logo.clearbit.com/ucobank.com",
  indian: "https://logo.clearbit.com/indianbank.in",
  bom: "https://logo.clearbit.com/bankofmaharashtra.in",
}

async function download(id, url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PoolPay-Asset-Sync/1.0" },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ext = url.includes(".svg") ? "svg" : "png"
  const file = path.join(outDir, `${id}.${ext}`)
  fs.writeFileSync(file, buf)
  return `/${path.posix.join("banks", `${id}.${ext}`)}`
}

fs.mkdirSync(outDir, { recursive: true })

const results = {}
for (const [id, url] of Object.entries(BANK_SOURCES)) {
  try {
    results[id] = await download(id, url)
    console.log("ok", id, results[id])
  } catch (e) {
    console.warn("skip", id, e.message)
  }
}

console.log(JSON.stringify(results, null, 2))
