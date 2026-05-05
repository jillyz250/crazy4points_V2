#!/usr/bin/env node
/**
 * research-program.mjs — Step 1 research orchestrator for program authoring
 *
 * Reads programs.scrape_urls + programs.type from Supabase, runs scrape.mjs
 * (with --wait for SPA pages) against every URL, runs extract-chart.mjs
 * against the chart URL using the type-matched schema, and emits a one-page
 * research bundle ready for drafting (Step 2 of the add-airline runbook).
 *
 * Stashes outputs to /tmp/research/<slug>/<key>.{md,json}.
 *
 * Also emits a queue of WebSearch topics tailored to program type — these
 * are NOT run by the script (WebSearch is a Claude tool, not a node API).
 * Claude runs them in conversation.
 *
 * USAGE:
 *   node scripts/research-program.mjs --slug=marriott-bonvoy
 *   node scripts/research-program.mjs --slug=marriott-bonvoy --wait=8000
 *   node scripts/research-program.mjs --slug=hyatt --skip-chart   # already have chart
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

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
  const args = { slug: null, waitMs: 8000, skipChart: false }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) args.slug = a.split('=')[1]
    else if (a.startsWith('--wait=')) args.waitMs = parseInt(a.split('=')[1], 10)
    else if (a === '--skip-chart') args.skipChart = true
  }
  if (!args.slug) {
    console.error('Usage: research-program.mjs --slug=<slug> [--wait=<ms>] [--skip-chart]')
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
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status}`)
  return res.json()
}

const CHART_SCHEMA_BY_TYPE = {
  hotel: 'scripts/schemas/hotel-category-chart.json',
  airline: 'scripts/schemas/airline-distance-banded-chart.json',
  loyalty_program: 'scripts/schemas/airline-distance-banded-chart.json',
}

/**
 * After scraping finishes, grep the captured markdown for known fact-check
 * patterns and emit a "FACTS FOUND IN OFFICIAL SOURCES" summary. Forces
 * the drafter to surface ground-truth from scrapes instead of relying on
 * training-data assumptions.
 *
 * Lesson learned from the 2026-05-05 Frontier authoring session: 2 of 3
 * wrong claims (mile-expiry rule, hub list, pricing model) had the correct
 * answer sitting in already-scraped 226K-byte source content. Drafter
 * (Claude) wrote training-data-derived claims without grepping the source.
 * This summary surfaces the answer next to the bulk markdown so it can't
 * be ignored.
 *
 * Patterns are per-type so airline-only patterns (fuel surcharge, stopover)
 * don't fire on hotel scrapes and vice versa.
 */
