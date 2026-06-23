#!/usr/bin/env node
/**
 * Fix the 14-flag weekly good_to_know accuracy audit (2026-06-23).
 * Most flags are STALE PROSE left behind when welcome-bonus DATA was updated
 * earlier this session; a few are benefit-drift (CSP $50->$100 hotel credit +
 * 10% anniversary bonus eliminated, Venture X AU lounge now paid, WF Choice
 * Select 20 ENC, Delta Gold first-bag-only). Four audit flags were verified as
 * FALSE POSITIVES and intentionally skipped (see bottom).
 *
 * Each fix is an exact-substring replace; the script asserts the old text was
 * present (so a silent no-op fails loudly) and writes the new text back.
 *
 * Run: set -a; . ./.env.local; set +a; node scripts/fix-gtk-audit-2026-06-23.mjs
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// slug -> array of [oldText, newText] replacements
const FIXES = {
  'chase-united-explorer': [[
    "The 70,000-mile welcome bonus requires $3,000 in 3 months - that's $1,000/month, which is an approachable ask at this fee level, and the extra 10,000 miles for adding an authorized user in that same window is essentially free if you were planning to add one anyway, so don't sleep on it.",
    "The 60,000-mile welcome bonus is 50,000 miles after $3,000 in 3 months - that's $1,000/month, an approachable ask at this fee level - plus an extra 10,000 miles for adding an authorized user in that same window, which is essentially free if you were planning to add one anyway, so don't sleep on it.",
  ]],
  'united-quest': [[
    "The welcome bonus is 90,000 miles PLUS 3,000 Premier qualifying points (PQP) after $4,000 in 3 months - the PQP matters more than it looks, since it jump-starts United Premier status, not just your mileage balance.",
    "The welcome bonus is 60,000 miles plus 500 Premier qualifying points (PQP) after $4,000 in 3 months, plus another 10,000 miles for adding an authorized user in that same window - the PQP matters more than it looks, since it jump-starts United Premier status, not just your mileage balance.",
  ]],
  'united-club-infinite': [[
    "The 100,000-mile welcome bonus requires $5,000 in 3 months - that's roughly $1,667/month, which is a real spend commitment at any fee level, so map out your first three months before you apply rather than assuming it'll happen organically, and don't forget the 10,000 bonus miles for adding an authorized user in that same window - that part costs you nothing if you were planning to add one anyway.",
    "The 90,000-mile welcome bonus is 80,000 miles after $5,000 in 3 months - that's roughly $1,667/month, a real spend commitment at any fee level, so map out your first three months before you apply rather than assuming it'll happen organically, and don't forget the 10,000 bonus miles for adding an authorized user in that same window - that part costs you nothing if you were planning to add one anyway.",
  ]],
  'chase-marriott-bonvoy-boundless': [[
    "The 3 Free Night Awards welcome bonus requires $3,000 in 3 months - that's $1,000/month, which is one of the more manageable spend targets you'll find on a $95 card, and three free nights is a genuinely strong opening offer if Marriott is already where you sleep when you travel.",
    "The 125,000-point welcome bonus requires $3,000 in 3 months - that's $1,000/month, one of the more manageable spend targets you'll find on a $95 card, and 125,000 Bonvoy points is a genuinely strong opening offer if Marriott is already where you sleep when you travel.",
  ]],
  'chase-aeroplan': [[
    "The 75,000-point welcome bonus (after $4,000 in 3 months) is a reasonable hurdle for a $95 card",
    "The 60,000-point welcome bonus (after $3,000 in 3 months) is a reasonable hurdle for a $95 card",
  ]],
  'chase-sapphire-preferred': [
    [
      "The 75,000-point welcome bonus requires $5,000 in 3 months",
      "The 100,000-point welcome bonus requires $5,000 in 3 months",
    ],
    [
      "The $50 Annual Chase Travel Hotel Credit",
      "The $100 Annual Chase Travel Hotel Credit",
    ],
    [
      "\n- The 10% anniversary points bonus is real but modest - if you put $25,000 on the card in a year, that's 2,500 bonus points, which is a nice footnote but not a reason to concentrate spend here over a higher-earning category card, so treat it as a quiet annual thank-you rather than a core part of the math.",
      "",
    ],
  ],
  'barclays-wyndham-rewards-earner-business': [[
    "- The 45,000-point welcome bonus has a catch: you must spend $3,000 AND pay the $95 annual fee in full, both within 90 days - two SEPARATE requirements, and the fee does not count toward the ,000 spend.",
    "- The welcome bonus is 45,000 points after $3,000 in the first 90 days, plus another 55,000 points after $500 in Hotels by Wyndham purchases within 180 days - 100,000 points total if you hit both, a strong opening for a $95 card.",
  ]],
  'amex-delta-gold': [[
    "Free first AND second checked bag covers everyone on the reservation (up to 8).",
    "Free first checked bag for you and up to 8 companions on the same reservation, on Delta domestic flights.",
  ]],
  'capital-one-venture-x': [[
    "Authorized users are free and get their own lounge access.",
    "Authorized users can be added, but as of February 1, 2026 they no longer get complimentary lounge access - it's $125 per authorized user (up to four) for Capital One Lounge and Priority Pass access.",
  ]],
  'wells-fargo-choice-privileges-select': [[
    "Automatic Platinum Elite status plus 10 Elite Night Credits make it a no-brainer for frequent Choice guests.",
    "Automatic Platinum Elite status plus 20 Elite Night Credits make it a no-brainer for frequent Choice guests.",
  ]],
}

let failures = 0
for (const [slug, repls] of Object.entries(FIXES)) {
  const { data, error } = await sb.from('credit_cards').select('id, good_to_know').eq('slug', slug).single()
  if (error || !data) { console.log(`FAIL  ${slug}: fetch error ${error?.message}`); failures++; continue }
  let text = data.good_to_know || ''
  let ok = true
  for (const [oldT, newT] of repls) {
    if (!text.includes(oldT)) { console.log(`FAIL  ${slug}: old text not found -> "${oldT.slice(0, 60)}..."`); ok = false; failures++; continue }
    text = text.replace(oldT, newT)
  }
  if (!ok) continue
  const { error: uerr } = await sb.from('credit_cards').update({ good_to_know: text }).eq('id', data.id)
  if (uerr) { console.log(`FAIL  ${slug}: update error ${uerr.message}`); failures++; continue }
  console.log(`OK    ${slug} (${repls.length} replacement${repls.length > 1 ? 's' : ''})`)
}

console.log(`\nSkipped as verified FALSE POSITIVES: amex-delta-gold-business ($0-first-year waiver still live), amex-marriott-bonvoy-business (Marriott Platinum = 50 nights, 30% correct), citi-aadvantage-executive ($360 already excludes the GE credit), chase-british-airways-visa-signature (Avios cross-program pooling is accurate).`)
console.log(failures ? `\n${failures} failure(s) - NOT all fixes applied.` : `\nAll fixes applied cleanly.`)
process.exit(failures ? 1 : 0)
