/**
 * Stage 2 import — bulk destinations from OurAirports CSV.
 * Dedupes by (municipality, iso_country), skips slugs already in Supabase,
 * asks Claude Haiku to produce country name, continent, tags, summaries.
 *
 * Usage:
 *   node scripts/import-destinations.mjs --limit=5 --dry-run    # preview
 *   node scripts/import-destinations.mjs --limit=20             # small live batch
 *   node scripts/import-destinations.mjs                        # full run
 *
 * Flags:
 *   --limit=N        Only process first N candidates
 *   --dry-run        Skip Claude + DB writes; print candidate list
 *   --skip-ai        Skip Claude; insert rows with empty enrichment (dev only)
 *   --csv=PATH       Override CSV path (default: /tmp/airports.csv, auto-download)
 *   --concurrency=N  Parallel Claude requests (default: 4)
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    '/Users/jillzeller/Desktop/Github/crazy4points_V2/.env.local',
  ]
  const path = candidates.find(p => existsSync(p))
  if (!path) return
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvLocal()

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const LIMIT       = args.limit ? Number(args.limit) : Infinity
const DRY_RUN     = Boolean(args['dry-run'])
const SKIP_AI     = Boolean(args['skip-ai'])
const CSV_PATH    = args.csv || '/tmp/airports.csv'
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 4

const BRAND_VOICE = `sassy, funny, and smart — like the well-traveled friend who always knows the move.
Playful but never obnoxious. Confident but never mean. We root for the reader.
Use contractions (you'll, it's, don't). Short sentences. No emojis. No corporate hedging.
A little wink is welcome. A lot of wink is exhausting — one playful aside max.`

const CONTINENTS = new Set([
  'north_america', 'central_america', 'south_america',
  'caribbean', 'europe', 'asia', 'middle_east',
  'africa', 'south_pacific',
])
const VIBES        = new Set(['beach', 'city', 'history', 'nature', 'adventure', 'luxury', 'family'])
const TRIP_LENGTHS = new Set(['short', 'medium', 'long'])
const WHO_GOING    = new Set(['solo', 'couple', 'family', 'group'])
const WEATHER_VALS = new Set(['great', 'good', 'mixed', 'poor'])
const MONTHS       = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(cur); cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

async function ensureCsv() {
  if (existsSync(CSV_PATH)) return
  console.log(`→ Downloading airports CSV → ${CSV_PATH}`)
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`)
  writeFileSync(CSV_PATH, await res.text())
}

async function loadCandidates() {
  await ensureCsv()
  const text = readFileSync(CSV_PATH, 'utf8')
  const lines = text.split('\n')
  const header = parseCsvLine(lines[0])
  const col = Object.fromEntries(header.map((h, i) => [h, i]))

  const seen = new Set()
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const f = parseCsvLine(line)
    const type          = f[col.type]
    const sched         = f[col.scheduled_service]
    const iata          = f[col.iata_code]
    const municipality  = f[col.municipality]
    const iso           = f[col.iso_country]

    if (type !== 'large_airport') continue
    if (sched !== 'yes') continue
    if (!iata || !municipality || !iso) continue

    const key = `${municipality}|${iso}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      title: municipality,
      iso_country: iso,
      iata,
      latitude: parseFloat(f[col.latitude_deg]) || null,
      longitude: parseFloat(f[col.longitude_deg]) || null,
    })
  }
  return out
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildPrompt(dest) {
  return `You are writing travel content for crazy4points, a loyalty-points travel site. Voice:

${BRAND_VOICE}

City: ${dest.title}
ISO country code: ${dest.iso_country}

Generate a JSON object with these EXACT keys and NO other text (no markdown, no backticks):

{
  "country": "full country name in English (e.g. United States, South Korea)",
  "continent": "one of: north_america, central_america, south_america, caribbean, europe, asia, middle_east, africa, south_pacific",
  "summary_short": "1-2 punchy sentences (max 240 chars) — the teaser on a card",
  "summary_long": "2 short paragraphs (120-200 words total) — what the place feels like, what you'd do there, who it's for. Sassy tone, no clichés, no emojis.",
  "vibe": array subset of ["beach","city","history","nature","adventure","luxury","family"] — pick 2-4,
  "trip_length": array subset of ["short","medium","long"] — pick 1-3 that make sense,
  "who_is_going": array subset of ["solo","couple","family","group"] — pick the traveler types this fits best (1-4),
  "weather_by_month": object with keys jan feb mar apr may jun jul aug sep oct nov dec, each value one of "great" "good" "mixed" "poor"
}

If this city is not a meaningful travel destination (pure cargo/military hub, unknown), respond with:
{"skip": true, "reason": "why"}

Respond with ONLY the JSON object.`
}

function validateEnriched(e) {
  const errs = []
  if (typeof e.country !== 'string' || !e.country.trim()) errs.push('country empty')
  if (!CONTINENTS.has(e.continent)) errs.push(`bad continent: ${e.continent}`)
  if (typeof e.summary_short !== 'string' || !e.summary_short.trim()) errs.push('summary_short empty')
  if (typeof e.summary_long !== 'string' || !e.summary_long.trim())   errs.push('summary_long empty')
  if (!Array.isArray(e.vibe) || e.vibe.some(v => !VIBES.has(v))) errs.push(`bad vibe: ${JSON.stringify(e.vibe)}`)
  if (!Array.isArray(e.trip_length) || e.trip_length.some(v => !TRIP_LENGTHS.has(v))) errs.push(`bad trip_length: ${JSON.stringify(e.trip_length)}`)
  if (!Array.isArray(e.who_is_going) || e.who_is_going.some(v => !WHO_GOING.has(v))) errs.push(`bad who_is_going: ${JSON.stringify(e.who_is_going)}`)
  if (!e.weather_by_month || typeof e.weather_by_month !== 'object') {
    errs.push('weather_by_month missing')
  } else {
    for (const m of MONTHS) {
      if (!WEATHER_VALS.has(e.weather_by_month[m])) {
        errs.push(`weather.${m} invalid: ${e.weather_by_month[m]}`)
      }
    }
  }
  return errs
}

async function enrich(anthropic, dest) {
  let backoff = 4000
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(dest) }],
      })
      const text = msg.content.map(c => c.type === 'text' ? c.text : '').join('').trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error(`No JSON: ${text.slice(0, 200)}`)
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      const is429 = err?.status === 429 || /429|rate_limit/i.test(String(err?.message))
      if (!is429 || attempt === 4) throw err
      await new Promise(r => setTimeout(r, backoff))
      backoff *= 2
    }
  }
}

async function main() {
  console.log(`→ import-destinations (limit=${LIMIT === Infinity ? 'all' : LIMIT}, dry-run=${DRY_RUN}, skip-ai=${SKIP_AI}, concurrency=${CONCURRENCY})`)

  if (!DRY_RUN && !SKIP_AI && !ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing.')
  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) throw new Error('Supabase env vars missing.')

  const anthropic = !SKIP_AI ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null
  const supabase  = !DRY_RUN ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null

  const candidates = await loadCandidates()
  console.log(`→ ${candidates.length} candidate cities from CSV`)

  let existingSlugs = new Set()
  if (supabase) {
    const { data, error } = await supabase.from('destinations').select('slug')
    if (error) throw error
    existingSlugs = new Set((data ?? []).map(r => r.slug))
    console.log(`→ ${existingSlugs.size} already in DB — will skip`)
  }

  const todo = candidates
    .filter(c => !existingSlugs.has(slugify(c.title)))
    .slice(0, LIMIT)

  console.log(`→ ${todo.length} to process`)
  if (DRY_RUN) {
    console.log(`\nFirst 20 candidates:\n`)
    todo.slice(0, 20).forEach((d, i) => console.log(`  ${i + 1}. ${d.title} (${d.iso_country}) — ${d.iata}`))
    console.log(`\n(dry-run: no Claude calls, no DB writes)`)
    return
  }

  let ok = 0, fail = 0, skipped = 0

  async function processOne(dest, idx, total) {
    const tag = `[${idx + 1}/${total}] ${dest.title} (${dest.iso_country})`
    try {
      let enriched = {
        country: dest.iso_country, continent: 'europe',
        summary_short: '', summary_long: '',
        vibe: [], trip_length: [], who_is_going: [],
        weather_by_month: {},
      }

      if (!SKIP_AI) {
        let attempts = 0
        let errs = []
        while (attempts < 2) {
          enriched = await enrich(anthropic, dest)
          if (enriched.skip) {
            console.log(`${tag} ↷ skip: ${enriched.reason}`)
            skipped++
            return
          }
          errs = validateEnriched(enriched)
          if (!errs.length) break
          attempts++
        }
        if (errs.length) throw new Error(errs.join('; '))
      }

      const row = {
        slug:             slugify(dest.title),
        title:            dest.title,
        country:          enriched.country,
        continent:        enriched.continent,
        iata_code:        dest.iata,
        latitude:         dest.latitude,
        longitude:        dest.longitude,
        is_unesco:        false,
        summary_short:    enriched.summary_short,
        summary_long:     enriched.summary_long,
        vibe:             enriched.vibe,
        trip_length:      enriched.trip_length,
        who_is_going:     enriched.who_is_going,
        weather_by_month: enriched.weather_by_month,
      }

      const { error } = await supabase.from('destinations').upsert(row, { onConflict: 'slug' })
      if (error) throw error
      console.log(`${tag} ✓ [${enriched.continent}] ${enriched.country}`)
      ok++
    } catch (err) {
      fail++
      console.error(`${tag} ✗ ${err.message ?? err}`)
    }
  }

  let cursor = 0
  const total = todo.length
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const i = cursor++
      if (i >= total) return
      await processOne(todo[i], i, total)
    }
  })
  await Promise.all(workers)

  console.log(`\nDone. ${ok} ok, ${skipped} skipped, ${fail} failed, ${total} total.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
