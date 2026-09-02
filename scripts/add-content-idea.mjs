#!/usr/bin/env node
/**
 * Log a content/blog idea to `content_ideas` from the ritual (Phase 4/12) without
 * fighting the table's constraints (Jill, 2026-09-02: hit the NOT-NULL `type` and
 * the `source` CHECK by hand). Sets the fields the roadmap needs and marks it
 * reviewed so it lands in the pool ready to promote.
 *
 * Usage:
 *   node scripts/add-content-idea.mjs --title "How to Plan a Points Road Trip" \
 *     --pitch "..." --notes "..." --pillar trips --program marriott-bonvoy \
 *     --alert <source_alert_id>
 * Pillars: foundations|skills|programs|sweet-spots|trips|tricks. --type blog|newsletter (default blog).
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
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }

const title = val('--title')
if (!title) { console.error('need --title'); process.exit(1) }

const row = {
  type: val('--type') || 'blog',        // NOT NULL; blog | newsletter
  title,
  pitch: val('--pitch') || null,
  notes: val('--notes') || null,
  status: 'new',
  roadmap_pillar: val('--pillar') || null,
  roadmap_reviewed: true,
  primary_program_slug: val('--program') || null,
  source_alert_id: val('--alert') || null,
  source_intel_id: val('--intel') || null,
  // NOTE: `source` has a CHECK constraint (only 'editorial_plan' seen valid); omit
  // unless you know a valid value — a bad value aborts the insert.
}

const { data, error } = await db.from('content_ideas').insert(row).select('id,title,roadmap_pillar').single()
if (error) { console.error('insert failed:', error.message); process.exit(1) }
console.log(`logged idea: "${data.title}"${data.roadmap_pillar ? ` [${data.roadmap_pillar}]` : ''}`)
