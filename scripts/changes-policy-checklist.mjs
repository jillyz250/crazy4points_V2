#!/usr/bin/env node
/**
 * changes-policy-checklist — the running list of airlines for the daily
 * Changes/Cancellations authoring (ritual Phase 11). Self-updating: a page is
 * "done" the moment it has a `changes_policy`, so there's no manual checkoff to
 * drift (Jill, 2026-09-02: "make a list and go down it each day"). Run it in
 * Phase 11, author the NEXT-UP (first pending in priority order), and tomorrow it
 * checks off on its own.
 *
 * Usage:  node scripts/changes-policy-checklist.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Author in this order (biggest US-audience programs first); everything else
// follows alphabetically after the priority block.
const PRIORITY = [
  'united', 'delta', 'aa', 'alaska', 'aeroplan', 'british-airways', 'ana', 'cathay',
  'emirates', 'turkish', 'krisflyer', 'virgin-atlantic', 'avianca', 'flying-blue',
  'jetblue', 'southwest', 'air-canada', 'iberia', 'qantas', 'lifemiles',
]

const { data } = await db.from('programs').select('slug, name, changes_policy, faq').eq('type', 'airline')
const rows = data || []
const done = (p) => p.changes_policy && String(p.changes_policy).trim().length > 20
const byslug = new Map(rows.map((p) => [p.slug, p]))

const ordered = [
  ...PRIORITY.map((s) => byslug.get(s)).filter(Boolean),
  ...rows.filter((p) => !PRIORITY.includes(p.slug)).sort((a, b) => a.slug.localeCompare(b.slug)),
]

const doneCount = rows.filter(done).length
console.log(`CHANGES/CANCELLATIONS CHECKLIST — ${doneCount}/${rows.length} airlines done\n`)
let nextUp = null
for (const p of ordered) {
  const d = done(p)
  const faqN = Array.isArray(p.faq) ? p.faq.length : 0
  const mark = d ? '✅' : '☐ '
  const star = !d && !nextUp ? '  ⬅ NEXT UP' : ''
  if (!d && !nextUp) nextUp = p.slug
  console.log(`  ${mark} ${p.slug.padEnd(20)} ${d ? `(${faqN} FAQ)` : ''}${star}`)
}
console.log(`\n-> Author "${nextUp}" next. It checks off automatically once its changes_policy is saved.`)
