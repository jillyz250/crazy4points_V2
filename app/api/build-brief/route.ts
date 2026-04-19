import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { buildBriefEmail } from '@/utils/ai/briefEmail'
import type { BriefFinding } from '@/utils/ai/briefEmail'
import {
  generateEditorialPlan,
  type PlanIntelItem,
  type PlanRecentAlert,
  type PlanHomepageSlot,
} from '@/utils/ai/generateEditorialPlan'
import { writeAlertDraft, type WriteDraftProgram } from '@/utils/ai/writeAlertDraft'
import { verifyAlertDraft, highSeverityUnsupported } from '@/utils/ai/verifyAlertDraft'
import type { ApproveMeta } from '@/utils/ai/briefEmail'
import { updateAlert, setAlertPrograms } from '@/utils/supabase/queries'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [intelRes, recentRes, slotsRes, programsRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs, expires_at')
      .gte('created_at', since24h)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('id, title, summary, type, primary_program_id, published_at, end_date, alert_programs(program_id)')
      .eq('status', 'published')
      .gte('published_at', since30d)
      .order('published_at', { ascending: false }),
    supabase
      .from('homepage_slots')
      .select('slot_number, alert_id, alerts(id, title, end_date)')
      .order('slot_number', { ascending: true }),
    supabase.from('programs').select('id, slug, name, type'),
  ])

  if (intelRes.error) {
    console.error('[build-brief] intel_items fetch failed:', intelRes.error)
    return NextResponse.json({ error: 'DB error (intel)' }, { status: 500 })
  }
  if (recentRes.error) {
    console.error('[build-brief] recent alerts fetch failed:', recentRes.error)
    return NextResponse.json({ error: 'DB error (alerts)' }, { status: 500 })
  }
  if (slotsRes.error) {
    console.error('[build-brief] homepage_slots fetch failed:', slotsRes.error)
    return NextResponse.json({ error: 'DB error (slots)' }, { status: 500 })
  }
  if (programsRes.error) {
    console.error('[build-brief] programs fetch failed:', programsRes.error)
    return NextResponse.json({ error: 'DB error (programs)' }, { status: 500 })
  }

  const items = intelRes.data ?? []
  const recentAlertRows = recentRes.data ?? []
  const slots = slotsRes.data ?? []

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

  const recentAlerts: PlanRecentAlert[] = recentAlertRows.map((r) => {
    const programIds = [
      ...(r.primary_program_id ? [r.primary_program_id as string] : []),
      ...((r.alert_programs ?? []) as { program_id: string }[]).map((ap) => ap.program_id),
    ]
    return {
      id: r.id as string,
      title: r.title as string,
      type: r.type as string,
      programs: Array.from(new Set(programIds)),
      published_at: r.published_at as string | null,
      end_date: r.end_date as string | null,
    }
  })

  const recentAlertsById: Record<string, { id: string; title: string; type: string; end_date: string | null }> = {}
  for (const a of recentAlerts) {
    recentAlertsById[a.id] = { id: a.id, title: a.title, type: a.type, end_date: a.end_date }
  }

  const homepageSlots: PlanHomepageSlot[] = [1, 2, 3, 4].map((n) => {
    const row = slots.find((s) => s.slot_number === n)
    const joinedRaw = row?.alerts as unknown
    const joined = Array.isArray(joinedRaw)
      ? ((joinedRaw[0] as { id: string; title: string; end_date: string | null } | undefined) ?? null)
      : ((joinedRaw as { id: string; title: string; end_date: string | null } | null) ?? null)
    return {
      slot: n as 1 | 2 | 3 | 4,
      current_alert_id: (row?.alert_id as string | null) ?? null,
      current_title: joined?.title ?? null,
      end_date: joined?.end_date ?? null,
    }
  })

  // Also include current slot alerts in the lookup map so the email can show titles
  for (const s of homepageSlots) {
    if (s.current_alert_id && !recentAlertsById[s.current_alert_id]) {
      recentAlertsById[s.current_alert_id] = {
        id: s.current_alert_id,
        title: s.current_title ?? '(untitled)',
        type: 'unknown',
        end_date: s.end_date,
      }
    }
  }

  // Voice samples — recently published alerts Sonnet should match in tone
  const voiceSamples = recentAlertRows.slice(0, 3).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  // Call Sonnet (best-effort — if it fails, fall back to the old layout)
  const plan = await generateEditorialPlan({
    today_intel: todayIntel,
    recent_alerts: recentAlerts,
    homepage_slots: homepageSlots,
    voice_samples: voiceSamples,
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

  // Writer pass — for every approve-recommended intel, polish the pending_review alert
  const allPrograms = (programsRes.data ?? []) as WriteDraftProgram[]
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const intelById = new Map(items.map((i) => [i.id as string, i]))

  let drafts_written = 0
  let writer_null_drafts = 0
  let writer_no_pending_alert = 0
  let writer_update_errors = 0
  let fact_checks_run = 0
  let fact_checks_flagged = 0
  const alertIdByIntelId: Record<string, string> = {}
  const approveMetaByIntelId: Record<string, ApproveMeta> = {}
  if (plan && plan.approve.length) {
    const recentSamples = voiceSamples

    for (const a of plan.approve) {
      const intel = intelById.get(a.intel_id)
      if (!intel) continue

      // Seed meta from the raw intel so badges + deadline chip render even if
      // the writer call or pending-alert lookup later fails.
      const intelSlugs = (intel.programs as string[] | null) ?? []
      const seedProgramNames = intelSlugs
        .map((slug) => programBySlug.get(slug)?.name)
        .filter((n): n is string => typeof n === 'string')
      approveMetaByIntelId[intel.id as string] = {
        endDate: (intel.expires_at as string | null) ?? null,
        programNames: seedProgramNames,
      }

      // Also try to resolve the staged alert id up-front so Review & Publish
      // links survive even when the writer call itself fails.
      {
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('source_intel_id', intel.id as string)
          .maybeSingle()
        if (existingAlert?.id) {
          const alertId = existingAlert.id as string
          alertIdByIntelId[intel.id as string] = alertId
          approveMetaByIntelId[intel.id as string].alertId = alertId
        }
      }

      const draft = await writeAlertDraft({
        intel: {
          intel_id: intel.id as string,
          headline: intel.headline as string,
          raw_text: (intel.raw_text as string | null) ?? null,
          source_name: intel.source_name as string,
          source_url: (intel.source_url as string | null) ?? null,
          alert_type: intel.alert_type,
          programs: intel.programs as string[] | null,
        },
        programs: allPrograms,
        recent_samples: recentSamples,
      })
      if (!draft) {
        writer_null_drafts++
        continue
      }

      const { data: pending } = await supabase
        .from('alerts')
        .select('id')
        .eq('source_intel_id', intel.id as string)
        .eq('status', 'pending_review')
        .maybeSingle()
      if (!pending) {
        writer_no_pending_alert++
        continue
      }
      const alertId = pending.id as string
      alertIdByIntelId[intel.id as string] = alertId

      const primaryId = draft.primary_program_slug
        ? programBySlug.get(draft.primary_program_slug)?.id ?? null
        : null
      const secondaryIds = draft.secondary_program_slugs
        .map((s) => programBySlug.get(s)?.id)
        .filter((x): x is string => typeof x === 'string')

      try {
        await updateAlert(supabase, alertId, {
          title: draft.title,
          summary: draft.summary,
          description: draft.description,
          action_type: draft.action_type,
          primary_program_id: primaryId,
          start_date: draft.start_date,
          end_date: draft.end_date,
        })
        await setAlertPrograms(supabase, alertId, secondaryIds)
        drafts_written++

        // Fact-check pass: ground every factual claim in the draft against
        // the intel raw_text. Unsupported high-severity claims surface as
        // red warnings in admin review before publish.
        const verify = await verifyAlertDraft({
          draft: { title: draft.title, summary: draft.summary, description: draft.description },
          raw_text: (intel.raw_text as string | null) ?? null,
          source_url: (intel.source_url as string | null) ?? null,
        })
        if (verify) {
          fact_checks_run++
          if (highSeverityUnsupported(verify.claims).length > 0) fact_checks_flagged++
          try {
            await updateAlert(supabase, alertId, {
              fact_check_claims: verify.claims,
              fact_check_at: verify.checked_at,
            })
          } catch (err) {
            console.error('[build-brief] fact-check write failed for alert', alertId, err)
          }
        }

        const programNames: string[] = []
        if (draft.primary_program_slug) {
          const p = programBySlug.get(draft.primary_program_slug)
          if (p) programNames.push(p.name)
        }
        for (const slug of draft.secondary_program_slugs) {
          const p = programBySlug.get(slug)
          if (p) programNames.push(p.name)
        }
        approveMetaByIntelId[intel.id as string] = {
          alertId,
          endDate: draft.end_date,
          programNames,
        }
      } catch (err) {
        writer_update_errors++
        console.error('[build-brief] writer update failed for alert', alertId, err)
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
    siteOrigin: 'https://crazy4points.com',
    recentAlertsById,
    alertIdByIntelId,
    approveMetaByIntelId,
  })

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
    to: process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com',
    subject: `crazy4points Daily Brief — ${date}`,
    html,
  })

  if (emailError) {
    console.error('[build-brief] Resend error:', emailError)
    return NextResponse.json({ error: 'Email send failed', details: emailError }, { status: 500 })
  }

  const approve_count = plan?.approve.length ?? 0
  const writer_success_rate = approve_count
    ? Number((drafts_written / approve_count).toFixed(2))
    : null
  if (approve_count) {
    console.log(
      `[build-brief] writer stats — approves=${approve_count} drafts=${drafts_written} null=${writer_null_drafts} no_pending=${writer_no_pending_alert} errors=${writer_update_errors} success_rate=${writer_success_rate}`
    )
    console.log(
      `[build-brief] fact-check stats — run=${fact_checks_run} flagged_high_severity=${fact_checks_flagged}`
    )
  }

  return NextResponse.json({
    findings_in_brief: findings.length,
    brief_id: briefId ?? null,
    plan_generated: plan !== null,
    drafts_written,
    writer_stats: {
      approve_count,
      drafts_written,
      null_drafts: writer_null_drafts,
      no_pending_alert: writer_no_pending_alert,
      update_errors: writer_update_errors,
      success_rate: writer_success_rate,
    },
    fact_check_stats: {
      run: fact_checks_run,
      flagged_high_severity: fact_checks_flagged,
    },
    content_ideas_inserted,
    email_sent: true,
    date,
  })
}
