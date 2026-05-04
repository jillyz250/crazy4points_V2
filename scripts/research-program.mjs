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

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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

  const topics = WEBSEARCH_TOPICS_BY_TYPE[program.type] || []
  if (topics.length > 0) {
    console.log(`\n## WebSearch queue (Claude runs in conversation)`)
    for (const t of topics) {
      console.log(`- ${t.replace(/{name}/g, program.name)}`)
    }
  }

  console.log(`\n## Next steps`)
  console.log(`1. Read scraped markdown in \`${outDir}\` to extract Step 2 draft content.`)
  console.log(`2. Run the WebSearch queue above for inbound transfers, sweet spots, recent news.`)
  console.log(`3. Combined preview to user (per Step 2 of the runbook).`)
  console.log(`4. After approval, paste-ready blocks per field.`)

  const okCount = scrapeResults.filter((r) => r.status === 'ok').length
  if (okCount < urlEntries.length) {
    console.log(`\n⚠️ ${urlEntries.length - okCount} of ${urlEntries.length} scrapes failed. Investigate URLs (may have moved) or try a higher --wait.`)
  }
}

main().catch((err) => {
  console.error(`[research-program] ${err.message}`)
  process.exit(1)
})
