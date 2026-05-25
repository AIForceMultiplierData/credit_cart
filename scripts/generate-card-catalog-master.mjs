/**
 * Generates card catalog master SQL + TypeScript from live product list.
 * Run: node scripts/generate-card-catalog-master.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

/** [card_slug, card_name, card_image_url, brand_color, style_classes, display_order] */
const CARD_ROWS = [
  // HDFC
  ["hdfc_infinia", "HDFC Infinia Metal", "/cards/hdfc_infinia.svg", "#111827", "bg-gradient-to-br from-slate-900 to-black text-slate-200", 10],
  ["hdfc_diners_black", "HDFC Diners Club Black", "/cards/hdfc_diners_black.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-zinc-300", 11],
  ["hdfc_regalia_gold", "HDFC Regalia Gold", "/cards/hdfc_regalia_gold.svg", "#D4AF37", "bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-50", 12],
  ["hdfc_millennia", "HDFC Millennia", "/cards/hdfc_millennia.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100", 13],
  ["hdfc_tata_neu_infinity", "Tata Neu Infinity HDFC", "/cards/hdfc_tata_neu_infinity.svg", "#4C1D95", "bg-gradient-to-br from-purple-900 to-violet-950 text-purple-100", 14],
  ["hdfc_tata_neu_plus", "Tata Neu Plus HDFC", "/cards/hdfc_tata_neu_plus.svg", "#312E81", "bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100", 15],
  ["hdfc_swiggy", "Swiggy HDFC", "/cards/hdfc_swiggy.svg", "#FC8019", "bg-gradient-to-br from-orange-500 to-black text-orange-50", 16],
  ["hdfc_moneyback_plus", "HDFC MoneyBack+", "/cards/hdfc_moneyback_plus.svg", "#334155", "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100", 17],
  ["hdfc_indianoil", "IndianOil HDFC", "/cards/hdfc_indianoil.svg", "#EA580C", "bg-gradient-to-br from-orange-600 to-orange-800 text-orange-50", 18],
  ["hdfc_freedom", "HDFC Freedom", "/cards/hdfc_freedom.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50", 19],
  // ICICI
  ["icici_emeralde_private", "ICICI Emeralde Private", "/cards/icici_emeralde_private.svg", "#064E3B", "bg-gradient-to-br from-emerald-900 to-green-950 text-emerald-100", 20],
  ["icici_sapphiro", "ICICI Sapphiro", "/cards/icici_sapphiro.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-indigo-950 text-blue-100", 21],
  ["icici_rubyx", "ICICI Rubyx", "/cards/icici_rubyx.svg", "#9F1239", "bg-gradient-to-br from-rose-800 to-red-950 text-rose-100", 22],
  ["icici_coral", "ICICI Coral", "/cards/icici_coral.svg", "#F43F5E", "bg-gradient-to-br from-rose-500 to-pink-800 text-rose-50", 23],
  ["icici_amazon_pay", "Amazon Pay ICICI", "/cards/icici_amazon_pay.svg", "#EA580C", "bg-gradient-to-br from-orange-600 to-red-900 text-orange-50", 24],
  ["icici_mmt_signature", "MakeMyTrip ICICI Signature", "/cards/icici_mmt_signature.svg", "#171717", "bg-gradient-to-br from-zinc-900 to-black text-zinc-200", 25],
  ["icici_mmt_platinum", "MakeMyTrip ICICI Platinum", "/cards/icici_mmt_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 26],
  ["icici_adani_signature", "Adani One ICICI Signature", "/cards/icici_adani_signature.svg", "#000000", "bg-gradient-to-br from-black to-yellow-900 text-yellow-500", 27],
  ["icici_hpcl_super_saver", "ICICI HPCL Super Saver", "/cards/icici_hpcl_super_saver.svg", "#DC2626", "bg-gradient-to-br from-red-600 to-blue-900 text-red-50", 28],
  ["icici_man_utd", "ICICI Manchester United", "/cards/icici_man_utd.svg", "#B91C1C", "bg-gradient-to-br from-red-700 to-red-900 text-red-50", 29],
  // SBI
  ["sbi_aurum", "SBI Card Aurum", "/cards/sbi_aurum.svg", "#111827", "bg-gradient-to-br from-black to-zinc-800 text-amber-500", 30],
  ["sbi_elite", "SBI Card Elite", "/cards/sbi_elite.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400", 31],
  ["sbi_cashback", "Cashback SBI Card", "/cards/sbi_cashback.svg", "#0891B2", "bg-gradient-to-br from-cyan-600 to-blue-900 text-cyan-50", 32],
  ["sbi_simplyclick", "SimplyCLICK SBI Card", "/cards/sbi_simplyclick.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50", 33],
  ["sbi_simplysave", "SimplySAVE SBI Card", "/cards/sbi_simplysave.svg", "#B45309", "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50", 34],
  ["sbi_prime", "SBI Card PRIME", "/cards/sbi_prime.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100", 35],
  ["sbi_pulse", "SBI Card PULSE", "/cards/sbi_pulse.svg", "#581C87", "bg-gradient-to-br from-purple-800 to-fuchsia-950 text-purple-100", 36],
  ["sbi_bpcl_octane", "BPCL SBI Card OCTANE", "/cards/sbi_bpcl_octane.svg", "#374151", "bg-gradient-to-br from-slate-700 to-slate-900 text-green-400", 37],
  ["sbi_club_vistara_prime", "Club Vistara SBI Card PRIME", "/cards/sbi_club_vistara_prime.svg", "#4C1D95", "bg-gradient-to-br from-indigo-900 to-violet-950 text-amber-500", 38],
  ["sbi_reliance_prime", "Reliance SBI Card PRIME", "/cards/sbi_reliance_prime.svg", "#DC2626", "bg-gradient-to-br from-red-600 to-red-900 text-red-50", 39],
  // AXIS
  ["axis_reserve", "Axis Bank Reserve", "/cards/axis_reserve.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-yellow-500", 40],
  ["axis_magnus", "Axis Bank Magnus", "/cards/axis_magnus.svg", "#7F1D1D", "bg-gradient-to-br from-red-900 to-rose-950 text-red-100", 41],
  ["axis_atlas", "Axis Bank ATLAS", "/cards/axis_atlas.svg", "#64748B", "bg-gradient-to-br from-slate-500 to-slate-800 text-slate-100", 42],
  ["axis_flipkart", "Flipkart Axis Bank", "/cards/axis_flipkart.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-yellow-400", 43],
  ["axis_ace", "Axis Bank ACE", "/cards/axis_ace.svg", "#0D9488", "bg-gradient-to-br from-teal-500 to-teal-800 text-teal-50", 44],
  ["axis_airtel", "Airtel Axis Bank", "/cards/axis_airtel.svg", "#E11D48", "bg-gradient-to-br from-rose-600 to-black text-rose-50", 45],
  ["axis_neo", "Axis Bank Neo", "/cards/axis_neo.svg", "#4338CA", "bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50", 46],
  ["axis_my_zone", "Axis Bank MY ZONE", "/cards/axis_my_zone.svg", "#1F2937", "bg-gradient-to-br from-gray-700 to-black text-red-500", 47],
  ["axis_vistara_infinite", "Axis Bank Vistara Infinite", "/cards/axis_vistara_infinite.svg", "#5B21B6", "bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500", 48],
  ["axis_select", "Axis Bank SELECT", "/cards/axis_select.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 49],
  // KOTAK
  ["kotak_white_reserve", "Kotak White Reserve", "/cards/kotak_white_reserve.svg", "#F8FAFC", "bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800", 50],
  ["kotak_zen_signature", "Kotak Zen Signature", "/cards/kotak_zen_signature.svg", "#1F2937", "bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100", 51],
  ["kotak_privy_league", "Kotak Privy League Signature", "/cards/kotak_privy_league.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-indigo-950 text-yellow-500", 52],
  ["kotak_royale_signature", "Kotak Royale Signature", "/cards/kotak_royale_signature.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-900 text-yellow-400", 53],
  ["kotak_league_platinum", "Kotak League Platinum", "/cards/kotak_league_platinum.svg", "#DC2626", "bg-gradient-to-br from-red-600 to-red-800 text-red-50", 54],
  ["kotak_mojo_platinum", "Kotak Mojo Platinum", "/cards/kotak_mojo_platinum.svg", "#000000", "bg-gradient-to-br from-black to-zinc-800 text-yellow-500", 55],
  ["kotak_811", "Kotak 811 #DreamDifferent", "/cards/kotak_811.svg", "#B91C1C", "bg-gradient-to-br from-red-700 to-red-900 text-white", 56],
  ["kotak_pvr_platinum", "Kotak PVR Platinum", "/cards/kotak_pvr_platinum.svg", "#111827", "bg-gradient-to-br from-gray-800 to-black text-yellow-500", 57],
  ["kotak_indianoil", "IndianOil Kotak", "/cards/kotak_indianoil.svg", "#EA580C", "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50", 58],
  ["kotak_myntra", "Kotak Myntra", "/cards/kotak_myntra.svg", "#DB2777", "bg-gradient-to-br from-pink-600 to-purple-700 text-pink-50", 59],
  // IDFC
  ["idfc_private", "FIRST Private", "/cards/idfc_private.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-zinc-300", 60],
  ["idfc_mayura", "FIRST Mayura", "/cards/idfc_mayura.svg", "#0F766E", "bg-gradient-to-br from-teal-700 to-teal-950 text-amber-400", 61],
  ["idfc_ashva", "FIRST Ashva", "/cards/idfc_ashva.svg", "#78350F", "bg-gradient-to-br from-amber-800 to-amber-950 text-amber-200", 62],
  ["idfc_wealth", "FIRST Wealth", "/cards/idfc_wealth.svg", "#172554", "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100", 63],
  ["idfc_select", "FIRST Select", "/cards/idfc_select.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 64],
  ["idfc_millennia", "FIRST Millennia", "/cards/idfc_millennia.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 65],
  ["idfc_classic", "FIRST Classic", "/cards/idfc_classic.svg", "#7F1D1D", "bg-gradient-to-br from-red-800 to-red-950 text-red-50", 66],
  ["idfc_wow", "FIRST WOW!", "/cards/idfc_wow.svg", "#4B5563", "bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100", 67],
  ["idfc_power_plus", "FIRST Power+", "/cards/idfc_power_plus.svg", "#991B1B", "bg-gradient-to-br from-red-700 to-red-900 text-red-50", 68],
  ["idfc_indigo", "IndiGo IDFC FIRST", "/cards/idfc_indigo.svg", "#4338CA", "bg-gradient-to-br from-indigo-600 to-indigo-900 text-indigo-50", 69],
  // INDUSIND
  ["indusind_legend", "IndusInd Bank Legend", "/cards/indusind_legend.svg", "#832232", "bg-gradient-to-br from-red-900 to-orange-950 text-red-100", 70],
  ["indusind_pinnacle", "IndusInd Bank Pinnacle", "/cards/indusind_pinnacle.svg", "#111827", "bg-gradient-to-br from-black to-zinc-900 text-yellow-500", 71],
  ["indusind_aura_edge", "IndusInd Bank Aura Edge", "/cards/indusind_aura_edge.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200", 72],
  ["indusind_platinum_aura", "IndusInd Bank Platinum Aura", "/cards/indusind_platinum_aura.svg", "#94A3B8", "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900", 73],
  ["indusind_iconia", "IndusInd Bank Iconia", "/cards/indusind_iconia.svg", "#374151", "bg-gradient-to-br from-slate-600 to-slate-800 text-blue-100", 74],
  ["indusind_nexxt", "IndusInd Bank Nexxt", "/cards/indusind_nexxt.svg", "#18181B", "bg-gradient-to-br from-zinc-800 to-black text-cyan-400", 75],
  ["indusind_eazydiner", "EazyDiner IndusInd Bank", "/cards/indusind_eazydiner.svg", "#D97706", "bg-gradient-to-br from-amber-600 to-stone-900 text-amber-50", 76],
  ["indusind_club_vistara", "Club Vistara IndusInd Bank", "/cards/indusind_club_vistara.svg", "#5B21B6", "bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500", 77],
  ["indusind_tiger", "IndusInd Bank Tiger", "/cards/indusind_tiger.svg", "#EA580C", "bg-gradient-to-br from-orange-600 to-orange-900 text-orange-50", 78],
  ["indusind_crest", "IndusInd Bank Crest", "/cards/indusind_crest.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-slate-950 text-yellow-400", 79],
  // PNB
  ["pnb_rupay_select", "PNB RuPay Select", "/cards/pnb_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-100", 80],
  ["pnb_rupay_platinum", "PNB RuPay Platinum", "/cards/pnb_rupay_platinum.svg", "#334155", "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100", 81],
  ["pnb_visa_signature", "PNB Visa Signature", "/cards/pnb_visa_signature.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-950 text-blue-50", 82],
  ["pnb_visa_platinum", "PNB Visa Platinum", "/cards/pnb_visa_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 83],
  ["pnb_rupay_millennial", "PNB RuPay Millennial", "/cards/pnb_rupay_millennial.svg", "#4F46E5", "bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50", 84],
  ["pnb_wave", "PNB Wave", "/cards/pnb_wave.svg", "#0891B2", "bg-gradient-to-br from-cyan-600 to-blue-800 text-cyan-50", 85],
  ["pnb_rakshak", "PNB Rakshak RuPay Select", "/cards/pnb_rakshak.svg", "#4D7C0F", "bg-gradient-to-br from-lime-700 to-green-900 text-lime-50", 86],
  ["pnb_patanjali_platinum", "PNB Patanjali RuPay Platinum", "/cards/pnb_patanjali_platinum.svg", "#15803D", "bg-gradient-to-br from-green-700 to-green-900 text-green-50", 87],
  ["pnb_global_gold", "PNB Global Gold", "/cards/pnb_global_gold.svg", "#D97706", "bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-50", 88],
  ["pnb_global_classic", "PNB Global Classic", "/cards/pnb_global_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 89],
  // BOB
  ["bob_eterna", "BOB Eterna", "/cards/bob_eterna.svg", "#111827", "bg-gradient-to-br from-black to-zinc-900 text-yellow-500", 90],
  ["bob_premier", "BOB Premier", "/cards/bob_premier.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 91],
  ["bob_select", "BOB Select", "/cards/bob_select.svg", "#1E3A8A", "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50", 92],
  ["bob_easy", "BOB Easy", "/cards/bob_easy.svg", "#F59E0B", "bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50", 93],
  ["bob_hpcl_energie", "BOB HPCL Energie", "/cards/bob_hpcl_energie.svg", "#DC2626", "bg-gradient-to-br from-red-600 to-blue-800 text-red-50", 94],
  ["bob_irctc", "BOB IRCTC", "/cards/bob_irctc.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50", 95],
  ["bob_snapdeal", "BOB Snapdeal", "/cards/bob_snapdeal.svg", "#E11D48", "bg-gradient-to-br from-rose-600 to-red-800 text-rose-50", 96],
  ["bob_yoddha", "BOB Yoddha", "/cards/bob_yoddha.svg", "#166534", "bg-gradient-to-br from-green-700 to-green-900 text-green-50", 97],
  ["bob_varunah", "BOB Varunah Plus", "/cards/bob_varunah.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-blue-950 text-blue-100", 98],
  ["bob_pragati", "BOB Pragati", "/cards/bob_pragati.svg", "#047857", "bg-gradient-to-br from-emerald-600 to-green-800 text-emerald-50", 99],
  // CANARA
  ["canara_visa_signature", "Canara Visa Signature", "/cards/canara_visa_signature.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-black text-slate-200", 100],
  ["canara_rupay_select", "Canara RuPay Select", "/cards/canara_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50", 101],
  ["canara_mastercard_world", "Canara Mastercard World", "/cards/canara_mastercard_world.svg", "#171717", "bg-gradient-to-br from-zinc-800 to-black text-zinc-300", 102],
  ["canara_visa_platinum", "Canara Visa Platinum", "/cards/canara_visa_platinum.svg", "#64748B", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 103],
  ["canara_rupay_platinum", "Canara RuPay Platinum", "/cards/canara_rupay_platinum.svg", "#1D4ED8", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 104],
  ["canara_mastercard_platinum", "Canara Mastercard Platinum", "/cards/canara_mastercard_platinum.svg", "#334155", "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100", 105],
  ["canara_visa_classic", "Canara Visa Classic", "/cards/canara_visa_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50", 106],
  ["canara_rupay_classic", "Canara RuPay Classic", "/cards/canara_rupay_classic.svg", "#047857", "bg-gradient-to-br from-emerald-600 to-teal-800 text-emerald-50", 107],
  ["canara_mastercard_classic", "Canara Mastercard Classic", "/cards/canara_mastercard_classic.svg", "#0284C7", "bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50", 108],
  ["canara_corporate", "Canara Corporate", "/cards/canara_corporate.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-slate-900 text-yellow-500", 109],
  // UNION
  ["union_uni_carbon", "Union Bank Uni Carbon", "/cards/union_uni_carbon.svg", "#374151", "bg-gradient-to-br from-gray-700 to-green-900 text-green-100", 110],
  ["union_signature", "Union Bank Signature", "/cards/union_signature.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-yellow-500", 111],
  ["union_rupay_select", "Union Bank RuPay Select", "/cards/union_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50", 112],
  ["union_jcb_premier", "Union Bank JCB Premier", "/cards/union_jcb_premier.svg", "#B91C1C", "bg-gradient-to-br from-red-700 to-red-950 text-yellow-500", 113],
  ["union_platinum", "Union Bank Platinum", "/cards/union_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 114],
  ["union_rupay_platinum", "Union Bank RuPay Platinum", "/cards/union_rupay_platinum.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50", 115],
  ["union_usecure", "Union Bank Usecure", "/cards/union_usecure.svg", "#0EA5E9", "bg-gradient-to-br from-sky-500 to-sky-700 text-sky-50", 116],
  ["union_gold", "Union Bank Gold", "/cards/union_gold.svg", "#D97706", "bg-gradient-to-br from-yellow-500 to-amber-700 text-amber-50", 117],
  ["union_disha", "Union Bank Disha", "/cards/union_disha.svg", "#15803D", "bg-gradient-to-br from-green-600 to-green-800 text-green-50", 118],
  ["union_classic", "Union Bank Classic", "/cards/union_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50", 119],
  // BOI
  ["boi_visa_signature", "BOI Visa Signature", "/cards/boi_visa_signature.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-black text-slate-200", 120],
  ["boi_rupay_select", "BOI RuPay Select", "/cards/boi_rupay_select.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100", 121],
  ["boi_visa_platinum", "BOI Visa Platinum", "/cards/boi_visa_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 122],
  ["boi_rupay_platinum", "BOI RuPay Platinum", "/cards/boi_rupay_platinum.svg", "#334155", "bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100", 123],
  ["boi_mastercard_platinum", "BOI Mastercard Platinum", "/cards/boi_mastercard_platinum.svg", "#374151", "bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100", 124],
  ["boi_swadhaan", "BOI SwaDhaan RuPay", "/cards/boi_swadhaan.svg", "#EA580C", "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50", 125],
  ["boi_india_card", "BOI India Card", "/cards/boi_india_card.svg", "#F8FAFC", "bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800", 126],
  ["boi_visa_gold", "BOI Visa Gold", "/cards/boi_visa_gold.svg", "#D4AF37", "bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50", 127],
  ["boi_rupay_classic", "BOI RuPay Classic", "/cards/boi_rupay_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 128],
  ["boi_sme", "BOI SME Card", "/cards/boi_sme.svg", "#065F46", "bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50", 129],
  // IDBI
  ["idbi_euphoria", "IDBI Euphoria", "/cards/idbi_euphoria.svg", "#6B21A8", "bg-gradient-to-br from-purple-800 to-indigo-950 text-purple-100", 130],
  ["idbi_aspire", "IDBI Aspire", "/cards/idbi_aspire.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 131],
  ["idbi_imperium", "IDBI Imperium", "/cards/idbi_imperium.svg", "#D97706", "bg-gradient-to-br from-amber-600 to-yellow-800 text-amber-50", 132],
  ["idbi_winnings", "IDBI Winnings RuPay Select", "/cards/idbi_winnings.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50", 133],
  ["idbi_lic_signature", "LIC IDBI Signature", "/cards/idbi_lic_signature.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-blue-950 text-yellow-500", 134],
  ["idbi_lic_platinum", "LIC IDBI Platinum", "/cards/idbi_lic_platinum.svg", "#64748B", "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100", 135],
  ["idbi_lic_titanium", "LIC IDBI Titanium", "/cards/idbi_lic_titanium.svg", "#475569", "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-200", 136],
  ["idbi_lic_classic", "LIC IDBI Classic", "/cards/idbi_lic_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 137],
  ["idbi_rupay_select", "IDBI RuPay Select", "/cards/idbi_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50", 138],
  ["idbi_rupay_platinum", "IDBI RuPay Platinum", "/cards/idbi_rupay_platinum.svg", "#334155", "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100", 139],
  // YES
  ["yes_marquee", "YES Marquee", "/cards/yes_marquee.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-yellow-500", 140],
  ["yes_reserv", "YES Reserv", "/cards/yes_reserv.svg", "#D1D5DB", "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900", 141],
  ["yes_first_exclusive", "YES First Exclusive", "/cards/yes_first_exclusive.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200", 142],
  ["yes_first_preferred", "YES First Preferred", "/cards/yes_first_preferred.svg", "#854D0E", "bg-gradient-to-br from-yellow-800 to-yellow-950 text-yellow-100", 143],
  ["yes_premia", "YES Premia", "/cards/yes_premia.svg", "#0D9488", "bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50", 144],
  ["yes_prosperity_rewards_plus", "YES Prosperity Rewards Plus", "/cards/yes_prosperity_rewards_plus.svg", "#166534", "bg-gradient-to-br from-green-700 to-green-900 text-green-50", 145],
  ["yes_prosperity_edge", "YES Prosperity Edge", "/cards/yes_prosperity_edge.svg", "#9F1239", "bg-gradient-to-br from-rose-800 to-rose-950 text-rose-100", 146],
  ["yes_finbooster", "FinBooster YES Bank", "/cards/yes_finbooster.svg", "#EA580C", "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50", 147],
  ["yes_byoc", "YES BYOC", "/cards/yes_byoc.svg", "#171717", "bg-gradient-to-br from-zinc-800 to-black text-cyan-400", 148],
  ["yes_wellness_plus", "YES Wellness Plus", "/cards/yes_wellness_plus.svg", "#BE185D", "bg-gradient-to-br from-pink-700 to-pink-900 text-pink-50", 149],
  // RBL
  ["rbl_icon", "RBL Bank Icon", "/cards/rbl_icon.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100", 150],
  ["rbl_world_safari", "RBL Bank World Safari", "/cards/rbl_world_safari.svg", "#78350F", "bg-gradient-to-br from-amber-800 to-stone-900 text-amber-100", 151],
  ["rbl_platinum_maxima", "RBL Bank Platinum Maxima", "/cards/rbl_platinum_maxima.svg", "#475569", "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100", 152],
  ["bajaj_rbl_platinum", "Bajaj Finserv RBL Platinum", "/cards/bajaj_rbl_platinum.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50", 153],
  ["bajaj_rbl_binge", "Bajaj Finserv RBL Binge", "/cards/bajaj_rbl_binge.svg", "#4F46E5", "bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50", 154],
  ["rbl_shoprite", "RBL Bank ShopRite", "/cards/rbl_shoprite.svg", "#15803D", "bg-gradient-to-br from-green-600 to-green-800 text-green-50", 155],
  ["rbl_play", "RBL Bank Play", "/cards/rbl_play.svg", "#E11D48", "bg-gradient-to-br from-rose-600 to-red-800 text-rose-50", 156],
  ["rbl_lazy_pay", "LazyPay RBL Bank", "/cards/rbl_lazy_pay.svg", "#EAB308", "bg-gradient-to-br from-yellow-500 to-amber-600 text-yellow-50", 157],
  ["rbl_cookies", "RBL Bank Cookies", "/cards/rbl_cookies.svg", "#D97706", "bg-gradient-to-br from-amber-600 to-orange-800 text-amber-50", 158],
  ["rbl_savemax", "RBL Bank SaveMax", "/cards/rbl_savemax.svg", "#0EA5E9", "bg-gradient-to-br from-sky-500 to-cyan-700 text-sky-50", 159],
  // HSBC
  ["hsbc_live_plus", "HSBC Live+", "/cards/hsbc_live_plus.svg", "#06B6D4", "bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50", 160],
  ["hsbc_premier", "HSBC Premier", "/cards/hsbc_premier.svg", "#111827", "bg-gradient-to-br from-gray-800 to-black text-slate-200", 161],
  ["hsbc_star_alliance", "HSBC Star Alliance", "/cards/hsbc_star_alliance.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-slate-100", 162],
  ["hsbc_visa_platinum", "HSBC Visa Platinum", "/cards/hsbc_visa_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 163],
  ["hsbc_smart_value", "HSBC Smart Value", "/cards/hsbc_smart_value.svg", "#DC2626", "bg-gradient-to-br from-red-600 to-red-800 text-red-50", 164],
  ["hsbc_cashback", "HSBC Cashback", "/cards/hsbc_cashback.svg", "#F59E0B", "bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50", 165],
  ["hsbc_premier_metal", "HSBC Premier Metal", "/cards/hsbc_premier_metal.svg", "#374151", "bg-gradient-to-br from-slate-700 to-zinc-900 text-slate-300", 166],
  ["hsbc_corporate", "HSBC Corporate", "/cards/hsbc_corporate.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-slate-900 text-blue-50", 167],
  ["hsbc_taj_epicure", "HSBC Taj Epicure", "/cards/hsbc_taj_epicure.svg", "#A16207", "bg-gradient-to-br from-yellow-700 to-amber-900 text-yellow-50", 168],
  ["hsbc_purchase_plus", "HSBC Purchase Plus", "/cards/hsbc_purchase_plus.svg", "#2563EB", "bg-gradient-to-br from-blue-500 to-blue-800 text-blue-50", 169],
  // AMEX
  ["amex_platinum", "American Express Platinum", "/cards/amex_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900", 170],
  ["amex_gold", "American Express Gold", "/cards/amex_gold.svg", "#D4AF37", "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950", 171],
  ["amex_mrcc", "Amex Membership Rewards (MRCC)", "/cards/amex_mrcc.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100", 172],
  ["amex_smartearn", "Amex SmartEarn", "/cards/amex_smartearn.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-900 text-blue-50", 173],
  ["amex_platinum_travel", "Amex Platinum Travel", "/cards/amex_platinum_travel.svg", "#0EA5E9", "bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50", 174],
  ["amex_platinum_reserve", "Amex Platinum Reserve", "/cards/amex_platinum_reserve.svg", "#334155", "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100", 175],
  ["amex_corporate_green", "Amex Corporate Green", "/cards/amex_corporate_green.svg", "#15803D", "bg-gradient-to-br from-green-600 to-green-800 text-green-50", 176],
  ["amex_corporate_gold", "Amex Corporate Gold", "/cards/amex_corporate_gold.svg", "#F59E0B", "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950", 177],
  ["amex_corporate_platinum", "Amex Corporate Platinum", "/cards/amex_corporate_platinum.svg", "#64748B", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 178],
  ["amex_centurion", "Amex Centurion Black", "/cards/amex_centurion.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-zinc-300", 179],
  // SC
  ["sc_ultimate", "Standard Chartered Ultimate", "/cards/sc_ultimate.svg", "#111827", "bg-gradient-to-br from-black to-zinc-900 text-slate-200", 190],
  ["sc_smart", "Standard Chartered Smart", "/cards/sc_smart.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50", 191],
  ["sc_platinum_rewards", "SC Platinum Rewards", "/cards/sc_platinum_rewards.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100", 192],
  ["sc_super_value_titanium", "SC Super Value Titanium", "/cards/sc_super_value_titanium.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 193],
  ["sc_easemytrip", "EaseMyTrip Standard Chartered", "/cards/sc_easemytrip.svg", "#EA580C", "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50", 194],
  ["sc_manhattan", "Standard Chartered Manhattan", "/cards/sc_manhattan.svg", "#15803D", "bg-gradient-to-br from-green-600 to-green-800 text-green-50", 195],
  ["sc_digismart", "Standard Chartered DigiSmart", "/cards/sc_digismart.svg", "#9333EA", "bg-gradient-to-br from-purple-600 to-purple-800 text-purple-50", 196],
  ["sc_priority_infinite", "SC Priority Visa Infinite", "/cards/sc_priority_infinite.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-blue-950 text-yellow-500", 197],
  ["sc_renown", "Standard Chartered Renown", "/cards/sc_renown.svg", "#7F1D1D", "bg-gradient-to-br from-red-800 to-red-950 text-red-50", 198],
  ["sc_rewards", "Standard Chartered Rewards", "/cards/sc_rewards.svg", "#475569", "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100", 199],
  // AU
  ["au_zenith", "AU Zenith", "/cards/au_zenith.svg", "#000000", "bg-gradient-to-br from-black to-zinc-900 text-yellow-500", 200],
  ["au_zenith_plus", "AU Zenith+", "/cards/au_zenith_plus.svg", "#1F2937", "bg-gradient-to-br from-gray-800 to-black text-slate-300", 201],
  ["au_vetta", "AU Vetta", "/cards/au_vetta.svg", "#312E81", "bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100", 202],
  ["au_altura", "AU Altura", "/cards/au_altura.svg", "#0D9488", "bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50", 203],
  ["au_altura_plus", "AU Altura+", "/cards/au_altura_plus.svg", "#9F1239", "bg-gradient-to-br from-rose-800 to-rose-950 text-rose-50", 204],
  ["au_lit", "AU LIT (Live It Today)", "/cards/au_lit.svg", "#F59E0B", "bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900", 205],
  ["au_ixigo", "ixigo AU Credit Card", "/cards/au_ixigo.svg", "#0284C7", "bg-gradient-to-br from-sky-500 to-sky-700 text-orange-400", 206],
  ["au_swipeup", "AU SwipeUp", "/cards/au_swipeup.svg", "#6D28D9", "bg-gradient-to-br from-violet-600 to-violet-800 text-violet-50", 207],
  ["au_xcite", "AU Xcite", "/cards/au_xcite.svg", "#06B6D4", "bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50", 208],
  ["au_xcite_ultra", "AU Xcite Ultra", "/cards/au_xcite_ultra.svg", "#166534", "bg-gradient-to-br from-green-700 to-green-900 text-green-50", 209],
  // CENTRAL (cbi_*)
  ["cbi_rupay_select", "Central Bank RuPay Select", "/cards/cbi_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50", 210],
  ["cbi_rupay_platinum", "Central Bank RuPay Platinum", "/cards/cbi_rupay_platinum.svg", "#64748B", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 211],
  ["cbi_visa_platinum", "Central Bank Visa Platinum", "/cards/cbi_visa_platinum.svg", "#1E3A8A", "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50", 212],
  ["cbi_visa_gold", "Central Bank Visa Gold", "/cards/cbi_visa_gold.svg", "#D4AF37", "bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50", 213],
  ["cbi_mastercard_titanium", "Central Bank Mastercard Titanium", "/cards/cbi_mastercard_titanium.svg", "#475569", "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100", 214],
  ["cbi_sbi_elite", "Central Bank SBI Card ELITE", "/cards/cbi_sbi_elite.svg", "#111827", "bg-gradient-to-br from-blue-900 to-black text-amber-400", 215],
  ["cbi_sbi_prime", "Central Bank SBI Card PRIME", "/cards/cbi_sbi_prime.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100", 216],
  ["cbi_simplysave_sbi", "CBI SimplySAVE SBI Card", "/cards/cbi_simplysave_sbi.svg", "#B45309", "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50", 217],
  ["cbi_simplyclick_sbi", "CBI SimplyCLICK SBI Card", "/cards/cbi_simplyclick_sbi.svg", "#0284C7", "bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50", 218],
  ["cbi_rupay_classic", "Central Bank RuPay Classic", "/cards/cbi_rupay_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50", 219],
  // UCO
  ["uco_rupay_select", "UCO Bank RuPay Select", "/cards/uco_rupay_select.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100", 220],
  ["uco_rupay_platinum", "UCO Bank RuPay Platinum", "/cards/uco_rupay_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 221],
  ["uco_visa_signature", "UCO Bank Visa Signature", "/cards/uco_visa_signature.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-black text-slate-200", 222],
  ["uco_visa_platinum", "UCO Bank Visa Platinum", "/cards/uco_visa_platinum.svg", "#334155", "bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100", 223],
  ["uco_visa_gold", "UCO Bank Visa Gold", "/cards/uco_visa_gold.svg", "#D97706", "bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50", 224],
  ["uco_sbi_elite", "UCO Bank SBI Card ELITE", "/cards/uco_sbi_elite.svg", "#1E3A8A", "bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400", 225],
  ["uco_sbi_prime", "UCO Bank SBI Card PRIME", "/cards/uco_sbi_prime.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100", 226],
  ["uco_simplysave_sbi", "UCO SimplySAVE SBI Card", "/cards/uco_simplysave_sbi.svg", "#B45309", "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50", 227],
  ["uco_rupay_classic", "UCO Bank RuPay Classic", "/cards/uco_rupay_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 228],
  ["uco_corporate", "UCO Bank Corporate Card", "/cards/uco_corporate.svg", "#065F46", "bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50", 229],
  // INDIAN
  ["indian_rupay_select", "Indian Bank RuPay Select", "/cards/indian_rupay_select.svg", "#0369A1", "bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50", 230],
  ["indian_visa_signature", "Indian Bank Visa Signature", "/cards/indian_visa_signature.svg", "#0F172A", "bg-gradient-to-br from-slate-800 to-black text-slate-200", 231],
  ["indian_mastercard_world", "Indian Bank Mastercard World", "/cards/indian_mastercard_world.svg", "#171717", "bg-gradient-to-br from-zinc-800 to-black text-zinc-300", 232],
  ["indian_rupay_platinum", "Indian Bank RuPay Platinum", "/cards/indian_rupay_platinum.svg", "#64748B", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 233],
  ["indian_visa_platinum", "Indian Bank Visa Platinum", "/cards/indian_visa_platinum.svg", "#1E3A8A", "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50", 234],
  ["indian_visa_gold", "Indian Bank Visa Gold", "/cards/indian_visa_gold.svg", "#D4AF37", "bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50", 235],
  ["indian_mastercard_titanium", "Indian Bank Mastercard Titanium", "/cards/indian_mastercard_titanium.svg", "#475569", "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100", 236],
  ["indian_rupay_classic", "Indian Bank RuPay Classic", "/cards/indian_rupay_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50", 237],
  ["indian_bharat", "Indian Bank Bharat Card", "/cards/indian_bharat.svg", "#EA580C", "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50", 238],
  ["indian_corporate", "Indian Bank Corporate", "/cards/indian_corporate.svg", "#065F46", "bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50", 239],
  // BOM
  ["bom_rupay_select", "Bank of Maharashtra RuPay Select", "/cards/bom_rupay_select.svg", "#1E3A8A", "bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100", 240],
  ["bom_rupay_platinum", "Bank of Maharashtra RuPay Platinum", "/cards/bom_rupay_platinum.svg", "#94A3B8", "bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900", 241],
  ["bom_visa_platinum", "Bank of Maharashtra Visa Platinum", "/cards/bom_visa_platinum.svg", "#334155", "bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100", 242],
  ["bom_visa_gold", "Bank of Maharashtra Visa Gold", "/cards/bom_visa_gold.svg", "#D97706", "bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50", 243],
  ["bom_rupay_classic", "Bank of Maharashtra RuPay Classic", "/cards/bom_rupay_classic.svg", "#2563EB", "bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50", 244],
  ["bom_maha_sbi_elite", "MahaBank SBI Card ELITE", "/cards/bom_maha_sbi_elite.svg", "#111827", "bg-gradient-to-br from-blue-900 to-black text-amber-400", 245],
  ["bom_maha_sbi_prime", "MahaBank SBI Card PRIME", "/cards/bom_maha_sbi_prime.svg", "#1D4ED8", "bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100", 246],
  ["bom_maha_sbi_platinum", "MahaBank SBI Card Platinum", "/cards/bom_maha_sbi_platinum.svg", "#374151", "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300", 247],
  ["bom_simplysave_sbi", "MahaBank SimplySAVE SBI Card", "/cards/bom_simplysave_sbi.svg", "#B45309", "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50", 248],
  ["bom_corporate", "Bank of Maharashtra Corporate", "/cards/bom_corporate.svg", "#047857", "bg-gradient-to-br from-emerald-600 to-teal-900 text-emerald-50", 249],
]

const BANK_PREFIXES = [
  ["indusind", "indusind", "INDUSIND"],
  ["kotak", "kotak", "KOTAK"],
  ["hdfc", "hdfc", "HDFC"],
  ["icici", "icici", "ICICI"],
  ["idfc", "idfc", "IDFC"],
  ["axis", "axis", "AXIS"],
  ["canara", "canara", "CANARA"],
  ["indian", "indian", "INDIAN"],
  ["union", "union", "UNION"],
  ["yes", "yes", "YES"],
  ["bob", "bob", "BOB"],
  ["bom", "bom", "BOM"],
  ["cbi", "central", "CENTRAL"],
  ["uco", "uco", "UCO"],
  ["bajaj", "rbl", "RBL"],
  ["rbl", "rbl", "RBL"],
  ["hsbc", "hsbc", "HSBC"],
  ["amex", "amex", "AMEX"],
  ["sbi", "sbi", "SBI"],
  ["pnb", "pnb", "PNB"],
  ["boi", "boi", "BOI"],
  ["idbi", "idbi", "IDBI"],
  ["au", "au", "AU"],
  ["sc", "sc", "SC"],
]

const APPLY_URL = {
  HDFC: "https://www.hdfc.bank.in/credit-cards",
  ICICI: "https://www.icicibank.com/personal-banking/cards/credit-card",
  SBI: "https://www.sbicard.com/en/personal/credit-cards",
  AXIS: "https://www.axis.bank.in/cards/credit-card",
  KOTAK: "https://www.kotak.com/en/personal-banking/cards/credit-cards.html",
  IDFC: "https://www.idfcfirstbank.com/credit-card",
  INDUSIND: "https://www.indusind.com/in/en/personal/cards/credit-cards.html",
  PNB: "https://www.pnbindia.in/credit-card.html",
  BOB: "https://www.bobfinancial.com/credit-card",
  CANARA: "https://www.canarabank.com/credit-card",
  UNION: "https://www.unionbankofindia.co.in/english/creditcard.aspx",
  BOI: "https://bankofindia.co.in/credit-card",
  IDBI: "https://www.idbibank.in/credit-card.asp",
  YES: "https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards",
  RBL: "https://www.rblbank.com/personal-banking/cards/credit-cards",
  HSBC: "https://www.hsbc.co.in/credit-cards/",
  AMEX: "https://www.americanexpress.com/in/credit-cards/",
  SC: "https://www.sc.com/in/credit-cards/",
  AU: "https://www.aubank.in/personal-banking/credit-cards",
  CENTRAL: "https://www.centralbankofindia.co.in/en/credit-card",
  UCO: "https://www.ucobank.com/credit-card",
  INDIAN: "https://www.indianbank.in/departments/credit-card/",
  BOM: "https://www.bankofmaharashtra.in/credit-card",
}

function resolveBank(slug) {
  for (const [prefix, bankId, bankName] of BANK_PREFIXES) {
    if (slug === prefix || slug.startsWith(`${prefix}_`)) {
      return { bank_id: bankId, bank_name: bankName }
    }
  }
  const head = slug.split("_")[0]
  return { bank_id: head, bank_name: head.toUpperCase() }
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''")
}

const cards = CARD_ROWS.map(([slug, name, image, color, styles, order]) => {
  const bank = resolveBank(slug)
  return {
    card_slug: slug,
    bank_id: bank.bank_id,
    bank_name: bank.bank_name,
    card_name: name,
    card_image_url: image,
    brand_color: color,
    style_classes: styles,
    display_order: order,
    apply_url: APPLY_URL[bank.bank_name] ?? "https://www.google.com/search?q=credit+card+apply",
  }
})

// ── SQL (uuid-safe card_catalog seed) ─────────────────────────────────────────
const valueLines = cards.map(
  (c) =>
    `  ('${sqlEscape(c.bank_name)}', '${sqlEscape(c.card_name)}', '${sqlEscape(c.style_classes)}', '${sqlEscape(c.card_slug)}', '${sqlEscape(c.bank_id)}', '${sqlEscape(c.card_image_url)}')`
)

const sql = `-- AUTO-GENERATED by scripts/generate-card-catalog-master.mjs — do not edit by hand
-- card_slug = app id (e.g. hdfc_millennia); bank_id = bank key (e.g. hdfc)

-- Upsert all live cards (UUID PK: omit card_id; text PK: uses card_slug as card_id)
do $$
declare
  card_id_type text;
begin
  select c.data_type into card_id_type
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'card_catalog' and c.column_name = 'card_id';

  if card_id_type = 'uuid' then
    insert into public.card_catalog (bank_name, card_name, style_classes, card_slug, bank_id, card_image_url, is_active)
    select v.bank_name, v.card_name, v.style_classes, v.card_slug, v.bank_id, v.card_image_url, true
    from (values
${valueLines.join(",\n")}
    ) as v(bank_name, card_name, style_classes, card_slug, bank_id, card_image_url)
    where not exists (select 1 from public.card_catalog c where c.card_slug = v.card_slug);

    update public.card_catalog c set
      bank_name = v.bank_name,
      card_name = v.card_name,
      style_classes = v.style_classes,
      bank_id = v.bank_id,
      card_image_url = v.card_image_url,
      is_active = true
    from (values
${valueLines.join(",\n")}
    ) as v(bank_name, card_name, style_classes, card_slug, bank_id, card_image_url)
    where c.card_slug = v.card_slug;
  else
    insert into public.card_catalog (card_id, bank_name, card_name, style_classes, card_slug, bank_id, card_image_url, is_active)
    select v.card_slug, v.bank_name, v.card_name, v.style_classes, v.card_slug, v.bank_id, v.card_image_url, true
    from (values
${valueLines.join(",\n")}
    ) as v(bank_name, card_name, style_classes, card_slug, bank_id, card_image_url)
    on conflict (card_id) do update set
      bank_name = excluded.bank_name,
      card_name = excluded.card_name,
      style_classes = excluded.style_classes,
      card_slug = excluded.card_slug,
      bank_id = excluded.bank_id,
      card_image_url = excluded.card_image_url,
      is_active = true;
  end if;
end $$;
`

fs.writeFileSync(path.join(ROOT, "supabase", "card_catalog_live_seed.sql"), sql)

// ── Single-run bundle (catalog.sql + master.sql + live_seed.sql) ─────────────
function sectionBanner(name, partFile) {
  return `\n\n-- ═══════════════════════════════════════════════════════════════════════════\n-- ${name}\n-- Source: supabase/${partFile}\n-- ═══════════════════════════════════════════════════════════════════════════\n\n`
}

function stripMasterRunNextHints(masterSql) {
  return masterSql.replace(
    /-- Step 2b: Live product master[^\n]*\n--[^\n]*\n-- Regenerate from scripts\/generate-card-catalog-master\.mjs after edits\.\n\n/g,
    ""
  )
}

const bundleHeader = `-- PoolPay CARD CATALOG — single-run bundle (AUTO-GENERATED)
-- Paste and run this ENTIRE file once in Supabase Dashboard → SQL Editor.
-- Regenerate: node scripts/generate-card-catalog-master.mjs
--
-- Combines (in order):
--   1. supabase/card_catalog.sql         — base table + legacy seed
--   2. supabase/card_catalog_master.sql  — card_banks, columns, view
--   3. supabase/card_catalog_live_seed.sql — ${cards.length} live cards upsert
--
-- Recommended prerequisite (run separately if needed): supabase/profiles.sql

`

const bundleParts = [
  { name: "PART 1/3 — Base card_catalog table", file: "card_catalog.sql" },
  { name: "PART 2/3 — Banks master + card_catalog_master view", file: "card_catalog_master.sql" },
  { name: `PART 3/3 — Live seed (${cards.length} cards)`, file: "card_catalog_live_seed.sql" },
]

let bundleSql = bundleHeader
for (const part of bundleParts) {
  let content = fs.readFileSync(path.join(ROOT, "supabase", part.file), "utf8")
  if (part.file === "card_catalog_master.sql") {
    content = stripMasterRunNextHints(content)
  }
  bundleSql += sectionBanner(part.name, part.file) + content
}

bundleSql += `
-- ── Verify (optional) ─────────────────────────────────────────────────────────
select count(*) as bank_count from public.card_banks;
select count(*) as active_cards from public.card_catalog where is_active = true;
select card_slug, bank_name, card_name from public.card_catalog_master limit 10;
`

fs.writeFileSync(path.join(ROOT, "supabase", "card_catalog_full_setup.sql"), bundleSql)

// ── TypeScript catalog ────────────────────────────────────────────────────────
const ts = `/** AUTO-GENERATED — run: node scripts/generate-card-catalog-master.mjs */
import { BANK_REGISTRY } from "@/lib/bank-registry"
import { resolveCardImageUrl } from "@/lib/card-photo-registry"

// card_image_url in RAW is SVG art path; resolveCardImageUrl swaps in /images/cards photos when present.

export type CatalogCard = {
  card_id: string
  bank_id: string
  bank_name: string
  bank_logo_url?: string
  card_name: string
  card_image_url?: string
  style_classes: string
  apply_url: string
}

const logo = (bankId: string) =>
  BANK_REGISTRY.find((b) => b.bank_id === bankId)?.logo_url ?? "clearbit.com"

const RAW: Omit<CatalogCard, "bank_logo_url">[] = [
${cards
  .map(
    (c) => `  {
    card_id: "${c.card_slug}",
    bank_id: "${c.bank_id}",
    bank_name: "${c.bank_name}",
    card_name: ${JSON.stringify(c.card_name)},
    card_image_url: "${c.card_image_url}",
    style_classes: ${JSON.stringify(c.style_classes)},
    apply_url: "${c.apply_url}",
  },`
  )
  .join("\n")}
]

export const CARD_CATALOG: CatalogCard[] = RAW.map((card) => ({
  ...card,
  bank_logo_url: logo(card.bank_id),
  card_image_url: resolveCardImageUrl(card.card_id, card.card_image_url) ?? card.card_image_url,
}))

export function getCatalogCard(cardId: string): CatalogCard | undefined {
  return CARD_CATALOG.find((c) => c.card_id === cardId)
}
`

fs.writeFileSync(path.join(ROOT, "lib", "card-catalog.generated.ts"), ts)

// Legacy aliases for photo filenames
const legacyAliases = {
  hdfc_millennia: ["hdfc_millenia"],
  hdfc_regalia_gold: ["hdfc_regelia", "hdfc_regalia"],
  hdfc_indianoil: ["hdfc_iocl"],
  icici_amazon_pay: ["icici_amazon"],
  sbi_simplysave: ["sbi_cashback"],
  axis_my_zone: ["axis_flipkart"],
  axis_vistara_infinite: ["axis_vistara"],
}

console.log(
  `Generated ${cards.length} cards → supabase/card_catalog_live_seed.sql, supabase/card_catalog_full_setup.sql, lib/card-catalog.generated.ts`
)
console.log("Legacy photo aliases still in card-photo-registry:", Object.keys(legacyAliases).join(", "))
