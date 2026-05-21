import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { buildBriefEmail } from '@/utils/ai/briefEmail'
import type { BriefFinding } from '@/utils/ai/briefEmail'
import {
  generateEditorialPlan,
  type PlanIntelItem,
} from '@/utils/ai/generateEditorialPlan'
import type { WriteDraftProgram } from '@/utils/ai/writeAlertDraft'
import { detectConflict } from '@/utils/ai/detectConflict'
import type { ApproveMeta } from '@/utils/ai/briefEmail'
import { logSystemError } from '@/utils/supabase/queries'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'
// writeEditCheck / verifyAlertDraft / webVerifyClaims / reviseAlertDraft /
// buildExtraContext / loadAllianceContextForPrograms etc. are no longer
// imported here — the auto-write loop was removed in the May 2026 triage
// refactor. Those functions are now invoked on demand from /admin/triage
// → writeAlertFromCandidate server action.

const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [intelRes, recentAlertsView, programsRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs, expires_at, conflict_detected_at')
      .gte('created_at', since24h)
      .is('rejected_at', null)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false }),
    // Phase 3 Wave 2 flip #3: voice samples now read from variants.
    // selectAlertViewFromVariants returns Alert-shape rows ordered by
    // published_at desc; activeOnly excludes formerly-expired alerts to
    // match the legacy `status='published'` behavior. since30d filter
    // applied client-side because the adapter doesn't take a date range.
    selectAlertViewFromVariants(supabase, { status: 'published', activeOnly: true, limit: 12 }),
    supabase.from('programs').select('id, slug, name, type'),
  ])

  const recentRes = {
    data: recentAlertsView
      .filter((a) => a.published_at && a.published_at >= since30d)
      .slice(0, 3)
      .map((a) => ({ id: a.id, title: a.title, summary: a.summary, published_at: a.published_at })),
    error: null,
  }

  if (intelRes.error) {
    console.error('[build-brief] intel_items fetch failed:', intelRes.error)
    return NextResponse.json({ error: 'DB error (intel)' }, { status: 500 })
  }
  if (recentRes.error) {
    console.error('[build-brief] recent alerts fetch failed:', recentRes.error)
    return NextResponse.json({ error: 'DB error (alerts)' }, { status: 500 })
  }
  if (programsRes.error) {
    console.error('[build-brief] programs fetch failed:', programsRes.error)
    return NextResponse.json({ error: 'DB error (programs)' }, { status: 500 })
  }

  const allItems = intelRes.data ?? []
  const recentAlertRows = recentRes.data ?? []

  // Filter out intel items whose deal has already expired — they shouldn't
  // clutter the Scout brief or get approved. The program archive page is the
  // permanent home for expired offers.
  const nowTs = Date.now()
  const items = allItems.filter((row) => {
    const exp = row.expires_at as string | null
    if (!exp) return true
    const t = new Date(exp).getTime()
    if (isNaN(t)) return true
    return t >= nowTs
  })
  const droppedExpired = allItems.length - items.length
  if (droppedExpired > 0) {
    console.log(`[build-brief] dropped ${droppedExpired} expired intel item(s) before Sonnet`)
  }

  // Phase B: conflict detection. Run Haiku on each non-expired intel item
  // that hasn't been checked yet, against any linked program pages, to flag
  // claims that contradict the program reference content. Sequential to
  // keep cost predictable and avoid rate limits. Best-effort — errors here
  // do not block the brief generation.
  const itemsNeedingConflictCheck = items.filter(
    (r) => !r.conflict_detected_at && Array.isArray(r.programs) && r.programs.length > 0
  )
  let conflictsFound = 0
  if (itemsNeedingConflictCheck.length > 0) {
    console.log(`[build-brief] running conflict detection on ${itemsNeedingConflictCheck.length} intel item(s)`)
    for (const row of itemsNeedingConflictCheck) {
      try {
        const result = await detectConflict(supabase, {
          id: row.id as string,
          headline: row.headline as string,
          raw_text: (row.raw_text as string | null) ?? null,
          programs: (row.programs as string[] | null) ?? null,
        })
        const updates: Record<string, unknown> = { conflict_detected_at: new Date().toISOString() }
        if (result) {
          conflictsFound++
          updates.conflicts_program_id = result.conflicts_program_id
          updates.conflict_field = result.conflict_field
          updates.conflict_summary = result.conflict_summary
          updates.conflict_intel_claim = result.conflict_intel_claim
          updates.conflict_program_text = result.conflict_program_text
        }
        await supabase.from('intel_items').update(updates).eq('id', row.id)
      } catch (err) {
        console.warn(`[build-brief] conflict detection failed for ${row.id}:`, err)
      }
    }
    console.log(`[build-brief] conflict detection complete: ${conflictsFound} conflict(s) flagged`)
  }

  // Findings for the Today's Intel section (unchanged shape)
  const findings: BriefFinding[] = items.map((row) => ({
    intel_id: row.id as string,
    headline: row.headline,
    raw_text: row.raw_text,
    source_name: row.source_name,
    source_url: row.source_url,
    confidence: row.confidence as 'high' | 'medium' | 'low',
    alert_type: row.alert_type,
    programs: row.programs,
  }))

  // Inputs for Sonnet
  const todayIntel: PlanIntelItem[] = items.map((r) => ({
    intel_id: r.id as string,
    headline: r.headline,
    source_name: r.source_name,
    source_url: r.source_url,
    confidence: r.confidence as 'high' | 'medium' | 'low',
    alert_type: r.alert_type,
    programs: r.programs,
    raw_text: r.raw_text,
  }))

  // Voice samples — recently published alerts Sonnet should match in tone
  const voiceSamples = recentAlertRows.slice(0, 3).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  // Existing blog ideas to dedupe against — passed to the planner so it doesn't propose
  // duplicates. Two buckets:
  //   1. Open queue (status: new | queued | drafted) — anything not yet published.
  //   2. Recently published (last 90 days) — so we don't immediately re-pitch what we just shipped.
  // Older published articles are intentionally excluded so periodic "refresh" content (e.g.
  // updating a 2024 sweet-spots post for 2026) is still allowed.
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000
  const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS).toISOString()

  const [openIdeasResult, recentPublishedResult] = await Promise.all([
    supabase
      .from('content_ideas')
      .select('title')
      .eq('type', 'blog')
      .in('status', ['new', 'idea_bank'])
      .order('created_at', { ascending: false })
      .limit(150),
    supabase
      .from('content_ideas')
      .select('title')
      .eq('type', 'blog')
      .eq('status', 'published')
      .gte('published_at', ninetyDaysAgo)
      .order('published_at', { ascending: false })
      .limit(50),
  ])

  const existingOpenBlogIdeas = [
    ...((openIdeasResult.data ?? []) as { title: string | null }[]),
    ...((recentPublishedResult.data ?? []) as { title: string | null }[]),
  ]
    .map((r) => r.title ?? '')
    .filter((t) => t.length > 0)

  // Call Sonnet (best-effort — if it fails, fall back to the old layout)
  const plan = await generateEditorialPlan({
    today_intel: todayIntel,
    voice_samples: voiceSamples,
    existing_open_blog_ideas: existingOpenBlogIdeas,
  })

  // Persist the brief — even on plan failure, so actions log still works (empty plan)
  let briefId: string | undefined
  if (plan) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: inserted, error: insertErr } = await supabase
      .from('daily_briefs')
      .upsert(
        {
          brief_date: today,
          editorial_plan: plan,
          intel_count: findings.length,
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'brief_date' }
      )
      .select('id')
      .single()

    if (insertErr) {
      console.error('[build-brief] daily_briefs insert failed:', insertErr)
    } else {
      briefId = inserted?.id as string | undefined
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // TRIAGE MODE (May 2026) — the expensive auto-write loop is GONE.
  // ──────────────────────────────────────────────────────────────────────
  // Previously this route ran the full write → edit → voice-check →
  // fact-check → web-verify → revise pipeline for every approved item
  // (~3-5 API calls per item × 5-10 approved items = the daily 20-30 call
  // spike).
  //
  // New model: persist the planner's approve/reject decisions on
  // intel_items.triage_decision and STOP. Editor reviews candidates in
  // /admin/triage and clicks "Write this" on items she actually wants.
  // That click runs the same writeEditCheck pipeline, but on demand.
  //
  // All the per-item write-loop variables below are kept (zeroed) so the
  // response shape doesn't change and downstream consumers don't break.
  const allPrograms = (programsRes.data ?? []) as WriteDraftProgram[]
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const intelById = new Map(items.map((i) => [i.id as string, i]))

  const alertIdByIntelId: Record<string, string> = {}
  const approveMetaByIntelId: Record<string, ApproveMeta> = {}

  // Persist triage decisions to intel_items so the /admin/triage inbox can
  // show "what the planner approved, ready for you to write" + reasoning.
  let triage_decisions_persisted = 0
  if (plan) {
    const triageUpdates: Array<{ intel_id: string; decision: string; reasoning: string }> = []
    for (const a of plan.approve) {
      triageUpdates.push({ intel_id: a.intel_id, decision: 'approved', reasoning: a.why_publish ?? '' })
    }
    for (const r of plan.reject) {
      triageUpdates.push({ intel_id: r.intel_id, decision: 'rejected', reasoning: r.why_reject ?? '' })
    }
    for (const b of plan.newsletter_candidates ?? []) {
      triageUpdates.push({ intel_id: b.intel_id, decision: 'newsletter_idea', reasoning: b.angle ?? '' })
    }
    // blog_ideas have no intel_id binding in the current schema; skip them.

    for (const u of triageUpdates) {
      const { error } = await supabase
        .from('intel_items')
        .update({
          triage_decision: u.decision,
          triage_reasoning: u.reasoning.slice(0, 1000),
          triage_decided_at: new Date().toISOString(),
        })
        .eq('id', u.intel_id)
      if (!error) triage_decisions_persisted++
    }
  }

  // Seed approveMetaByIntelId so the brief email still renders deadline /
  // program / source chips for each approved candidate (no alertId yet —
  // the editor will create one via the triage page).
  if (plan && plan.approve.length) {
    const recentSamples = voiceSamples

    for (const a of plan.approve) {
      const intel = intelById.get(a.intel_id)
      if (!intel) continue

      // Seed meta from the raw intel so badges + deadline chip render even if
      // the writer call or pending-alert lookup later fails.
      const intelSlugs = (intel.programs as string[] | null) ?? []
      const seedPrograms = intelSlugs
        .map((slug) => {
          const p = programBySlug.get(slug)
          return p ? { name: p.name, slug: p.slug } : null
        })
        .filter((x): x is { name: string; slug: string } => x !== null)
      approveMetaByIntelId[intel.id as string] = {
        endDate: (intel.expires_at as string | null) ?? null,
        programNames: seedPrograms.map((p) => p.name),
        programs: seedPrograms,
        sourceName: (intel.source_name as string | null) ?? null,
        sourceUrl: (intel.source_url as string | null) ?? null,
      }

      // Also try to resolve the staged alert id up-front so Review & Publish
      // links survive even when the writer call itself fails.
      //
      // Phase 3 Wave 2 flip #4: read from content_variants + topics. The
      // dual-write trigger (migration 321) preserves source_intel_id on
      // topic.metadata, computed_score on topic.metadata.editorial_scores,
      // and the original alert id on topic.metadata.original_alert_id.
      {
        const { data: existingTopicRow } = await supabase
          .from('topics')
          .select('metadata')
          .eq('metadata->>source_intel_id', intel.id as string)
          .eq('status', 'active')
          .maybeSingle()
        const topicMeta = (existingTopicRow?.metadata ?? null) as {
          original_alert_id?: string
          editorial_scores?: { computed_score?: number | null }
        } | null
        const alertId = topicMeta?.original_alert_id ?? null
        if (alertId) {
          alertIdByIntelId[intel.id as string] = alertId
          approveMetaByIntelId[intel.id as string].alertId = alertId
          approveMetaByIntelId[intel.id as string].computedScore =
            topicMeta?.editorial_scores?.computed_score ?? null
        }
      }

    }
  }

  // Persist content ideas (blog_ideas + newsletter_candidates) for the admin pipeline
  let content_ideas_inserted = 0
  if (plan && briefId) {
    const rows: Array<Record<string, unknown>> = []

    for (const b of plan.blog_ideas) {
      rows.push({
        type: 'blog',
        title: b.title,
        pitch: b.pitch,
        source: 'editorial_plan',
        source_brief_id: briefId,
      })
    }

    for (const c of plan.newsletter_candidates ?? []) {
      rows.push({
        type: 'newsletter',
        title: c.headline,
        pitch: c.angle,
        source: 'editorial_plan',
        source_brief_id: briefId,
        source_intel_id: c.intel_id,
        source_alert_id: alertIdByIntelId[c.intel_id] ?? null,
      })
    }

    // Insert one at a time so a dedupe conflict on one row doesn't abort the others
    for (const row of rows) {
      const { error: ideasErr } = await supabase.from('content_ideas').insert(row)
      if (!ideasErr) {
        content_ideas_inserted++
      } else if (ideasErr.code !== '23505') {
        console.warn('[build-brief] content_idea insert failed:', ideasErr.message)
      }
    }
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const html = buildBriefEmail(findings, date, {
    plan: briefId ? plan : null,
    briefId,
    siteOrigin: 'https://www.crazy4points.com',
    alertIdByIntelId,
    approveMetaByIntelId,
    // Revise loop no longer runs in build-brief (triage refactor). Counters
    // zeroed so the existing buildBriefEmail signature still satisfies.
    reviseCounters: { run: 0, succeeded: 0, failed: 0, resolved: 0, persistent: 0 },
  })

  // Persist the rendered HTML so admin can preview a brief in-app without
  // re-running the pipeline or relying on Resend delivery.
  if (briefId) {
    const { error: htmlErr } = await supabase
      .from('daily_briefs')
      .update({ brief_html: html })
      .eq('id', briefId)
    if (htmlErr) console.error('[build-brief] brief_html update failed:', htmlErr)
  }

  // Email send removed in Phase 1 — brief is read in /admin/briefs instead.
  // Keeps build-brief well under the Vercel timeout budget and removes the
  // Resend domain-verification dependency. ?email=1 forces a send if needed
  // for a one-off test (kept as escape hatch).
  let emailSent = false
  if (req.nextUrl.searchParams.get('email') === '1') {
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
      to: process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com',
      subject: `Crazy4Points Daily Brief — ${date}`,
      html,
    })
    if (emailError) {
      console.error('[build-brief] Resend error (manual email=1 send):', emailError)
    } else {
      emailSent = true
    }
  }

  const approve_count = plan?.approve.length ?? 0
  const reject_count = plan?.reject.length ?? 0
  if (approve_count || reject_count) {
    console.log(
      `[build-brief] triage stats — approves=${approve_count} rejects=${reject_count} persisted=${triage_decisions_persisted}`
    )
  }

  return NextResponse.json({
    findings_in_brief: findings.length,
    brief_id: briefId ?? null,
    plan_generated: plan !== null,
    triage_stats: {
      approve_count,
      reject_count,
      newsletter_idea_count: plan?.newsletter_candidates?.length ?? 0,
      decisions_persisted: triage_decisions_persisted,
    },
    content_ideas_inserted,
    email_sent: emailSent,
    date,
    // Auto-write removed; per-item writes happen on demand at /admin/triage.
    // Keys preserved for downstream consumers (set to 0 / null).
    drafts_written: 0,
    writer_stats: { approve_count, drafts_written: 0, null_drafts: 0, no_pending_alert: 0, update_errors: 0, success_rate: null },
    editor_stats: { run: 0, null: 0 },
    fact_check_stats: { run: 0, flagged_high_severity: 0, web_verify_runs: 0, web_likely_wrong: 0, revisions_run: 0, revisions_succeeded: 0, revisions_failed: 0, revisions_resolved: 0, revisions_persistent: 0 },
  })
  } catch (err) {
    await logSystemError(supabase, 'brief', err)
    throw err
  }
}
