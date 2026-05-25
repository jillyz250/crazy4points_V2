#!/usr/bin/env node
//
// Scrape transfer-bonus pages for every program with a
// transfer_bonuses_source_url, diff against current transfer_partners_outbound
// JSONB, and write any mismatches to transfer_bonus_observations for editor
// review at /admin/transfer-bonuses.
//
// USAGE
//   node scripts/scrape-transfer-bonuses.mjs              # all programs
//   node scripts/scrape-transfer-bonuses.mjs --program=citi
//   node scripts/scrape-transfer-bonuses.mjs --dry        # no DB writes
//
// PARSING STRATEGY (intentionally conservative)
//   For each partner already in transfer_partners_outbound, search the scraped
//   markdown for the partner's display name within ~200 chars of any
//   bonus-indicator keyword ("bonus", "transfer bonus", "%" near a ratio,
//   "limited time", etc.) The match emits an observation; absence of any
//   bonus context near the partner emits a no_bonus observation.
//
//   This will produce some false positives (e.g. the FAQ text generically
//   discussing "transfer bonuses" near a partner name). That's by design —
//   the editor reviews + dismisses noise. False NEGATIVES are the real risk
//   to guard against, since they're how stale bonuses sneak through.
//
//   When the scraper can't reliably parse a page (returns empty observations),
//   we still update scraped_at so the freshness indicator works. The
//   observed_context field gives the editor the raw snippet for sanity check.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

try {
  const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)
const dryRun = !!args.dry
const filterProgram = typeof args.program === 'string' ? args.program : null

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!FIRECRAWL_KEY) throw new Error('FIRECRAWL_API_KEY missing')
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env missing')

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Load programs with a source URL ─────────────────────────────────────
let query = sb
  .from('programs')
  .select('slug, name, transfer_bonuses_source_url, transfer_partners_outbound')
  .not('transfer_bonuses_source_url', 'is', null)

if (filterProgram) query = query.eq('slug', filterProgram)

const { data: programs, error: progErr } = await query
if (progErr) throw progErr
if (!programs?.length) {
  console.log('No programs to scrape.')
  process.exit(0)
}

// ── Lookup partner display names from programs table for matching ───────
const { data: allPrograms } = await sb.from('programs').select('slug, name')
const nameBySlug = new Map((allPrograms ?? []).map((p) => [p.slug, p.name]))

// ── Firecrawl one URL ────────────────────────────────────────────────────
async function fetchMarkdown(url) {
  const body = {
    url,
    formats: ['markdown'],
    onlyMainContent: false,
    waitFor: 3500,
    maxAge: 0,
    timeout: 55000,
    proxy: 'auto',
  }
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 200) }
  const json = await res.json()
  if (!json.success || !json.data?.markdown) return { ok: false, status: 200, error: 'no markdown' }
  return { ok: true, markdown: json.data.markdown }
}

// ── Bonus-detection heuristics ──────────────────────────────────────────
// Look for a partner's display name in the markdown; within ±300 chars,
// hunt for bonus indicators + a ratio. Return { hasBonus, ratio, context }.

const BONUS_KEYWORDS = [
  'transfer bonus',
  'bonus points',
  'bonus miles',
  '% bonus',
  'limited time',
  'limited-time',
  'extra points',
  'extra miles',
  'boosted',
]

// Match common bonus ratios: "1:1.5", "1000:1500", "30%", "25% bonus"
const RATIO_PATTERNS = [
  /\b(\d+)\s*:\s*(\d+(?:\.\d+)?)\b/g,
  /\b(\d+)\s*%\s*(?:transfer\s+)?bonus\b/gi,
  /\b(?:transfer\s+)?bonus\s+of\s+(\d+)\s*%/gi,
]

function findPartnerContext(markdown, partnerName) {
  if (!partnerName) return null
  // Case-insensitive search for the partner's name (or first 2 words of it)
  const shortName = partnerName.split(/\s+/).slice(0, 2).join(' ')
  const idx = markdown.toLowerCase().indexOf(shortName.toLowerCase())
  if (idx === -1) return null
  const start = Math.max(0, idx - 300)
  const end = Math.min(markdown.length, idx + 300)
  return markdown.slice(start, end)
}

