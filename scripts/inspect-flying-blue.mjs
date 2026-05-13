#!/usr/bin/env node
// One-off: pull the current flying_blue programs row and dump each field
// so we can plan the carrier-vs-program content split.

import { readFileSync } from 'node:fs'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

const url = new URL(`${supabaseUrl}/rest/v1/programs`)
url.searchParams.set('slug', 'eq.flying_blue')
url.searchParams.set('select', '*')

const res = await fetch(url, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
})
if (!res.ok) {
  console.error(`${res.status}: ${await res.text()}`)
  process.exit(1)
}
const rows = await res.json()
if (rows.length === 0) {
  console.error('flying_blue row not found')
  process.exit(1)
}
const r = rows[0]

console.log('=== flying_blue (current state) ===\n')
console.log('slug:', r.slug)
console.log('name:', r.name)
console.log('alliance:', r.alliance)
console.log('hubs:', JSON.stringify(r.hubs))
console.log('content_updated_at:', r.content_updated_at)
console.log('\n--- intro ---')
console.log(r.intro ?? '(empty)')
console.log('\n--- transfer_partners ---')
console.log(JSON.stringify(r.transfer_partners, null, 2))
console.log('\n--- how_to_spend ---')
console.log(r.how_to_spend ?? '(empty)')
console.log('\n--- sweet_spots ---')
console.log(r.sweet_spots ?? '(empty)')
console.log('\n--- tier_benefits ---')
console.log(JSON.stringify(r.tier_benefits, null, 2))
console.log('\n--- lounge_access ---')
console.log(r.lounge_access ?? '(empty)')
console.log('\n--- quirks ---')
console.log(r.quirks ?? '(empty)')
console.log('\n--- award_chart ---')
console.log(r.award_chart ?? '(empty)')
