import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
  buildNewsletter,
  type NewsletterAlertInput,
  type NewsletterIdeaInput,
} from '@/utils/ai/buildNewsletter'

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

  const [alertsRes, newsletterIdeasRes, blogIdeasRes] = await Promise.all([
    supabase
      .from('alerts')
      .select('id, slug, title, summary, ai_summary, published_at, impact_score')
      .eq('status', 'published')
      .gte('published_at', since7d)
      .order('impact_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(10),
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
  ])

  const alerts: NewsletterAlertInput[] = (alertsRes.data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug ?? null,
    title: a.title,
    summary: a.summary ?? null,
    ai_summary: a.ai_summary ?? null,
    published_at: a.published_at ?? null,
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

  const draft = await buildNewsletter({
    week_of: weekOf,
    alerts,
    newsletter_ideas,
    blog_ideas,
  })

  if (!draft) {
    return NextResponse.json(
      { ok: false, error: 'Sonnet generation failed — see server logs', week_of: weekOf },
      { status: 500 },
    )
  }

  const row = {
    week_of: weekOf,
    status: 'draft',
    draft_json: {
      opener: draft.opener,
      big_one: draft.big_one,
      haul: draft.haul,
      sweet_spot: draft.sweet_spot,
      jills_take: draft.jills_take,
    },
    subject_options: draft.subject_options,
    subject: draft.subject_options[0] ?? null,
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
