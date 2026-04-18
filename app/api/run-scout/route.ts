import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { getSources, getAllPrograms } from '@/utils/supabase/queries'
import { runScout } from '@/utils/ai/runScout'
import { buildBriefEmail } from '@/utils/ai/briefEmail'
import type { AlertType, IntelItemInsert } from '@/utils/supabase/queries'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // Accept both cron (Vercel sends Authorization header) and manual trigger (INTEL_API_SECRET)
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Load active sources
  const sources = await getSources(supabase)
  const activeSources = sources.filter((s) => s.is_active)

  if (activeSources.length === 0) {
    return NextResponse.json({ message: 'No active sources' })
  }

  // Run Claude Scout
  const findings = await runScout(activeSources)
  console.log(`[run-scout] ${findings.length} findings from ${activeSources.length} sources`)

  if (findings.length === 0) {
    return NextResponse.json({ message: 'No findings today', sources: activeSources.length })
  }

  // Write to intel_items
  const items: IntelItemInsert[] = findings.map((f) => ({
    source_url: f.source_url ?? null,
    source_type: f.source_type,
    source_name: f.source_name,
    raw_text: f.raw_text ?? null,
    headline: f.headline,
    confidence: f.confidence,
    alert_type: (f.alert_type as AlertType) ?? null,
    programs: f.programs ?? null,
    expires_at: f.expires_at ?? null,
  }))

  const { data: inserted, error: intelError } = await supabase
    .from('intel_items')
    .insert(items)
    .select()

  if (intelError) {
    console.error('[run-scout] intel_items insert error:', intelError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Build program slug → id map
  const allPrograms = await getAllPrograms(supabase)
  const programSlugMap = new Map(allPrograms.map((p) => [p.slug, p.id]))

  // Stage high-confidence items as pending_review alerts
  const staged: string[] = []
  const highConfItems = inserted.filter((i) => i.confidence === 'high' && i.alert_type)

  for (const item of highConfItems) {
    // Resolve program slugs to IDs
    const programIds = (item.programs ?? [])
      .map((slug: string) => programSlugMap.get(slug))
      .filter(Boolean) as string[]
    const primaryProgramId = programIds[0] ?? null

    // Find the matching finding for description/start_date
    const finding = findings.find((f) => f.headline === item.headline)

    // Generate history note from recent published alerts for this program
    let historyNote: string | null = null
    if (primaryProgramId) {
      const { data: recent } = await supabase
        .from('alerts')
        .select('title, published_at, type')
        .eq('status', 'published')
        .eq('primary_program_id', primaryProgramId)
        .order('published_at', { ascending: false })
        .limit(3)

      if (recent && recent.length > 0) {
        const lines = recent.map((a) => {
          const date = a.published_at
            ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'unknown date'
          return `• ${a.title} (${date})`
        })
        historyNote = `Recent alerts for this program:\n${lines.join('\n')}`
      }
    }

    const slug = `intel-${item.id.slice(0, 8)}-${Date.now()}`
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        slug,
        title: item.headline,
        summary: item.raw_text?.slice(0, 300) ?? item.headline,
        description: finding?.description ?? null,
        type: item.alert_type,
        status: 'pending_review',
        confidence_level: item.confidence,
        source_url: item.source_url ?? null,
        source: item.source_name,
        primary_program_id: primaryProgramId,
        start_date: finding?.start_date ?? null,
        end_date: item.expires_at ?? null,
        history_note: historyNote,
        source_intel_id: item.id,
        impact_score: 5,
        value_score: 5,
        rarity_score: 5,
        impact_justification: 'Auto-staged from Claude Scout',
        action_type: 'monitor',
        registration_required: false,
      })
      .select('id')
      .single()

    if (alertError) {
      console.error('[run-scout] Alert staging error:', alertError)
      continue
    }

    // Link additional programs via junction table
    if (programIds.length > 1) {
      await supabase.from('alert_programs').insert(
        programIds.slice(1).map((pid) => ({
          alert_id: alert.id,
          program_id: pid,
          role: 'secondary',
        }))
      )
    }

    await supabase.from('intel_items').update({ processed: true, alert_id: alert.id }).eq('id', item.id)
    staged.push(alert.id)
  }

  // Send daily brief email
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const html = buildBriefEmail(findings, date)

  const { error: emailError } = await resend.emails.send({
    from: 'crazy4points Scout <onboarding@resend.dev>',
    to: 'jillzeller6@gmail.com',
    subject: `crazy4points Daily Brief — ${date}`,
    html,
  })

  if (emailError) {
    console.error('[run-scout] Resend error:', emailError)
  }

  return NextResponse.json({
    sources_scanned: activeSources.length,
    findings: findings.length,
    staged: staged.length,
    email_sent: !emailError,
  })
}
