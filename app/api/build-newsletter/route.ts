import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
  buildNewsletter,
  type NewsletterAlertInput,
  type NewsletterIdeaInput,
} from '@/utils/ai/buildNewsletter'
import { verifyNewsletterDraft } from '@/utils/ai/verifyNewsletterDraft'

export const maxDuration = 300

function mondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'

  const supabase = createAdminClient()
  const weekOf = mondayOf(new Date())
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: existing } = await supabase
    .from('newsletters')
    .select('id, status, draft_json')
    .eq('week_of', weekOf)
    .maybeSingle()

  if (existing && existing.status === 'sent') {
    return NextResponse.json(
      { ok: false, error: 'This week has already been sent', week_of: weekOf },
      { status: 409 },
    )
  }

  if (existing && !force) {
    return NextResponse.json({
      ok: true,
      message: 'Draft already exists. Pass ?force=1 to regenerate.',
      week_of: weekOf,
      id: existing.id,
      status: existing.status,
    })
  }

  const [alertsRes, newsletterIdeasRes, blogIdeasRes, radarRes] = await Promise.all([
    supabase
      .from('alerts')
      .select('id, slug, title, summary, ai_summary, why_this_matters, published_at, end_date, type, impact_score')
      .eq('status', 'published')
      .gte('published_at', since7d)
      .order('impact_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(12),
    supabase
      .from('content_ideas')
      .select('id, title, pitch, type, priority, slug')
      .eq('type', 'newsletter')
      .gte('created_at', since7d)
      .order('priority', { ascending: true })
      .limit(8),
    supabase
      .from('content_ideas')
      .select('id, title, pitch, type, priority, slug')
      .eq('type', 'blog')
      .gte('created_at', since7d)
      .order('priority', { ascending: true })
      .limit(3),
    // Phase 4 — radar pulls from low / medium-confidence intel that wasn't
    // approved into a published alert. Keeps "On my radar" honest.
    supabase
      .from('intel_items')
      .select('headline, source_name, source_url, raw_text, confidence')
      .gte('created_at', since7d)
      .is('rejected_at', null)
      .in('confidence', ['low', 'medium'])
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const alerts: NewsletterAlertInput[] = (alertsRes.data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug ?? null,
    title: a.title,
    summary: a.summary ?? null,
    ai_summary: a.ai_summary ?? null,
    why_this_matters: (a as { why_this_matters?: string | null }).why_this_matters ?? null,
    published_at: a.published_at ?? null,
    end_date: (a as { end_date?: string | null }).end_date ?? null,
    alert_type: (a as { type?: string | null }).type ?? null,
    impact_score: a.impact_score ?? null,
  }))

  const newsletter_ideas: NewsletterIdeaInput[] = (newsletterIdeasRes.data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    pitch: i.pitch ?? null,
    type: i.type,
    priority: i.priority ?? null,
    slug: i.slug ?? null,
  }))

  const blog_ideas: NewsletterIdeaInput[] = (blogIdeasRes.data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    pitch: i.pitch ?? null,
    type: i.type,
    priority: i.priority ?? null,
    slug: i.slug ?? null,
  }))

  const radar_signals = (radarRes.data ?? []).map((r) => ({
    headline: r.headline as string,
    source_name: (r.source_name as string | null) ?? null,
    source_url: (r.source_url as string | null) ?? null,
    raw_text: (r.raw_text as string | null) ?? null,
    confidence: (r.confidence as 'low' | 'medium' | null) ?? null,
  }))

  const draft = await buildNewsletter({
    week_of: weekOf,
    alerts,
    newsletter_ideas,
    blog_ideas,
    radar_signals,
  })

  if (!draft) {
    return NextResponse.json(
      { ok: false, error: 'Sonnet generation failed — see server logs', week_of: weekOf },
      { status: 500 },
    )
  }

  // Phase 6b — build source_text from the same material the writer was given
  // (full alerts + tagged program content) and run a fact-check pass on the
  // draft prose. Stamp results onto the newsletter row so the editor can show
  // flagged claims before the editor hits Send.
  const alertsForVerify = alerts
    .map((a) => `## ${a.title}${a.why_this_matters ? `\n\n_Why this matters:_ ${a.why_this_matters}` : ''}\n\n${a.summary ?? ''}`)
    .join('\n\n---\n\n')

  // Pull tagged programs for the alerts in this newsletter so the verifier
  // has program-page facts (sweet spots, transfer ratios, hubs) to ground
  // claims that came from program_context, not raw_text.
  const alertIds = alerts.map((a) => a.id)
  let programPagesText = ''
  if (alertIds.length > 0) {
    const { data: progLinks } = await supabase
      .from('alert_programs')
      .select('programs!inner(name, slug, intro, sweet_spots, how_to_spend, quirks, lounge_access, transfer_partners, alliance, hubs)')
      .in('alert_id', alertIds)
    type ProgRow = {
      name: string
      slug: string
      intro: string | null
      sweet_spots: string | null
      how_to_spend: string | null
      quirks: string | null
      lounge_access: string | null
      transfer_partners: { from_slug: string; ratio: string; notes: string | null; bonus_active: boolean }[] | null
      alliance: string | null
      hubs: string[] | null
    }
    const seen = new Set<string>()
    const blocks: string[] = []
    for (const link of progLinks ?? []) {
      const p = (link as unknown as { programs: ProgRow | null }).programs
      if (!p || seen.has(p.slug)) continue
      seen.add(p.slug)
      const parts: string[] = [`# ${p.name} (${p.slug})`]
      if (p.alliance) parts.push(`Alliance: ${p.alliance}`)
      if (p.hubs && p.hubs.length > 0) parts.push(`Hubs: ${p.hubs.join(', ')}`)
      if (p.intro) parts.push(`\nIntro:\n${p.intro}`)
      if (p.sweet_spots) parts.push(`\nSweet spots:\n${p.sweet_spots}`)
      if (p.how_to_spend) parts.push(`\nHow to spend:\n${p.how_to_spend}`)
      if (p.quirks) parts.push(`\nQuirks:\n${p.quirks}`)
      if (p.lounge_access) parts.push(`\nLounge access:\n${p.lounge_access}`)
      if (p.transfer_partners && p.transfer_partners.length > 0) {
        const lines = p.transfer_partners.map((tp) => {
          const bonus = tp.bonus_active ? ' (BONUS ACTIVE)' : ''
          const notes = tp.notes ? ` — ${tp.notes}` : ''
          return `• ${tp.from_slug} → ${p.slug} ratio ${tp.ratio}${bonus}${notes}`
        })
        parts.push(`\nTransfer partners:\n${lines.join('\n')}`)
      }
      blocks.push(parts.join('\n'))
    }
    programPagesText = blocks.join('\n\n═══════════════════════════════════════════════\n\n')
  }

  const sourceText = [
    alertsForVerify ? `═══ ALERTS THIS WEEK ═══\n\n${alertsForVerify}` : '',
    programPagesText ? `═══ PROGRAM PAGE CONTENT ═══\n\n${programPagesText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const verify = await verifyNewsletterDraft({ draft, source_text: sourceText })

  const row = {
    week_of: weekOf,
    status: 'draft',
    draft_json: {
      // Save BOTH new + legacy field names so old/new editor code paths read
      // the same data. Phase 4 added the new names; legacy mirrors keep
      // existing draft consumers working.
      the_headline: draft.the_headline,
      quick_wins: draft.quick_wins,
      play_of_the_week: draft.play_of_the_week,
      heads_up: draft.heads_up,
      on_my_radar: draft.on_my_radar,
      jills_take: draft.jills_take,
      // Legacy mirrors
      opener: draft.opener ?? '',
      big_one: draft.the_headline,
      haul: draft.quick_wins,
      sweet_spot: draft.play_of_the_week,
    },
    subject_options: draft.subject_options,
    subject: draft.subject_options[0] ?? null,
    fact_checked_at: verify?.checked_at ?? null,
    fact_check_claims: verify?.claims ?? null,
  }

  if (existing) {
    const { error: updErr } = await supabase
      .from('newsletters')
      .update(row)
      .eq('id', existing.id)
    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      message: 'Draft regenerated',
      week_of: weekOf,
      id: existing.id,
      alerts_considered: alerts.length,
      ideas_considered: newsletter_ideas.length + blog_ideas.length,
      subject_options: draft.subject_options,
    })
  }

  const { data: inserted, error: insErr } = await supabase
    .from('newsletters')
    .insert(row)
    .select('id')
    .single()

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Draft created',
    week_of: weekOf,
    id: inserted.id,
    alerts_considered: alerts.length,
    ideas_considered: newsletter_ideas.length + blog_ideas.length,
    subject_options: draft.subject_options,
  })
}
