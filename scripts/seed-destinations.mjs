/**
 * Stage 1 seed — ~30 curated destinations for the Decision Engine.
 * Calls Claude Haiku once per destination to generate tags + summaries,
 * then upserts into the Supabase `destinations` table (by slug).
 *
 * Run with Node 20+ (uses --env-file):
 *   node --env-file=.env.local scripts/seed-destinations.mjs
 *
 * Flags:
 *   --limit=5     Only process the first N destinations
 *   --dry-run     Skip DB write, skip Claude call — just validate input list
 *   --skip-ai     Insert rows with empty Claude fields (for DB-only testing)
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Env loader (self-contained — handles values with $, !, @ etc) ───────────

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

// ─── Config ──────────────────────────────────────────────────────────────────

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY

// Parse flags
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const LIMIT    = args.limit ? Number(args.limit) : Infinity
const DRY_RUN  = Boolean(args['dry-run'])
const SKIP_AI  = Boolean(args['skip-ai'])

// ─── Brand voice (mirrors utils/ai/editorialRules.ts BRAND_VOICE) ────────────

const BRAND_VOICE = `sassy, funny, and smart — like the well-traveled friend who always knows the move.
Playful but never obnoxious. Confident but never mean. We root for the reader.
Use contractions (you'll, it's, don't). Short sentences. No emojis. No corporate hedging.
A little wink is welcome. A lot of wink is exhausting — one playful aside max.`

// ─── Valid enum values (must match the frontend in app/(site)/decision-engine) ─

const CONTINENTS = new Set([
  'north_america', 'central_america', 'south_america',
  'caribbean', 'europe', 'asia', 'middle_east',
  'africa', 'south_pacific',
])
const VIBES         = new Set(['beach', 'city', 'history', 'nature', 'adventure', 'luxury', 'family'])
const TRIP_LENGTHS  = new Set(['short', 'medium', 'long'])
const WHO_GOING     = new Set(['solo', 'couple', 'family', 'group'])
const WEATHER_VALS  = new Set(['great', 'good', 'mixed', 'poor'])
const MONTHS        = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

// ─── Curated destination seed list (30 across all 9 regions) ─────────────────

const SEED = [
  // North America
  { title: 'New York City',      country: 'United States',  continent: 'north_america',   iata: 'JFK' },
  { title: 'Banff',              country: 'Canada',         continent: 'north_america',   iata: 'YYC' },
  { title: 'San Francisco',      country: 'United States',  continent: 'north_america',   iata: 'SFO' },

  // Central America
  { title: 'Tulum',              country: 'Mexico',         continent: 'central_america', iata: 'CUN' },
  { title: 'Antigua Guatemala',  country: 'Guatemala',      continent: 'central_america', iata: 'GUA' },
  { title: 'San José',           country: 'Costa Rica',     continent: 'central_america', iata: 'SJO' },

  // South America
  { title: 'Buenos Aires',       country: 'Argentina',      continent: 'south_america',   iata: 'EZE' },
  { title: 'Cusco',              country: 'Peru',           continent: 'south_america',   iata: 'CUZ' },
  { title: 'Rio de Janeiro',     country: 'Brazil',         continent: 'south_america',   iata: 'GIG' },

  // Caribbean
  { title: 'Turks and Caicos',   country: 'Turks and Caicos', continent: 'caribbean',     iata: 'PLS' },
  { title: 'St. Lucia',          country: 'St. Lucia',      continent: 'caribbean',       iata: 'UVF' },
  { title: 'Aruba',              country: 'Aruba',          continent: 'caribbean',       iata: 'AUA' },

  // Europe
  { title: 'Paris',              country: 'France',         continent: 'europe',          iata: 'CDG' },
  { title: 'Rome',               country: 'Italy',          continent: 'europe',          iata: 'FCO' },
  { title: 'Amsterdam',          country: 'Netherlands',    continent: 'europe',          iata: 'AMS' },
  { title: 'Lisbon',             country: 'Portugal',       continent: 'europe',          iata: 'LIS' },
  { title: 'Reykjavík',          country: 'Iceland',        continent: 'europe',          iata: 'KEF' },

  // Asia
  { title: 'Tokyo',              country: 'Japan',          continent: 'asia',            iata: 'HND' },
  { title: 'Bali',               country: 'Indonesia',      continent: 'asia',            iata: 'DPS' },
  { title: 'Kyoto',              country: 'Japan',          continent: 'asia',            iata: 'KIX' },
  { title: 'Bangkok',            country: 'Thailand',       continent: 'asia',            iata: 'BKK' },
  { title: 'Singapore',          country: 'Singapore',      continent: 'asia',            iata: 'SIN' },

  // Middle East
  { title: 'Dubai',              country: 'United Arab Emirates', continent: 'middle_east', iata: 'DXB' },
  { title: 'Petra',              country: 'Jordan',         continent: 'middle_east',     iata: 'AMM', is_unesco: true },

  // Africa
  { title: 'Cape Town',          country: 'South Africa',   continent: 'africa',          iata: 'CPT' },
  { title: 'Marrakech',          country: 'Morocco',        continent: 'africa',          iata: 'RAK' },
  { title: 'Zanzibar',           country: 'Tanzania',       continent: 'africa',          iata: 'ZNZ' },

  // South Pacific
  { title: 'Sydney',             country: 'Australia',      continent: 'south_pacific',   iata: 'SYD' },
  { title: 'Fiji',                country: 'Fiji',           continent: 'south_pacific',   iata: 'NAN' },
  { title: 'Bora Bora',          country: 'French Polynesia', continent: 'south_pacific', iata: 'BOB' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

Destination: ${dest.title}, ${dest.country}

Generate a JSON object with these EXACT keys and NO other text (no markdown, no backticks):

{
  "summary_short": "1-2 punchy sentences (max 240 chars) — the teaser on a card",
  "summary_long": "2 short paragraphs (120-200 words total) — what the place feels like, what you'd do there, who it's for. Sassy tone, no clichés, no emojis.",
  "vibe": array subset of ["beach","city","history","nature","adventure","luxury","family"] — pick 2-4,
  "trip_length": array subset of ["short","medium","long"] where short=2-4 days, medium=5-7 days, long=8+ days — pick 1-3 that make sense,
  "who_is_going": array subset of ["solo","couple","family","group"] — pick the traveler types this fits best (1-4),
  "weather_by_month": object with keys jan feb mar apr may jun jul aug sep oct nov dec, each value one of "great" "good" "mixed" "poor". Definitions:
    - "great": ideal weather, peak reason to visit
    - "good": pleasant, mostly dry, fine to visit
    - "mixed": shoulder season, some rain or extremes, not a dealbreaker
    - "poor": actively avoid (hurricane, monsoon, extreme cold/heat)
}

Respond with ONLY the JSON object. No preamble, no explanation.`
}

function validateEnriched(e, dest) {
  const errs = []
  if (typeof e.summary_short !== 'string' || !e.summary_short.trim()) errs.push('summary_short empty')
  if (typeof e.summary_long !== 'string' || !e.summary_long.trim())   errs.push('summary_long empty')

  if (!Array.isArray(e.vibe) || e.vibe.some(v => !VIBES.has(v)))                errs.push(`bad vibe: ${JSON.stringify(e.vibe)}`)
  if (!Array.isArray(e.trip_length) || e.trip_length.some(v => !TRIP_LENGTHS.has(v))) errs.push(`bad trip_length: ${JSON.stringify(e.trip_length)}`)
  if (!Array.isArray(e.who_is_going) || e.who_is_going.some(v => !WHO_GOING.has(v)))  errs.push(`bad who_is_going: ${JSON.stringify(e.who_is_going)}`)

  if (!e.weather_by_month || typeof e.weather_by_month !== 'object') {
    errs.push('weather_by_month missing')
  } else {
    for (const m of MONTHS) {
      if (!WEATHER_VALS.has(e.weather_by_month[m])) {
        errs.push(`weather_by_month.${m} invalid: ${e.weather_by_month[m]}`)
      }
    }
  }
  return errs
}

async function enrich(anthropic, dest) {
  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(dest) }],
  })
  const text = msg.content.map(c => c.type === 'text' ? c.text : '').join('').trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON found in response: ${text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0])
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`→ Seeding destinations (limit=${LIMIT === Infinity ? 'all' : LIMIT}, dry-run=${DRY_RUN}, skip-ai=${SKIP_AI})`)

  if (!DRY_RUN && !SKIP_AI && !ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing. Load .env.local with --env-file.')
  }
  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).')
  }

  const anthropic = !SKIP_AI ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null
  const supabase  = !DRY_RUN ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null

  const list = SEED.slice(0, LIMIT)
  let ok = 0, fail = 0

  for (let i = 0; i < list.length; i++) {
    const dest = list[i]
    const tag = `[${i + 1}/${list.length}] ${dest.title}`

    try {
      let enriched = {
        summary_short: '', summary_long: '',
        vibe: [], trip_length: [], who_is_going: [],
        weather_by_month: {},
      }

      if (!SKIP_AI) {
        console.log(`${tag} → Claude…`)
        enriched = await enrich(anthropic, dest)
        const errs = validateEnriched(enriched, dest)
        if (errs.length) throw new Error(`Validation failed: ${errs.join('; ')}`)
      }

      const row = {
        slug:            slugify(dest.title),
        title:           dest.title,
        country:         dest.country,
        continent:       dest.continent,
        iata_code:       dest.iata ?? null,
        is_unesco:       Boolean(dest.is_unesco),
        summary_short:   enriched.summary_short,
        summary_long:    enriched.summary_long,
        vibe:            enriched.vibe,
        trip_length:     enriched.trip_length,
        who_is_going:    enriched.who_is_going,
        weather_by_month: enriched.weather_by_month,
      }

      if (DRY_RUN) {
        console.log(`${tag} ✓ (dry-run — row preview):`, { ...row, summary_long: row.summary_long.slice(0, 60) + '…' })
      } else {
        const { error } = await supabase
          .from('destinations')
          .upsert(row, { onConflict: 'slug' })
        if (error) throw error
        console.log(`${tag} ✓ upserted`)
      }
      ok++
    } catch (err) {
      fail++
      console.error(`${tag} ✗`, err.message ?? err)
    }
  }

  console.log(`\nDone. ${ok} ok, ${fail} failed.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