const FACT_GREP_PATTERNS_BY_TYPE = {
  airline: [
    // EXPIRY: catch both "12 months" and "twelve months" forms, plus "do not expire" hedges
    // Three complementary patterns wrapped in alternation: numeric/word
    // expiry threshold ("12 months" / "twelve months"), miles-near-expire
    // proximity match (catches "Miles in a Member's account do not expire so
    // long as ... twelve months"), and explicit "do not expire" hedges.
    { label: 'EXPIRY',         regex: /(?:(?:\d{1,2}|twelve|eighteen|twenty-?four)\s*(?:-?\s*)?(?:months?|years?)\s*(?:of\s+)?(?:inactivity|inactive|no activity|no qualifying|after\s+(?:your|the)\s+last|since\s+(?:your|the)\s+last|accrual activity)|(?:miles?|points?)[^.\n]{0,80}?\bexpir(?:e|es|ed|ing|ation)|do\s+not\s+expire)\s*[^.\n]{0,180}/gi },
    // HUBS: include headquartered + based + airport-code-near-hub
    { label: 'HUBS',           regex: /\b(?:hub|focus city|operating base|crew base|headquartered|based in|principal place of business)s?\b[^.]{0,120}/gi },
    { label: 'PRICING_MODEL',  regex: /\b(dynamic|revenue-based|fixed chart|published award chart|tiered|Value tier|Standard tier|Last Seat|MileSAAver|saver award|level [1-9])\b[^.]{0,80}/gi },
    { label: 'FUEL_SURCHARGE', regex: /\b(?:fuel surcharge|carrier[- ]imposed surcharge|YQ|YR)s?\b[^.]{0,120}/gi },
    { label: 'STOPOVER',       regex: /\b(?:stopover|open[- ]jaw|free stopover)s?\b[^.]{0,120}/gi },
    { label: 'POOLING',        regex: /\b(?:family pool|household pool|miles? pool)(?:ing)?\b[^.]{0,150}/gi },
    { label: 'TRANSFER_TAX',   regex: /\b(?:federal excise tax|transfer fee|transfer tax|taxes?\s+may\s+apply)\b[^.]{0,100}/gi },
  ],
  loyalty_program: [
    { label: 'EXPIRY',         regex: /(?:(\d{1,2}|twelve|eighteen|twenty-?four)\s*(?:-?\s*)?(months?|years?)\s*(?:of\s+)?(?:inactivity|inactive|no activity|no qualifying|after\s+(?:your|the)\s+last|accrual activity)|miles?\s*(?:do\s+not\s+expire|expire(?:s)?))\s*[^.]{0,180}/gi },
    { label: 'PRICING_MODEL',  regex: /\b(dynamic|revenue-based|fixed chart|published award chart|tiered|distance[- ]band|region[- ]band)\b[^.]{0,80}/gi },
    { label: 'STOPOVER',       regex: /\b(?:stopover|open[- ]jaw)s?\b[^.]{0,120}/gi },
    { label: 'POOLING',        regex: /\b(?:family pool|household pool|miles? pool)(?:ing)?\b[^.]{0,150}/gi },
  ],
  hotel: [
    { label: 'EXPIRY',         regex: /(?:(\d{1,2}|twelve|eighteen|twenty-?four)\s*(?:-?\s*)?(months?|years?)\s*(?:of\s+)?(?:inactivity|inactive|no activity|after\s+(?:your|the)\s+last|accrual activity)|points?\s*(?:do\s+not\s+expire|expire(?:s)?))\s*[^.]{0,180}/gi },
    { label: 'CATEGORIES',     regex: /\b(?:Category\s+[1-9]|Cat\s*[1-9]|categor(?:y|ies))\b[^.]{0,100}/gi },
    { label: 'FNC_RULES',      regex: /\b(?:Free Night (?:Award|Certificate|Cert|Reward)|FNA|FNC|anniversary night)\b[^.]{0,150}/gi },
    { label: 'PEAK_OFFPEAK',   regex: /\b(?:off[- ]peak|peak pricing|standard rate|peak\/off-peak)\b[^.]{0,120}/gi },
    { label: 'LOUNGE',         regex: /\b(?:club lounge|executive lounge|concierge lounge|regency club)\b[^.]{0,150}/gi },
    { label: 'LIFETIME',       regex: /\blifetime (?:status|silver|gold|platinum|globalist|titanium|nights?)\b[^.]{0,150}/gi },
    { label: 'FIFTH_NIGHT',    regex: /\b(?:5th night|fifth night|stay\s*(?:5|five)|pay\s*(?:4|four))\b[^.]{0,150}/gi },
    { label: 'SNA_RULES',      regex: /\b(?:Suite Night Award|SNA|Nightly Upgrade Award|NUA|suite upgrade)\b[^.]{0,120}/gi },
  ],
  alliance: [
    { label: 'MEMBER_COUNT',   regex: /\b(\d+)\s+(?:full\s+)?member(?:\s+airlines?)?\b[^.]{0,80}/gi },
    { label: 'TIER_CROSSOVER', regex: /\b(?:Sapphire|Emerald|Ruby|Elite Plus|Star Gold|Star Silver)\b[^.]{0,100}/gi },
    { label: 'RTW',            regex: /\b(?:round[- ]the[- ]world|RTW|circle pacific|explorer pass)\b[^.]{0,150}/gi },
  ],
  credit_card: [
    { label: 'AF',             regex: /\b(?:annual fee|no annual fee|\$\d{2,3}\s+annual|first[- ]year fee)\b[^.]{0,100}/gi },
    { label: 'SUB',            regex: /\b(?:welcome (?:offer|bonus)|sign-?up bonus|SUB|new cardmember)\b[^.]{0,150}/gi },
    { label: 'FIVE_TWENTYFOUR', regex: /\b(?:5\/24|five.{0,3}twenty.{0,3}four|24-month)\b[^.]{0,100}/gi },
    { label: 'INSURANCE',      regex: /\b(?:trip cancellation|trip delay|baggage delay|primary auto|rental car insurance|travel insurance)\b[^.]{0,100}/gi },
  ],
}

