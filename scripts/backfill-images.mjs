/**
 * Backfill destinations.image_url from Wikipedia REST API.
 * Free, no auth, returns Commons-licensed images.
 *
 * Usage:
 *   node scripts/backfill-images.mjs              # all rows missing image
 *   node scripts/backfill-images.mjs --force      # re-fetch even if already set
 *   node scripts/backfill-images.mjs --limit=10   # test batch
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const LIMIT       = args.limit ? Number(args.limit) : Infinity
const FORCE       = Boolean(args.force)
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 6

async function wikiImage(title, country) {
  const queries = [`${title}`, `${title}, ${country}`]
  for (const q of queries) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { 'User-Agent': 'crazy4points/1.0 (jillzeller6@gmail.com)' } })
      if (!res.ok) continue
      const j = await res.json()
      if (j.type === 'disambiguation') continue
      const src = j.originalimage?.source || j.thumbnail?.source
      if (src) return src
    } catch {}
  }
  return null
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase env vars missing.')
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  let query = supabase.from('destinations').select('slug, title, country, image_url')
  if (!FORCE) query = query.is('image_url', null)
  const { data, error } = await query
  if (error) throw error

  const todo = (data ?? []).slice(0, LIMIT)
  console.log(`→ ${todo.length} destinations to backfill`)

  let ok = 0, miss = 0, fail = 0
  let cursor = 0
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const i = cursor++
      if (i >= todo.length) return
      const row = todo[i]
      const tag = `[${i + 1}/${todo.length}] ${row.title}`
      try {
        const image = await wikiImage(row.title, row.country)
        if (!image) { miss++; console.log(`${tag} — no image`); continue }
        const { error } = await supabase.from('destinations').update({ image_url: image }).eq('slug', row.slug)
        if (error) throw error
        ok++
        console.log(`${tag} ✓`)
      } catch (err) {
        fail++
        console.error(`${tag} ✗ ${err.message ?? err}`)
      }
    }
  })
  await Promise.all(workers)

  console.log(`\nDone. ${ok} ok, ${miss} no-image, ${fail} failed.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
