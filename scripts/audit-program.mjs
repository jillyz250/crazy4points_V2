#!/usr/bin/env node
/**
 * audit-program.mjs — Editorial audit for a program row
 *
 * Pulls one or more programs from Supabase and runs banned-words +
 * card-AF + stale-claim regexes across every text field. Prints a
 * report so you don't have to spot-read the page yourself.
 *
 * USAGE:
 *   node scripts/audit-program.mjs --program=<slug>
 *   node scripts/audit-program.mjs --all
 *   node scripts/audit-program.mjs --all --strict   # opt-in broad sweeps
 *
 * EXIT CODE:
 *   0 = no findings, 1 = findings present
 *
 * NOISE-FLOOR EXPECTATION (after three regex-tuning passes 2026-05-04):
 * Default rules produce ~3-5 findings per authored program — most of which
 * are false positives by design (regex can't tell "free hot breakfast"
 * from "redeem your free flight"). Treat findings as a TRIAGE STARTING
 * POINT, not a fix-list. A typical pass requires:
 *   - 70% classified as FP (perks, factual past dates, hedged phrases,
 *     award names, industry-standard guarantees)
 *   - 30% real fixes (unhedged absolute claims, stale year refs)
 *
 * Three programs (hawaiian, alaska, air_france) currently hit zero
 * findings — proof the rules aren't impossibly strict.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

function parseArgs() {
  const args = { program: null, all: false }
  for (const a of process.argv.slice(2)) {
    if (a === '--all') args.all = true
    else if (a.startsWith('--program=')) args.program = a.slice('--program='.length)
  }
  if (!args.program && !args.all) {
    console.error('Usage: audit-program.mjs --program=<slug> | --all')
    process.exit(1)
  }
  return args
}

async function sb(path) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// Each rule: a regex (case-insensitive, word-bounded where appropriate)
// and a one-line explanation of why it's flagged.
//
// Tuning history (2026-05-04 follow-up): "absolute_only" and "absolute_first"
// were producing mostly-false-positive matches on legit descriptive context
// ("only two tiers", "First class lounge"). Tightened to flag only the
// specifically-comparative usage. Run with --strict to re-enable broad sweeps.
const BANNED_DEFAULT = [
  { name: 'absolute_never', re: /\bnever\b/gi, why: '"Never" is too absolute - programs change. Hedge with "do not under current rules".' },
  { name: 'absolute_always', re: /\balways\b/gi, why: '"Always" is too absolute. Use "typically" or "as of [Month YYYY]".' },
  { name: 'absolute_guaranteed', re: /\bguaranteed\b/gi, why: '"Guaranteed" implies certainty rare in points/miles.' },
  // Only flag "first" when it's a comparative claim about programs/currencies/airlines
  { name: 'comparative_first', re: /\bfirst\s+(program|currency|airline|loyalty|transferable|major|US|to\s+(launch|offer|introduce))/gi, why: 'Comparative-first claim - drift-prone. Hedge with "among the first" or remove.' },
  // Only flag "only" when it's a comparative claim
  { name: 'comparative_only', re: /\b(the\s+only|only\s+(program|currency|airline|loyalty|major|US))\b/gi, why: 'Comparative-only claim - usually wrong or drift-prone.' },
  { name: 'absolute_best', re: /\b(the\s+best|world's?\s+best)\b/gi, why: '"The best" is comparative + opinion. Use "strong" or "among the strongest".' },
  // "instant" only flags when NOT preceded by hedging words. Negative-lookbehind kills false positives like "near-instant", "(usually) instant", "typically near-instant", "not instant".
  { name: 'instant_word', re: /(?<!near-|near\s|not\s|usually\s|usually\)\s|typically\s|almost\s|nearly\s)\binstant\b/gi, why: '"Instant" is rarely literally true. Use "usually near-instant".' },
  { name: 'free_word', re: /\bfree\b(?!\s+(night|companion|stopover|cancellation|of\s+charge|change|tier|economy|breakfast|wi-?fi|fly-?fi|seat|seatback|checked|bag|baggage|parking|membership|on\s+change|Starlink|access|preferred|standard|trial|hotel|drinks|drink|with|for|Extra|Legroom|same-day|day-of|Admirals|in-flight|hot|first|second|signup|intra|snacks|upgrade|to|72h))/gi, why: '"Free" is misleading for points/miles. Use "no fee".' },
  // Fuel surcharges flag only when claim is unhedged. Skip "low/no", "low or no", "minimal", "virtually no", "near-zero".
  { name: 'no_fuel_surcharges', re: /(?<!low\/|low or |minimal |virtually |near-zero )no fuel surcharges?/gi, why: 'Fuel surcharges are program-conditional. State the actual range.' },
  { name: 'card_annual_fee', re: /\$\d{2,4}\s*(?:annual\s*fee|AF\b)/gi, why: 'Card annual fees do not belong on program pages - see feedback_no_card_af_on_program_pages.md.' },
  // Year flags only when NOT in historical-date context. Skip when preceded by "since", "in", "joined", "effective", "until", "from", "as of", "before", "after", "ed in", "starting".
  { name: 'recent_year_2024', re: /(?<!since |in |joined |effective |until |from |as of |before |after |ed in |starting |closed |ended |\(|: |, |Effective )\b2024\b/g, why: '2024 references may be stale; check the date is still relevant.' },
  { name: 'recent_month_with_year', re: /(?<!since |in |joined |effective |until |from |as of |before |after |ed in |starting |closed |ended |\(|: |, |Effective |opened |began |granted |completed |relaunched |refreshed |launched |added |open since |open mid-|open early |open late |open Q[1-4] |operations |on |through )\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+202[345]\b/gi, why: 'Time-stamped event references decay; verify still accurate.' },
]

const BANNED_STRICT_EXTRA = [
  { name: 'absolute_only', re: /\bonly\b/gi, why: 'STRICT: any "only" - review for absolute claims.' },
  { name: 'absolute_first', re: /\bfirst\b(?!\s+(class|cabin|name|segment|leg|of|priority|inventory|opens|and))/gi, why: 'STRICT: any "first" except known cabin/lounge contexts.' },
  { name: 'absolute_best_loose', re: /\bbest\b/gi, why: 'STRICT: any "best" - review for comparative claims.' },
]

const BANNED = process.argv.includes('--strict')
  ? [...BANNED_DEFAULT, ...BANNED_STRICT_EXTRA]
  : BANNED_DEFAULT

const FIELDS = ['intro', 'how_to_spend', 'sweet_spots', 'quirks', 'lounge_access', 'award_chart']

function scanField(value, fieldName) {
  if (!value || typeof value !== 'string') return []
  const findings = []
  for (const rule of BANNED) {
    const matches = [...value.matchAll(rule.re)]
    if (matches.length) {
      findings.push({
        rule: rule.name,
        field: fieldName,
        count: matches.length,
        snippets: matches.slice(0, 2).map((m) => {
          const start = Math.max(0, m.index - 30)
          const end = Math.min(value.length, m.index + m[0].length + 30)
          return '...' + value.slice(start, end).replace(/\n/g, ' ') + '...'
        }),
        why: rule.why,
      })
    }
  }
  return findings
}

function scanProgram(p) {
  const findings = []
  for (const f of FIELDS) findings.push(...scanField(p[f], f))
  // JSONB fields: stringify and scan
  for (const f of ['transfer_partners', 'tier_benefits', 'member_programs']) {
    if (p[f]) findings.push(...scanField(JSON.stringify(p[f]), `${f} (JSONB)`))
  }
  return findings
}

async function main() {
  loadEnv()
  const args = parseArgs()
  const filter = args.program
    ? `slug=eq.${args.program}`
    : 'select=slug,type,intro,how_to_spend,sweet_spots,quirks,lounge_access,award_chart,transfer_partners,tier_benefits,member_programs&intro=not.is.null'
  const path = args.program ? `programs?${filter}&select=*` : `programs?${filter}`
  const programs = await sb(path)

  if (!programs.length) {
    console.error('No programs matched.')
    process.exit(1)
  }

  let totalFindings = 0
  for (const p of programs) {
    const findings = scanProgram(p)
    if (!findings.length) {
      console.log(`[${p.slug}] CLEAN`)
      continue
    }
    totalFindings += findings.length
    console.log(`\n[${p.slug}] ${findings.length} finding(s):`)
    for (const f of findings) {
      console.log(`  - ${f.rule} x${f.count} in ${f.field}`)
      console.log(`    why: ${f.why}`)
      for (const s of f.snippets) console.log(`    "${s}"`)
    }
  }

  console.log(`\n[audit] Done. ${programs.length} program(s) scanned, ${totalFindings} total finding(s).`)
  process.exit(totalFindings > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`[audit] ${err.message}`)
  process.exit(1)
})