function summarizeFacts(programType, outDir) {
  const patterns = FACT_GREP_PATTERNS_BY_TYPE[programType] || []
  if (patterns.length === 0) return null

  let files = []
  try {
    files = readdirSync(outDir).filter((f) => f.endsWith('.md'))
  } catch {
    return null
  }

  const output = []
  for (const { label, regex } of patterns) {
    const hits = []
    for (const f of files) {
      try {
        const text = readFileSync(join(outDir, f), 'utf8')
        const matches = [...text.matchAll(regex)]
        for (const m of matches) {
          const lineNum = text.slice(0, m.index).split('\n').length
          const snippet = m[0].replace(/\s+/g, ' ').slice(0, 180).trim()
          // Skip nav/link-only hits (they're table-of-contents references,
          // not body content). Body content tends to be longer + free of
          // markdown-link artifacts.
          const isNavLink = snippet.length < 35 || snippet.includes('](https://') || /\?\]\(/.test(snippet)
          hits.push({ file: f, line: lineNum, snippet, isNavLink })
        }
      } catch {}
    }
    if (hits.length > 0) {
      // Prefer body hits (non-nav) over nav-link hits when we have many.
      const bodyHits = hits.filter((h) => !h.isNavLink)
      const navHits = hits.filter((h) => h.isNavLink)
      const display = bodyHits.length >= 3 ? bodyHits.slice(0, 8) : [...bodyHits, ...navHits].slice(0, 8)
      output.push(`\n**${label}** (${hits.length} hit${hits.length === 1 ? '' : 's'} across scrapes${bodyHits.length < hits.length ? `, ${bodyHits.length} body` : ''}):`)
      for (const h of display) {
        output.push(`  - \`${h.file}:${h.line}\` — ${h.snippet}`)
      }
    }
  }
  return output.length === 0 ? null : output.join('\n')
}

const WEBSEARCH_TOPICS_BY_TYPE = {
  hotel: [
    'inbound transfer ratios Amex MR Chase UR Bilt Citi Cap One to {name} 2026',
    '{name} sweet spots low-cost award stays Cat 1-3 sub-25K observations 2026',
    '{name} 5th-night-free or fifth-night-free award rule current',
    '{name} Suite Night Award or upgrade rules Platinum-tier 2026',
    '{name} all-inclusive resort award stays sweet spots 2026',
    '{name} recent program changes devaluations 2025 2026',
    '{name} co-brand credit cards currently issued vs legacy discontinued 2026 active applications',
  ],
  airline: [
    'inbound transfer ratios Amex MR Chase UR Bilt Citi Cap One to {name} 2026',
    '{name} sweet spots partner award redemption 2026',
    '{name} stopover open-jaw rules current 2026',
    '{name} fuel surcharge carrier-imposed surcharges policy 2026',
    '{name} family pooling household rules 2026',
    '{name} recent devaluations program changes 2025 2026',
    '{name} co-brand credit cards currently issued vs legacy discontinued 2026 active applications',
  ],
  loyalty_program: [
    'inbound transfer ratios Amex MR Chase UR Bilt Citi Cap One to {name} 2026',
    '{name} sweet spots partner award redemption 2026',
    '{name} stopover open-jaw rules 2026',
    '{name} fuel surcharge policy 2026',
    '{name} recent devaluations 2025 2026',
    '{name} co-brand credit cards currently issued vs legacy discontinued 2026 active applications',
  ],
  alliance: [
    '{name} round-the-world award rules 2026',
    '{name} member airline list current 2026',
    '{name} elite tier crossover Sapphire Emerald Ruby Gold Silver 2026',
    '{name} recent membership changes 2025 2026',
  ],
  credit_card: [
    '{name} current welcome offer SUB 2026',
    '{name} 5/24 once-per-lifetime SUB rules 2026',
    '{name} co-brand benefits Free Night Cert anniversary points 2026',
    '{name} travel insurance benefits guide 2026',
  ],
}

