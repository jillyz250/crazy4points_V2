#!/usr/bin/env node
// READ-ONLY: daily intel_items ingest volume (last 14 days) + how many end undecided.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
for (const p of [join(process.cwd(), '.env.local'), join(process.cwd(), '../../../.env.local')]) {
  try { for (const l of readFileSync(p, 'utf8').split('\n')) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1') } } catch {}
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const now = Date.now()
console.log('day        ingested  still_undecided')
for (let d = 0; d < 14; d++) {
  const lo = new Date(now - (d + 1) * 86400000).toISOString()
  const hi = new Date(now - d * 86400000).toISOString()
  const { count: ingested } = await sb.from('intel_items').select('id', { count: 'exact', head: true }).gte('created_at', lo).lt('created_at', hi)
  const { count: undecided } = await sb.from('intel_items').select('id', { count: 'exact', head: true }).gte('created_at', lo).lt('created_at', hi).is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  console.log(`${lo.slice(0, 10)}   ${String(ingested).padStart(6)}   ${String(undecided).padStart(6)}`)
}
process.exit(0)
