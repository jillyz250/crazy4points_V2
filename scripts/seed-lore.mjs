#!/usr/bin/env node
/**
 * seed-lore — starter canon for the Breakroom (Jill, 2026-09-02). Idempotent by headline.
 * FIREWALLED: internal only, tasteful, never surfaces in published content. Run:
 * node scripts/seed-lore.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
}))
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const beats = [
  { lore_date: '2026-09-02', headline: 'Day one: the doors open', body: 'Jill founded crazy4points and started building the team that would actually run it. Ambitious for a Wednesday.', involves: ['jill', 'morgan'] },
  { lore_date: '2026-09-02', headline: 'Morgan takes the reins', body: "Jill's new right hand set up shop, dropped Bella at the on-site daycare down the hall, and within the hour was already telling everyone how it is. Nobody minded. That's why she's here.", involves: ['morgan'] },
  { lore_date: '2026-09-02', headline: "Kesha's first day", body: 'Fresh out of college, the new Head of Social crushed her very first assignment before lunch and is already trying to teach Jill words the kids are using. Confidence: unlimited.', involves: ['kesha'] },
  { lore_date: '2026-09-02', headline: 'Bill reports for duty', body: 'The former Marine with a Harvard cybersecurity degree joined to protect the company. The office got noticeably more secure. Janet, over in Growth, got noticeably more distracted.', involves: ['bill-security', 'janet-growth'] },
]
for (const b of beats) {
  const { data: exists } = await db.from('org_lore').select('id').eq('headline', b.headline).maybeSingle()
  if (!exists) await db.from('org_lore').insert(b)
}
const { data } = await db.from('org_lore').select('lore_date, headline').order('created_at')
console.log('BREAKROOM lore:'); for (const l of data || []) console.log(`  ${l.lore_date}  ${l.headline}`)