function runScrape(url, waitMs, outPath) {
  const args = ['scripts/scrape.mjs', url, `--wait=${waitMs}`]
  const res = spawnSync('node', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
  if (res.status === 0 && res.stdout) {
    writeFileSync(outPath, res.stdout)
    const lines = res.stdout.split('\n').length
    const bytes = res.stdout.length
    return { status: 'ok', lines, bytes, outPath }
  }
  return { status: 'failed', error: (res.stderr || '').slice(0, 200) }
}

function runExtract(url, schema, waitMs, outPath) {
  const args = [
    'scripts/extract-chart.mjs',
    `--url=${url}`,
    `--schema=${schema}`,
    `--wait=${waitMs}`,
    `--out=${outPath}`,
  ]
  const res = spawnSync('node', args, { encoding: 'utf8' })
  if (res.status === 0) {
    return { status: 'ok', outPath }
  }
  return { status: 'failed', error: (res.stderr || '').slice(0, 200) }
}

async function main() {
  loadEnv()
  const args = parseArgs()

  const rows = await sb(`programs?slug=eq.${args.slug}&select=slug,name,type,scrape_urls,refresh_tier`)
  if (!rows || rows.length === 0) {
    console.error(`No program with slug=${args.slug}`)
    process.exit(1)
  }
  const program = rows[0]
  const urls = program.scrape_urls || {}
  const urlEntries = Object.entries(urls).filter(([, v]) => typeof v === 'string' && v.length > 0)

  if (urlEntries.length === 0) {
    console.error(`Program ${args.slug} has empty scrape_urls. Seed it first via migration.`)
    process.exit(1)
  }

  const outDir = `/tmp/research/${args.slug}`
  mkdirSync(outDir, { recursive: true })

  console.log(`# Research bundle — ${program.name} (${program.slug})`)
  console.log(`Type: ${program.type} · Refresh tier: ${program.refresh_tier} · Wait: ${args.waitMs}ms`)
  console.log(`Output dir: ${outDir}\n`)

  console.log(`## Scrapes`)
  const scrapeResults = []
  for (const [key, url] of urlEntries) {
    process.stderr.write(`[scrape] ${key} → ${url} ... `)
    const r = runScrape(url, args.waitMs, join(outDir, `${key}.md`))
    scrapeResults.push({ key, url, ...r })
    process.stderr.write(`${r.status}${r.lines ? ` (${r.lines} lines, ${r.bytes} B)` : ''}\n`)
  }
  for (const r of scrapeResults) {
    if (r.status === 'ok') {
      console.log(`- ✅ **${r.key}** — ${r.lines} lines, ${r.bytes} B → \`${r.outPath}\``)
    } else {
      console.log(`- ❌ **${r.key}** — failed (${r.error})`)
    }
  }

  if (!args.skipChart && urls.chart) {
    const schema = CHART_SCHEMA_BY_TYPE[program.type]
    if (schema) {
      console.log(`\n## Chart extract`)
      process.stderr.write(`[extract] chart → ${urls.chart} (${schema}) ... `)
      const out = join(outDir, 'chart.json')
      const r = runExtract(urls.chart, schema, args.waitMs, out)
      process.stderr.write(`${r.status}\n`)
      if (r.status === 'ok') {
        console.log(`- ✅ Extracted via \`${schema}\` → \`${out}\``)
      } else {
        console.log(`- ❌ Extract failed: ${r.error}`)
      }
    } else {
      console.log(`\n## Chart extract — skipped (no schema for type=${program.type})`)
    }
  }

  // Auto-grep summary: surface known fact-check patterns from scraped
  // markdown so the drafter doesn't substitute training-data assumptions
  // for ground-truth that's already in the scrape (the 2026-05-05 Frontier
  // session lost on this — wrong mile-expiry + hub list + pricing-model
  // claims all had correct answers in the 226K-byte source we scraped but
  // never grepped).
  const factSummary = summarizeFacts(program.type, outDir)
  if (factSummary) {
    console.log(`\n## Facts found in official sources (grep against scraped markdown)`)
    console.log(`Use these BEFORE training-data fill-in. If the patterns surfaced an answer, it's authoritative; the scrape is the source of truth.`)
    console.log(factSummary)
  } else {
    console.log(`\n## Facts found in official sources`)
    console.log(`(no patterns matched — check the scraped markdown manually for expiry, pricing, hubs, etc.)`)
  }

  const topics = WEBSEARCH_TOPICS_BY_TYPE[program.type] || []
  if (topics.length > 0) {
    console.log(`\n## WebSearch queue (Claude runs in conversation)`)
    for (const t of topics) {
      console.log(`- ${t.replace(/{name}/g, program.name)}`)
    }
  }

  console.log(`\n## Next steps`)
  console.log(`1. Read scraped markdown in \`${outDir}\` to extract Step 2 draft content.`)
  console.log(`2. Cross-check against the "Facts found in official sources" summary above — if it surfaced something, that's the canonical answer.`)
  console.log(`3. Run the WebSearch queue for inbound transfers, sweet spots, recent news.`)
  console.log(`4. Emit the Copilot fact-check block (per the updated SKILL.md Step 2).`)
  console.log(`5. After Copilot pass, write SQL migration directly.`)

  const okCount = scrapeResults.filter((r) => r.status === 'ok').length
  if (okCount < urlEntries.length) {
    console.log(`\n⚠️ ${urlEntries.length - okCount} of ${urlEntries.length} scrapes failed. Investigate URLs (may have moved) or try a higher --wait.`)
  }
}

main().catch((err) => {
  console.error(`[research-program] ${err.message}`)
  process.exit(1)
})
