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
 *
 * EXIT CODE:
 *   0 = no findings (clean), 1 = findings present
 *
 * The rules below mirror the manual review checklist from the
 * 11-page bulk audit done 2026-05-04. Add new rules in BANNED.
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
const BANNED = [
  { name: 'absolute_never', re: /\bnever\b/gi, why: '"Never" is too absolute — programs change. Hedge with "do not under current rules".' },
  { name: 'absolute_always', re: /\balways\b/gi, why: '"Always" is too absolute. Use "typically" or "as of [Month YYYY]".' },
  { name: 'absolute_guaranteed', re: /\bguaranteed\b/gi, why: '"Guaranteed" implies certainty rare in points/miles.' },
  { name: 'absolute_only', re: /\bonly\b/gi, why: '"Only" is a comparative claim; usually wrong or hedgeable.' },
  { name: 'absolute_first', re: /\bfirst\b(?!\s+(class|cabin|name|segment|leg|of|priority|inventory|opens))/gi, why: '"First [program/airline/etc.]" is comparative + drift-prone.' },
  { name: 'absolute_best', re: /\bbest\b/gi, why: '"Best" is comparative + opinion. Use "strong" or "among the strongest".' },
  { name: 'instant_word', re: /\binstant\b/gi, why: '"Instant" is rarely literally true. Use "usually near-instant".' },
  { name: 'free_word', re: /\bfree\b(?!\s+night|\s+companion|\s+stopover)/gi, why: '"Free" is misleading for points/miles. Use "no fee".' },
  { name: 'no_fuel_surcharges', re: /no fuel surcharges?/gi, why: 'Fuel surcharges are program-conditional. State the actual range.' },
  { name: 'card_annual_fee', re: /\$\d{2,4}\s*(?:annual\s*fee|AF\b)/gi, why: 'Card annual fees do not belong on program pages — see feedback_no_card_af_on_program_pages.md.' },
  { name: 'recent_year_2024', re: /\b2024\b/g, why: '2024 references are stale; check the date is still relevant or update to current.' },
  { name: 'recent_month_with_year', re: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+202[345]\b/gi, why: 'Time-stamped event references decay; verify still accurate.' },
]

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
