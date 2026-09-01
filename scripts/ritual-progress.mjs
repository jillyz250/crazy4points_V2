#!/usr/bin/env node
/**
 * ritual-progress — persist + resume daily-ritual progress across sessions.
 * The ritual is long (25 phases, 26 Thu) and often stops mid-way; this makes it
 * resumable so the next session picks up where the last one left off instead of
 * restarting (Jill, 2026-09-01). Backed by the ritual_progress table (mig 647).
 *
 * Usage:
 *   node scripts/ritual-progress.mjs                 # status (default)
 *   node scripts/ritual-progress.mjs --status
 *   node scripts/ritual-progress.mjs --complete 11 --note "stopped for the day"
 *   node scripts/ritual-progress.mjs --finish        # mark whole ritual done
 *   node scripts/ritual-progress.mjs --reset         # clear today, start over
 * The daily-ritual skill runs --status at the start and --complete N after each
 * phase receipt.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TOTAL = () => {
  // 25 phases; 26 on Thursdays (Newsletter build inserts one). ET day.
  const dow = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' })
  return dow === 'Thu' ? 26 : 25
}
const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
const nowIso = () => new Date().toISOString()

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }

async function getRow(date) {
  const { data } = await db.from('ritual_progress').select('*').eq('ritual_date', date).maybeSingle()
  return data
}
async function latestBefore(date) {
  const { data } = await db.from('ritual_progress').select('*').lt('ritual_date', date)
    .order('ritual_date', { ascending: false }).limit(1)
  return (data && data[0]) || null
}

async function status() {
  const date = todayET()
  const row = await getRow(date)
  const total = TOTAL()
  if (!row) {
    const prev = await latestBefore(date)
    console.log(`RITUAL ${date}: not started today.`)
    if (prev) {
      const done = prev.completed_at ? 'completed' : `reached Phase ${prev.last_phase}`
      console.log(`  Last session (${prev.ritual_date}) ${done}${!prev.completed_at ? ' — the back-half phases may have been starved; consider prioritizing them today.' : ''}`)
    }
    console.log(`  -> Start fresh at Phase 1 (of ${total}). Run --complete N after each phase.`)
    return
  }
  if (row.completed_at) {
    console.log(`RITUAL ${date}: COMPLETE (finished ${row.completed_at.slice(11, 16)} UTC). All ${row.last_phase} phases done.`)
    return
  }
  const doneList = (row.completed || []).map((c) => c.phase).join(', ')
  console.log(`RITUAL ${date}: IN PROGRESS — last completed Phase ${row.last_phase} of ${total}.`)
  console.log(`  Completed: ${doneList || '(none)'}`)
  console.log(`  -> RESUME at Phase ${row.last_phase + 1}. (Or say "start fresh" to redo from Phase 1.)`)
}

async function complete(n) {
  const phase = parseInt(n, 10)
  if (!Number.isFinite(phase) || phase < 1) { console.error('--complete needs a phase number'); process.exit(1) }
  const date = todayET()
  const note = val('--note') || null
  const row = await getRow(date)
  const entry = { phase, note, at: nowIso() }
  if (!row) {
    await db.from('ritual_progress').insert({ ritual_date: date, last_phase: phase, completed: [entry], updated_at: nowIso() })
  } else {
    const completed = [...(row.completed || []).filter((c) => c.phase !== phase), entry]
    await db.from('ritual_progress').update({
      last_phase: Math.max(row.last_phase || 0, phase),
      completed,
      updated_at: nowIso(),
    }).eq('ritual_date', date)
  }
  console.log(`marked Phase ${phase} complete for ${date}.`)
}

async function finish() {
  const date = todayET()
  const row = await getRow(date)
  if (!row) { console.log('no ritual row today to finish.'); return }
  await db.from('ritual_progress').update({ completed_at: nowIso(), updated_at: nowIso() }).eq('ritual_date', date)
  console.log(`ritual ${date} marked COMPLETE.`)
}

async function reset() {
  const date = todayET()
  await db.from('ritual_progress').delete().eq('ritual_date', date)
  console.log(`ritual ${date} reset (row deleted).`)
}

if (has('--complete')) await complete(val('--complete'))
else if (has('--finish')) await finish()
else if (has('--reset')) await reset()
else await status()
