#!/usr/bin/env node
/**
 * Greps every program page's content fields for known-wrong claim patterns
 * we've caught (or had to revert) at least once. Each pattern is a real
 * error we've made or seen propagated from aggregator data.
 *
 * Usage:
 *   node scripts/error-pattern-check.mjs                # check all programs
 *   node scripts/error-pattern-check.mjs --slug=delta   # one program
 *
 * Exit code 1 if any error pattern matches; 0 if clean.
 *
 * Add a pattern when you catch a new wrong claim, so we never regress.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wjnnauchhbxwehowfusw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY env var')
  process.exit(2)
}

// Each pattern: a regex + a "near" regex (must match within +/- 200 chars) +
// a human description. The "near" disambiguates: "US Bank" alone is fine in
// a sentence about US Bank Altitude Reserve being NOT a partner.
const PATTERNS = [
  {
    id: 'us-bank-altitude-as-avios-partner',
    pattern: /us bank altitude reserve/i,
    near: /(transfer|partner)\s*(?:to|with)?\s*(?:avios|virgin atlantic|british airways|iberia|qatar|aer lingus|finnair|loganair|jetblue)/i,
    notNear: /\b(not|never|no|isn't|aren't|don't|doesn't|never launched)\b/i,
    message: 'US Bank Altitude Reserve listed as a transfer partner. As of May 2026, US Bank announced transfer partners but never actually launched any. Mark as not a partner.',
  },
  {
    id: 'bofa-premium-as-transfer-partner',
    pattern: /bank of america premium rewards/i,
    near: /(transfer|partner)\s*(?:to|with)?/i,
    notNear: /\b(not|never|no|isn't|aren't|don't|doesn't|never been|neither|aggregators|do not rely|incorrect|error)\b/i,
    message: 'Bank of America Premium Rewards listed as a transfer partner. BofA has never offered transferable points - this is an aggregator data error.',
  },
  {
    id: 'citi-direct-to-iberia',
    pattern: /citi\s*(?:thankyou|typ)?[^.]{0,100}(?:transfer|→|to)\s*iberia/i,
    notNear: /\b(does not|doesn't|not direct|via qatar|indirect|indirectly)\b/i,
    message: 'Citi ThankYou listed as direct transfer to Iberia. Citi only transfers to Qatar Privilege Club within the Avios family; Iberia is reachable indirectly via Combine My Avios.',
  },
  {
    id: 'southwest-closed-ecosystem',
    pattern: /southwest[^.]{0,200}(?:closed ecosystem|no flexible.{0,30}transfer|chase\s+(?:ultimate rewards|ur)\s+does\s+not\s+transfer)/i,
    message: 'Southwest framed as closed ecosystem / Chase UR not transferring. WRONG: Chase UR transfers 1:1 to Southwest Rapid Rewards (transferred points just don\'t count toward Companion Pass / Tier-Qualifying Points).',
  },
  {
    id: 'us-carrier-non-us-airline',
    pattern: /\b(?:the only|only)\s+US\s+(?:carrier|airline)/i,
    notNear: /\b(Pacific island|Guam|Hawaii|territory|hub)\b/i,
    message: '"The only US carrier" / "only US airline" is risky phrasing. Verify the airline being described is actually US-domiciled. Singapore Airlines, Qatar, ANA, etc. are NOT US carriers - the program may be accessible to US travelers but the carrier itself is foreign.',
  },
  {
    id: 'hawaiianmiles-still-active',
    pattern: /\bhawaiianmiles\b/i,
    notNear: /\b(ceased|ended|absorbed|discontinued|former|legacy|historical|before October|prior to|deactivated|no longer|merged|became|replaced|into Atmos|took over|transitioned|folded|conversion|MileagePlan and HawaiianMiles|both)\b/i,
    message: 'HawaiianMiles referenced without legacy/discontinued framing. HawaiianMiles ceased October 1, 2025 - all balances transferred to Atmos Rewards 1:1.',
  },
  {
    id: 'jetblue-jal-partnership',
    pattern: /jetblue[^.]{0,80}(?:partner|earn|redeem)[^.]{0,80}(?:jal|japan airlines|mileage bank)/i,
    notNear: /\b(ended|terminated|expired|former|legacy|until)\b/i,
    message: 'JetBlue / JAL partnership referenced. ENDED March 31, 2026.',
  },
  {
    id: 'jetblue-hawaiian-partnership',
    pattern: /jetblue[^.]{0,80}(?:partner|earn|redeem)[^.]{0,80}hawaiian/i,
    notNear: /\b(ended|terminated|former|legacy|2025)\b/i,
    message: 'JetBlue / Hawaiian Airlines partnership referenced. ENDED 2025.',
  },
  {
    id: 'jetblue-tap-partnership',
    pattern: /jetblue[^.]{0,80}(?:partner|earn|redeem)[^.]{0,80}(?:tap|tap air portugal)/i,
    notNear: /\b(ended|terminated|former|legacy|2025)\b/i,
    message: 'JetBlue / TAP partnership referenced. ENDED 2025.',
  },
  {
    id: 'sas-in-star-alliance',
    pattern: /\bsas\b[^.]{0,60}(?:star alliance|star)/i,
    notNear: /\b(former|until|left|moved to skyteam|joined skyteam|2024)\b/i,
    message: 'SAS as a Star Alliance member. SAS moved to SkyTeam in 2024.',
  },
  {
    id: 'amex-cathay-1-to-1',
    pattern: /amex[^.]{0,60}(?:cathay|asia miles)[^.]{0,60}(?:1:1|1\s*[:×]\s*1)/i,
    notNear: /\b(was|former|previously|before march|prior to|reduced)\b/i,
    message: 'Amex MR to Cathay Asia Miles claimed at 1:1. Reduced to 5:4 on March 1, 2026. Update if not already.',
  },
  {
    id: 'cathay-published-chart',
    pattern: /cathay[^.]{0,80}(?:published|publishes)[^.]{0,40}(?:full|complete|fixed)\s*(?:award\s*)?chart/i,
    notNear: /\b(no longer|removed|discontinued|until april 2025|community-?reverse)\b/i,
    message: 'Cathay claimed to publish a full award chart. Cathay removed most published charts in April 2025; community has been reverse-engineering.',
  },
  {
    id: 'capital-one-jetblue-defunct',
    pattern: /capital\s*one[^.]{0,80}(?:does not transfer|doesn't transfer|not.{0,20}partner)[^.]{0,80}jetblue/i,
    message: 'Capital One claimed to NOT transfer to JetBlue. RESTORED February 18, 2026 at 5:3 ratio.',
  },
  {
    id: 'specific-card-annual-fee-on-program-page',
    pattern: /\$\s*\d{2,3}\s*(?:annual\s*fee|af)\b/i,
    notNear: /\b(membership|subscription|plus|paid membership)\b/i,
    message: 'Specific card annual fee mentioned on program page. Per project rule (feedback_no_card_af_on_program_pages), AFs belong on dedicated card pages, not program pages. (Paid memberships like Avelo PLUS are different.)',
  },
  {
    id: 'spirit-airlines-active',
    pattern: /spirit\s*(?:airlines|free spirit)/i,
    notNear: /\b(defunct|ceased|closed|out of business|chapter 11|2026|relief|former)\b/i,
    message: 'Spirit Airlines referenced as active. Spirit ceased operations week of May 5, 2026 post-Chapter 11.',
  },
  {
    pattern: /capital\s*one[^.]{0,120}(?:transfer|→|to|partner)[^.]{0,40}aer\s*lingus/i,
    notNear: /\b(does not|doesn't|not direct|not a partner|cannot|via BA|indirect|indirectly|combine my avios|second hop)\b/i,
    message: 'Capital One -> Aer Lingus AerClub claimed as direct. Verified May 2026 via Capital One official transfer-partner page (18-airline list): Aer Lingus is NOT a direct Cap One partner. Cap One transfers to BA Avios; AerClub reachable only via Combine My Avios second hop.',
  },
  {
    pattern: /citi[^.]{0,120}(?:transfer|→|to|partner)[^.]{0,40}aer\s*lingus/i,
    notNear: /\b(does not|doesn't|not direct|not a partner|cannot|via BA|indirect|indirectly|combine my avios|second hop)\b/i,
    message: 'Citi ThankYou -> Aer Lingus AerClub claimed as direct. AerClub is NOT a direct Citi partner. Same Avios-family conflation pattern as Cap One.',
  },
  {
    pattern: /\b(?:transfers?|partners?)\s+(?:to|with)\s+avios\b/i,
    notNear: /\b(specifically|via BA|British Airways|Iberia Plus|Aer Lingus AerClub|Finnair Plus|Qatar Privilege|Vueling|Loganair|Combine My Avios|second hop|direct)\b/i,
    message: 'Generic "transfers to Avios" claim without specifying which Avios program. Avios is shared across BA / Iberia / Aer Lingus / Vueling / Finnair / Qatar / Loganair, but each has its OWN direct-transfer-partner roster. Always specify the program (usually BA Avios is the direct partner; others are reachable only via Combine My Avios).',
  },
]

async function fetchPrograms(slug = null) {
  const filter = slug ? `&slug=eq.${slug}` : ''
  const url = `${SUPABASE_URL}/rest/v1/programs?select=slug,name,intro,how_to_spend,sweet_spots,tier_benefits,lounge_access,quirks,award_chart,transfer_partners&intro=neq.&order=slug${filter}`
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${await r.text()}`)
  return r.json()
}

function checkContent(program) {
  const fields = ['intro', 'how_to_spend', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart']
  const findings = []
  for (const field of fields) {
    const text = program[field] || ''
    if (!text) continue
    for (const p of PATTERNS) {
      const matches = [...text.matchAll(new RegExp(p.pattern.source, p.pattern.flags + 'g'))]
      for (const m of matches) {
        const idx = m.index
        const window = text.slice(Math.max(0, idx - 200), Math.min(text.length, idx + 200))
        if (p.near && !p.near.test(window)) continue
        if (p.notNear && p.notNear.test(window)) continue
        findings.push({
          program: program.slug,
          field,
          pattern_id: p.id,
          message: p.message,
          snippet: text.slice(Math.max(0, idx - 60), Math.min(text.length, idx + 100)).replace(/\s+/g, ' ').trim(),
        })
      }
    }
  }
  return findings
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }))
  const programs = await fetchPrograms(args.slug)
  let totalFindings = 0
  for (const program of programs) {
    const findings = checkContent(program)
    if (findings.length === 0) continue
    totalFindings += findings.length
    console.log(`\n## ${program.slug} (${program.name})`)
    for (const f of findings) {
      console.log(`  [${f.pattern_id}] ${f.field}: ${f.message}`)
      console.log(`      "${f.snippet}"`)
    }
  }
  console.log(`\n${totalFindings === 0 ? '✅' : '❌'} ${totalFindings} error-pattern finding(s) across ${programs.length} program(s)`)
  process.exit(totalFindings === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
