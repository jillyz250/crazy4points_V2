#!/usr/bin/env node
/**
 * employee-brief — a head's morning-brief DATA, per employee (Jill 2026-09-02).
 *
 * ONE reusable rail: `node scripts/employee-brief.mjs <slug>` dumps THAT head's
 * domain queues as clean structured JSON. The head-agent reads it and narrates a
 * tight brief in their voice, ending with their phase-slice (see the
 * `employee-brief` skill). Data lives in code (accurate, matches the ritual's
 * own queries); judgment lives in the agent.
 *
 * Piloted with Kesha 2026-09-02 and approved. Queue definitions are copied from
 * scripts/morning-snapshot.mjs so a brief can never disagree with the ritual.
 * Thin heads (charlie/erica/megan) have no structured daily queue yet → they
 * return a "quiet" brief honestly, rather than a fabricated one.
 *
 * Run: node scripts/employee-brief.mjs kesha-social
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const slug = process.argv[2]
if (!slug) { console.error('usage: node scripts/employee-brief.mjs <employee-slug>'); process.exit(1) }

const today = new Date().toISOString().slice(0, 10)
const nowIso = new Date().toISOString()
const in5 = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10)
const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)

async function safe(label, p) { try { return await p } catch (e) { console.error(`!! ${label}: ${e.message}`); return null } }
const cnt = async (label, build) => (await safe(label, build(db.select ? db : db)))?.count ?? null
const rows = async (label, p) => (await safe(label, p))?.data ?? []

// ── per-head configs — each returns a structured brief object ────────────────
const CONFIGS = {
  'kesha-social': async () => {
    const cal = await rows('calendar', db.from('social_calendar')
      .select('post_date, platform, topic, status, category, link_url').lte('post_date', in7)
      .order('post_date', { ascending: true }))
    const recommended = cal.filter((r) => r.status === 'suggested')
    const expCount = (await safe('exp count', db.from('experience_listings').select('*', { count: 'exact', head: true })
      .is('editorial_reviewed_at', null).eq('status', 'active')))?.count ?? null
    const expTop = await rows('exp top', db.from('experience_listings')
      .select('title, program_slug, event_date, featured, detail_url').is('editorial_reviewed_at', null).eq('status', 'active')
      .order('featured', { ascending: false }).order('event_date', { ascending: true, nullsFirst: false }).limit(5))
    const sweepCount = (await safe('sweep count', db.from('sweepstakes').select('*', { count: 'exact', head: true })
      .eq('status', 'running').is('reviewed_at', null)))?.count ?? null
    const sweepTop = await rows('sweep top', db.from('sweepstakes').select('prize, ends_at, mechanic, entry_url')
      .eq('status', 'running').is('reviewed_at', null).order('ends_at', { ascending: true, nullsFirst: false }).limit(5))
    const rems = await rows('reminders', db.from('reminders').select('title, status').ilike('title', 'Social post:%').neq('status', 'done').limit(20))
    const closings = await rows('closings', db.from('experience_listings').select('title, program_slug, event_date, detail_url')
      .eq('status', 'active').not('event_date', 'is', null).gte('event_date', today).lte('event_date', in5)
      .order('event_date', { ascending: true }).limit(6))
    return {
      social_calendar: { today: cal.filter((r) => r.post_date === today && r.status !== 'posted'),
        upcoming_week: cal.filter((r) => r.post_date > today && !['posted', 'suggested'].includes(r.status)),
        recommended_lane_count: recommended.length, recommended_sample: recommended.slice(0, 5) },
      experiences_to_review: { count: expCount, standouts: expTop },
      sweepstakes_to_review: { count: sweepCount, standouts: sweepTop },
      open_social_reminders: rems, closings_within_5d: closings,
    }
  },

  'john-content': async () => {
    const draftCount = (await safe('drafts', db.from('content_variants').select('id', { count: 'exact', head: true })
      .eq('status', 'needs_review').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)))?.count ?? null
    const draftTop = await rows('draft top', db.from('content_variants').select('title, status, created_at')
      .eq('status', 'needs_review').order('created_at', { ascending: false }).limit(5))
    const proseRows = await rows('prose review', db.from('credit_cards').select('slug, good_to_know_review_at')
      .not('good_to_know_review_at', 'is', null))
    const proseDue = proseRows.filter((r) => String(r.good_to_know_review_at).slice(0, 10) <= today)
    const faqRows = await rows('faq staleness', db.from('programs').select('slug, faq, content_updated_at, faq_reviewed_at').not('faq', 'is', null))
    const faqStale = faqRows.filter((r) => Array.isArray(r.faq) && r.faq.length > 0 && r.content_updated_at &&
      (!r.faq_reviewed_at || new Date(r.content_updated_at) > new Date(r.faq_reviewed_at)))
    const refreshQueue = (await safe('refresh queue', db.from('admin_refresh_queue').select('*', { count: 'exact', head: true })))?.count ?? null
    return {
      drafts_awaiting_review: { count: draftCount, standouts: draftTop },
      card_prose_review_due: { count: proseDue.length, sample: proseDue.slice(0, 5).map((r) => r.slug) },
      faqs_possibly_stale: { count: faqStale.length, sample: faqStale.slice(0, 5).map((r) => r.slug) },
      refresh_queue: { count: refreshQueue },
    }
  },

  'priya-sources': async () => {
    const intelCount = (await safe('intel', db.from('intel_items').select('id', { count: 'exact', head: true })
      .is('rejected_at', null).is('archived_at', null).is('alert_id', null).is('triage_decision', null)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`).or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)))?.count ?? null
    const oldest = await rows('oldest undecided', db.from('intel_items').select('created_at, headline')
      .is('rejected_at', null).is('archived_at', null).is('alert_id', null).is('triage_decision', null)
      .order('created_at', { ascending: true }).limit(1))
    const changeCount = (await safe('change signals', db.from('change_signals').select('id', { count: 'exact', head: true })
      .eq('status', 'new').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)))?.count ?? null
    const changeTop = await rows('change detail', db.from('change_signals').select('summary, program_slug, signal_type, source_name')
      .eq('status', 'new').order('created_at', { ascending: false }).limit(5))
    const bonusCount = (await safe('bonus signals', db.from('card_bonus_signals').select('id', { count: 'exact', head: true }).eq('status', 'new')))?.count ?? null
    const bonusTop = await rows('bonus detail', db.from('card_bonus_signals').select('card_name, summary, stored_amount, detected_amount')
      .eq('status', 'new').order('created_at', { ascending: false }).limit(5))
    const driftRows = await rows('drift', db.from('intel_items').select('headline, conflicts_program_id')
      .not('conflicts_program_id', 'is', null).is('conflict_resolution', null).is('archived_at', null).limit(10))
    return {
      intel_to_triage: { count: intelCount, oldest_undecided: oldest[0] || null },
      change_signals: { count: changeCount, standouts: changeTop },
      card_bonus_signals: { count: bonusCount, standouts: bonusTop },
      program_drift_unresolved: { count: driftRows.length, sample: driftRows.slice(0, 5) },
    }
  },

  'janet-growth': async () => {
    const subsActive = (await safe('subs active', db.from('subscribers').select('*', { count: 'exact', head: true }).eq('active', true)))?.count ?? null
    const subsTotal = (await safe('subs total', db.from('subscribers').select('*', { count: 'exact', head: true })))?.count ?? null
    const times = (await rows('sub times', db.from('subscribers').select('subscribed_at').not('subscribed_at', 'is', null)))
      .map((r) => Date.parse(r.subscribed_at)).filter((n) => !Number.isNaN(n))
    const nowMs = Date.now()
    const wk = (from, to) => times.filter((t) => t > from && t <= to).length
    const last7 = wk(nowMs - 7 * 864e5, nowMs), prev7 = wk(nowMs - 14 * 864e5, nowMs - 7 * 864e5)
    return {
      subscribers: { active: subsActive, total: subsTotal, signups_last_7d: last7, signups_prev_7d: prev7, delta: last7 - prev7 },
      analytics_note: 'GSC dashboard is live (Ana owns it). GA4 + Meta are next. Check /admin for top queries/pages.',
    }
  },

  'bill-security': async () => {
    const errCount = (await safe('errors', db.from('system_errors').select('*', { count: 'exact', head: true }).is('resolved_at', null)))?.count ?? null
    const errTop = await rows('error detail', db.from('system_errors').select('source, message, created_at')
      .is('resolved_at', null).order('created_at', { ascending: false }).limit(5))
    return {
      unresolved_errors: { count: errCount, standouts: errTop },
      posture_note: 'Daily posture check: RLS airtight, secrets locked, deps patched, backups mirrored in two places. Deep security pass Mondays; backup restore-drill monthly.',
    }
  },
}

// Thin heads: no structured daily queue yet — return a quiet, honest brief.
const THIN = {
  'charlie-legal': 'No structured legal queue yet. Watch: terms/privacy/disclosure changes, sweepstakes + email compliance, brand/trademark use. Flag anything that needs a review.',
  'erica-finance': 'No expense-tracking tool wired yet (assigned build). Watch: costs going OUT, runway. Once /admin/expenses exists this brief pulls real numbers.',
  'megan-partnerships': 'No structured partnerships pipeline yet. Watch: new affiliate/partnership opportunities to ACQUIRE (Janet then manages the revenue via Avery).',
}

async function main() {
  let data
  if (CONFIGS[slug]) data = await CONFIGS[slug]()
  else if (THIN[slug]) data = { quiet: true, watch: THIN[slug] }
  else { console.error(`no brief config for "${slug}" (known: ${[...Object.keys(CONFIGS), ...Object.keys(THIN)].join(', ')})`); process.exit(1) }
  console.log(JSON.stringify({ employee: slug, as_of: today, ...data }, null, 2))
}
main()
