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

  const [intelRes, recentRes, slotsRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs')
      .gte('created_at', since24h)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('id, title, type, primary_program_id, published_at, end_date, alert_programs(program_id)')
      .eq('status', 'published')
      .gte('published_at', since30d)
      .order('published_at', { ascending: false }),
    supabase
      .from('homepage_slots')
      .select('slot_number, alert_id, alerts(id, title, end_date)')
      .order('slot_number', { ascending: true }),
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

  // Call Sonnet (best-effort — if it fails, fall back to the old layout)
  const plan = await generateEditorialPlan({
    today_intel: todayIntel,
    recent_alerts: recentAlerts,
    homepage_slots: homepageSlots,
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

  return NextResponse.json({
    findings_in_brief: findings.length,
    brief_id: briefId ?? null,
    plan_generated: plan !== null,
    email_sent: true,
    date,
  })
}
