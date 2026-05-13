#!/usr/bin/env node
/**
 * run-scraper.mjs — generic Promo Intelligence Engine scraper runner
 *
 * Reads a selector config from lib/scrapers/<slug>.json, invokes
 * Firecrawl to extract structured data, then persists the rows via
 * utils/scraper/persist.ts (which handles diffing + enrichment).
 *
 * USAGE:
 *   node scripts/run-scraper.mjs --slug=flying-blue-promo-rewards
 *   node scripts/run-scraper.mjs --slug=... --dry-run      (no DB writes)
 *   node scripts/run-scraper.mjs --all                     (run every config)
 *
 * EXIT CODES:
 *   0  success
 *   1  config / env error
 *   2  Firecrawl error
 *   3  parse error
 *   4  persist error
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const SCRAPERS_DIR = join(REPO_ROOT, 'lib', 'scrapers')

function loadEnv() {
  try {
    const text = readFileSync(join(REPO_ROOT, '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

function parseArgs() {
  const args = { slug: null, all: false, dryRun: false }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) args.slug = a.slice('--slug='.length)
    else if (a === '--all') args.all = true
    else if (a === '--dry-run') args.dryRun = true
  }
  if (!args.slug && !args.all) {
    console.error('Usage: run-scraper.mjs --slug=<slug> [--dry-run]   |   --all')
    process.exit(1)
  }
  return args
}

function loadConfig(slug) {
  const path = join(SCRAPERS_DIR, `${slug}.json`)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(`Failed to load config ${path}: ${err.message}`)
    process.exit(1)
  }
}

function listAllSlugs() {
  return readdirSync(SCRAPERS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5))
}

async function firecrawlScrape(config) {
  const body = {
    url: config.source_url,
    formats: ['json'],
    jsonOptions: { schema: config.schema },
    timeout: 60000,
    ...(config.firecrawl_options ?? {}),
  }
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(75000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  if (!data.success) throw new Error(`Firecrawl returned success=false`)
  return {
    json: data.data?.json,
    credits: data.data?.metadata?.creditsUsed ?? null,
  }
}

function getByPath(obj, path) {
  if (!path) return obj
  return path.split('.').reduce((cur, key) => (cur == null ? cur : cur[key]), obj)
}

function mapFields(item, mapping) {
  const out = {}
  for (const [target, source] of Object.entries(mapping)) {
    out[target] = getByPath(item, source) ?? null
  }
  return out
}

async function loadSupabase() {
  // Lazy import — keeps the script cheap when in --dry-run mode
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

async function lookupProgramId(supabase, slug) {
  const { data, error } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

async function runOne(config, { dryRun }) {
  const started = Date.now()
  console.log(`\n[${config.slug}] starting`)
  console.log(`  source: ${config.source_url}`)

  let credits = null
  let firecrawlResult
  try {
    firecrawlResult = await firecrawlScrape(config)
    credits = firecrawlResult.credits
    console.log(`  firecrawl ok (credits: ${credits ?? '?'})`)
  } catch (err) {
    console.error(`  firecrawl FAILED: ${err.message}`)
    return { slug: config.slug, status: 'failed', error: err.message }
  }

  const itemsRaw = getByPath(firecrawlResult.json, config.items_path)
  if (!Array.isArray(itemsRaw)) {
    console.error(`  parse FAILED: items_path "${config.items_path}" did not yield an array`)
    console.error(`  Got: ${JSON.stringify(firecrawlResult.json).slice(0, 400)}`)
    return { slug: config.slug, status: 'failed', error: 'items_path miss' }
  }
  console.log(`  parsed ${itemsRaw.length} items`)

  const parsed = itemsRaw.map((item) => ({
    source_url: config.source_url,
    raw_payload: item,
    ...mapFields(item, config.field_mapping ?? {}),
  }))

  if (dryRun) {
    console.log('  DRY-RUN — first 3 parsed items:')
    for (const row of parsed.slice(0, 3)) {
      console.log(`    ${JSON.stringify(row).slice(0, 200)}`)
    }
    return { slug: config.slug, status: 'success', items_seen: parsed.length, dry: true }
  }

  // Live mode: persist via Supabase
  const supabase = await loadSupabase()
  const programId = await lookupProgramId(supabase, config.program_slug)
  if (!programId) {
    console.error(`  program slug "${config.program_slug}" not found`)
    return { slug: config.slug, status: 'failed', error: 'program not found' }
  }

  // Import persist module — note this needs TS-aware loader; using tsx/ts-node if available
  // For Phase 0 we keep this script JS-only and call into the compiled JS at runtime;
  // until then, we just log the parsed rows. Persisting will be wired in once we add
  // a ts-runner (Phase 1).
  console.log('  [Phase 0] persist layer not yet wired — would have persisted', parsed.length, 'rows')
  console.log('  See utils/scraper/persist.ts for the persistence logic — wire up in Phase 1.')

  const duration = Date.now() - started
  return {
    slug: config.slug,
    status: 'success',
    items_seen: parsed.length,
    duration_ms: duration,
    credits,
  }
}

async function main() {
  loadEnv()
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY missing from .env.local')
    process.exit(1)
  }

  const args = parseArgs()
  const slugs = args.all ? listAllSlugs() : [args.slug]

  const results = []
  for (const slug of slugs) {
    const config = loadConfig(slug)
    const r = await runOne(config, { dryRun: args.dryRun })
    results.push(r)
  }

  console.log('\n=== Summary ===')
  for (const r of results) {
    console.log(`  ${r.slug.padEnd(35)} ${r.status.padEnd(8)} ${r.items_seen ?? 0} items`)
  }

  const failures = results.filter((r) => r.status !== 'success').length
  process.exit(failures > 0 ? 4 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
