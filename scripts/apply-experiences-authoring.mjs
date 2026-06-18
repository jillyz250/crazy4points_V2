#!/usr/bin/env node
/**
 * Apply workflow-authored experiences content to the experiences table.
 * Source of truth: scripts/data/experiences-authored.json (researched + authored
 * by the author-experiences workflow, 2026-06-18). Updates editorial + structured
 * fields by slug; leaves name/parent/mode/currency/official_url as seeded.
 * ASCII-sanitizes strings. This is the canonical content, NOT the draft prose in
 * seed-experiences.mjs (which only seeds rows + the immutable fields).
 *
 * Run: set -a; . ./.env.local; set +a; node scripts/apply-experiences-authoring.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const V = '2026-06-18'

function ascii(s) {
  if (typeof s !== 'string') return s
  return s
    .replace(/[—–]/g, ' - ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}
function asciiDeep(v) {
  if (typeof v === 'string') return ascii(v)
  if (Array.isArray(v)) return v.map(asciiDeep)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, asciiDeep(x)]))
  return v
}

const TEXT = ['intro', 'what_you_get', 'how_it_works', 'how_to_access', 'standout_examples', 'good_to_know', 'value_take', 'entry_point_label', 'refundable', 'inventory_style']
const ARR = ['experience_types', 'pricing_models', 'requires_card', 'source_urls']

const here = dirname(fileURLToPath(import.meta.url))
const rows = JSON.parse(readFileSync(join(here, 'data', 'experiences-authored.json'), 'utf8'))

async function main() {
  let ok = 0
  for (const r of rows) {
    const upd = { last_verified: V, updated_at: new Date().toISOString() }
    for (const f of TEXT) if (r[f] != null) upd[f] = ascii(r[f])
    for (const f of ARR) if (Array.isArray(r[f])) upd[f] = r[f].map(ascii)
    if ('min_points' in r) upd.min_points = r.min_points
    if (Array.isArray(r.featured_events)) upd.featured_events = asciiDeep(r.featured_events)
    const { error } = await sb.from('experiences').update(upd).eq('slug', r.slug)
    if (error) { console.error(`FAIL ${r.slug}: ${error.message}`); continue }
    ok++
  }
  console.log(`Applied authored content to ${ok}/${rows.length} experiences.`)
}
main()