function extractBonus(context) {
  if (!context) return { hasBonus: false, ratio: null }
  const lower = context.toLowerCase()
  const hasKeyword = BONUS_KEYWORDS.some((k) => lower.includes(k))
  if (!hasKeyword) return { hasBonus: false, ratio: null }

  for (const pattern of RATIO_PATTERNS) {
    pattern.lastIndex = 0
    const m = pattern.exec(context)
    if (m) {
      // Normalize to "X:Y" or "N%" depending on what matched
      if (m[2]) return { hasBonus: true, ratio: `${m[1]}:${m[2]}` }
      return { hasBonus: true, ratio: `${m[1]}%` }
    }
  }
  return { hasBonus: true, ratio: null }
}

// ── Diff one program ─────────────────────────────────────────────────────
async function processProgram(program) {
  const url = program.transfer_bonuses_source_url
  console.log(`\n[${program.slug}] fetching ${url}`)
  const fetched = await fetchMarkdown(url)
  if (!fetched.ok) {
    console.log(`  FAIL ${fetched.status}: ${fetched.error}`)
    return { fetched: false }
  }
  console.log(`  OK ${fetched.markdown.length}c`)

  const partners = (program.transfer_partners_outbound ?? [])
  if (partners.length === 0) {
    console.log(`  no outbound partners — skipping diff`)
    return { fetched: true, observations: [] }
  }

  const observations = []
  for (const p of partners) {
    const partnerName = nameBySlug.get(p.from_slug) ?? p.from_slug
    const context = findPartnerContext(fetched.markdown, partnerName)
    const { hasBonus, ratio } = extractBonus(context)

    const currentlyBonus = !!p.bonus_active
    const currentPromo = p.promo_ratio ?? null

    // EMIT OBSERVATION when:
    //   • DB says bonus_active=true but scraper found no bonus context  (likely ended)
    //   • DB says bonus_active=false but scraper found bonus context     (likely new)
    //   • DB and scraper agree on bonus but the ratio differs            (likely changed)
    const stateChanged = currentlyBonus !== hasBonus
    const ratioChanged = hasBonus && ratio && currentPromo && ratio !== currentPromo
    if (!stateChanged && !ratioChanged) continue

    observations.push({
      program_slug: program.slug,
      partner_slug: p.from_slug,
      observed_state: hasBonus ? 'has_bonus' : 'no_bonus',
      observed_ratio: ratio,
      observed_context: context?.slice(0, 500) ?? null,
      source_url: url,
      current_bonus_active: currentlyBonus,
      current_promo_ratio: currentPromo,
      current_base_ratio: p.ratio ?? null,
    })
  }

  console.log(`  ${observations.length} observation(s) to record`)
  return { fetched: true, observations }
}

// ── Main loop ────────────────────────────────────────────────────────────
let totalObs = 0
let scraped = 0

for (const program of programs) {
  const result = await processProgram(program)

  if (!result.fetched) continue
  scraped += 1

  if (!dryRun) {
    // Wipe prior pending observations for this program — only the latest scrape
    // should sit in the queue. Already-applied / dismissed rows are preserved
    // for audit history.
    await sb
      .from('transfer_bonus_observations')
      .delete()
      .eq('program_slug', program.slug)
      .eq('status', 'new')

    if (result.observations.length > 0) {
      const { error: insErr } = await sb
        .from('transfer_bonus_observations')
        .insert(result.observations)
      if (insErr) {
        console.error(`  INSERT FAILED: ${insErr.message}`)
        continue
      }
    }

    await sb
      .from('programs')
      .update({ transfer_bonuses_scraped_at: new Date().toISOString() })
      .eq('slug', program.slug)
  }

  totalObs += result.observations.length
}

console.log(`\n──────────────────────────────`)
console.log(`Scraped:      ${scraped}/${programs.length} programs`)
console.log(`Observations: ${totalObs} ${dryRun ? '(dry-run, NOT written)' : 'written'}`)
console.log(`Review:       https://crazy4points.com/admin/transfer-bonuses`)
