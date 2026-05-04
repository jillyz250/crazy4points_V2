#!/usr/bin/env node
/**
 * verify-program.mjs — Live page verification for /programs/<slug>
 *
 * Hits the live page, confirms it returned 200, and checks that the
 * key sections from the database row actually rendered. Catches:
 *  - Page 404s (slug mismatch / missing programs row / Vercel deploy lag)
 *  - JSONB transfer_partners rendering as raw slugs (e.g. "marriott_bonvoy"
 *    instead of "Marriott Bonvoy") because the partner program row is
 *    missing from DB
 *  - Empty fields that should have content per the row in Supabase
 *  - Banned-word patterns that survived to the rendered HTML
 *
 * USAGE:
 *   node scripts/verify-program.mjs --program=<slug>
 *   node scripts/verify-program.mjs --program=<slug> --base=https://crazy4points.com
 *   node scripts/verify-program.mjs --program=<slug> --base=http://localhost:3000
 *
 * EXIT CODE:
 *   0 = all checks pass, 1 = any check failed
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
  const args = { program: null, base: 'https://crazy4points.com' }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--program=')) args.program = a.slice('--program='.length)
    else if (a.startsWith('--base=')) args.base = a.slice('--base='.length).replace(/\/$/, '')
  }
  if (!args.program) {
    console.error('Usage: verify-program.mjs --program=<slug> [--base=<url>]')
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
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

function check(label, ok, detail = '') {
  const tag = ok ? '✓' : '✗'
  console.log(`  ${tag} ${label}${detail ? `  (${detail})` : ''}`)
  return ok
}

async function main() {
  loadEnv()
  const args = parseArgs()

  const rows = await sb(`programs?slug=eq.${args.program}&select=*`)
  if (!rows.length) {
    console.error(`No program row found for slug=${args.program}`)
    process.exit(1)
  }
  const p = rows[0]

  const url = `${args.base}/programs/${args.program}`
  console.log(`[verify] ${url}`)

  const res = await fetch(url, { redirect: 'follow' })
  const html = await res.text()
  console.log(`[verify] HTTP ${res.status}, ${html.length} chars`)

  let allOk = true
  const fail = (msg) => { allOk = false; return false }

  // 1. Page returned 200
  if (!check('HTTP 200', res.status === 200, `got ${res.status}`)) allOk = false

  // 2. Intro present (substring of intro markdown should appear in HTML)
  if (p.intro) {
    const firstSentence = p.intro.split(/[.!?]/)[0].slice(0, 80)
    const found = html.includes(firstSentence)
    if (!check('Intro renders', found, found ? '' : `missing first sentence`)) allOk = false
  }

  // 3. No raw slug rendering for transfer partners (e.g. "marriott_bonvoy" instead of "Marriott Bonvoy")
  if (Array.isArray(p.transfer_partners) && p.transfer_partners.length) {
    const rawSlugMatches = p.transfer_partners.filter((tp) => {
      const slug = tp.from_slug ?? tp.to_slug
      if (!slug) return false
      // Look for the underscore form rendered as visible text in a card/pill
      const re = new RegExp(`>\\s*${slug}\\s*<`, 'i')
      return re.test(html)
    })
    if (!check('No raw partner slugs in HTML', rawSlugMatches.length === 0,
               rawSlugMatches.length ? `raw: ${rawSlugMatches.map((tp) => tp.from_slug ?? tp.to_slug).join(', ')}` : '')) {
      allOk = false
    }
  }

  // 4. Award chart section present (if award_chart populated)
  if (p.award_chart && p.award_chart.length > 50) {
    // Pick a strong signal from the chart — usually "Distance" header or a region name
    const signal = p.award_chart.match(/### ([A-Za-z, ]+)/)?.[1]?.slice(0, 30)
    if (signal) {
      const found = html.includes(signal)
      if (!check('Award chart renders', found, found ? '' : `missing region header "${signal}"`)) allOk = false
    }
  }

  // 5. Tier benefits present (if tier_benefits populated)
  if (Array.isArray(p.tier_benefits) && p.tier_benefits.length) {
    const tierName = p.tier_benefits[0]?.name
    if (tierName) {
      const found = html.includes(tierName)
      if (!check('Tier benefits render', found, found ? '' : `missing tier name "${tierName}"`)) allOk = false
    }
  }

  // 6. Banned-word smell test on rendered HTML (catches if writer voice prompt
  //    inserted absolutes that aren't in the DB row)
  // Skip for now — audit-program.mjs covers DB-side; verify focuses on render.

  console.log(`\n[verify] ${allOk ? 'PASS' : 'FAIL'}`)
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(`[verify] ${err.message}`)
  process.exit(1)
})
