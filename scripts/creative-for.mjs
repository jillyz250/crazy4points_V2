#!/usr/bin/env node
/**
 * creative-for — BEFORE generating a new social/campaign image, check whether the
 * library already has one (Jill, 2026-09-02: "how will you recommend when we already
 * have an image"). A cataloged creative is useless if nothing checks the catalog.
 *
 * Given a brand/topic (or an alert slug), it searches campaign_creatives and reports:
 *   - EXACT-REUSE candidates: same deal/evergreen -> post the existing PNG as-is.
 *   - PROMPT-REUSE candidates: same brand, different deal -> reuse the cataloged
 *     prompt, swap the numbers/date, regenerate (far faster than starting over).
 *
 * Usage:
 *   node scripts/creative-for.mjs wyndham
 *   node scripts/creative-for.mjs "summer of rewards"
 *   node scripts/creative-for.mjs --alert wyndham-summer-of-rewards-15k
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)

let query = args.filter((a) => !a.startsWith('--')).join(' ').trim()
const alertIdx = args.indexOf('--alert')
if (alertIdx >= 0) {
  const slug = args[alertIdx + 1]
  const { data: a } = await db.from('alerts').select('title').eq('short_slug', slug).maybeSingle()
  // derive a brand token from the alert title (first strong word)
  query = (a?.title || slug).split(/[\s:]+/).find((w) => w.length > 3) || slug
  console.log(`(from alert "${slug}" -> searching library for "${query}")\n`)
}
if (!query) { console.log('usage: creative-for.mjs <brand/topic>  |  --alert <slug>'); process.exit(1) }

const { data, error } = await db.from('campaign_creatives')
  .select('name, event, category, image_url, used_on, prompt, created_at')
  .or(`name.ilike.%${query}%,event.ilike.%${query}%`)
  .order('created_at', { ascending: false })
if (error) { console.log('!! QUERY PROBLEM:', error.message); process.exit(1) }

if (!data?.length) {
  console.log(`No existing creative for "${query}". -> Generate a NEW one (write a fresh Copilot prompt; include the brand NAME as on-image text, not the logo).`)
  process.exit(0)
}

console.log(`FOUND ${data.length} existing creative(s) for "${query}" — recommend REUSE before generating:\n`)
for (const c of data) {
  // A creative naming a specific number/date is deal-specific (exact-reuse only for the SAME deal).
  const dealSpecific = /\b(\d[\d,]{2,}|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})\b/i.test(c.event || c.name || '')
  console.log(`  • ${c.name}`)
  console.log(`    image: ${c.image_url}  (used: ${c.used_on || 'not yet'})`)
  console.log(`    ${dealSpecific ? 'DEAL-SPECIFIC -> EXACT-reuse only if it is the SAME deal; otherwise reuse the PROMPT + swap numbers/date' : 'EVERGREEN -> safe to reuse the image as-is'}`)
  console.log(`    prompt: ${(c.prompt || '(none)').slice(0, 160)}...\n`)
}
console.log('-> If a match fits, RECOMMEND reusing it (image or prompt) instead of generating from scratch.')
