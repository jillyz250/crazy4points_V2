/**
 * Server-side only. The actual newsletter build pipeline — extracted from
 * /api/build-newsletter so a server action can call it directly without
 * the fragile self-fetch loop that broke "Regenerate" in production.
 *
 * Two exports:
 *   - getNewsletterInputs()   — the queried alerts/ideas/radar that WOULD be
 *                               fed to Sonnet. Used by the admin to preview
 *                               selection before regenerating.
 *   - runBuildNewsletter()    — full Wed-cron / Run-Now flow: query inputs,
 *                               call Sonnet, fact-check, upsert the row.
 */
import { createAdminClient } from '@/utils/supabase/server'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'
import {
  buildNewsletter,
  type NewsletterAlertInput,
  type NewsletterIdeaInput,
  type NewsletterRadarSignalInput,
} from './buildNewsletter'
import { buildNewsletterSlots } from './buildNewsletterSlots'
import { verifyNewsletterDraft } from './verifyNewsletterDraft'

export function mondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export interface NewsletterInputs {
  week_of: string
  alerts: NewsletterAlertInput[]
  newsletter_ideas: NewsletterIdeaInput[]
  blog_ideas: NewsletterIdeaInput[]
  radar_signals: NewsletterRadarSignalInput[]
}

type Supabase = ReturnType<typeof createAdminClient>

/**
 * Pull the same data Sonnet will see, in the same order. Used by both the
 * generator and the admin "preview inputs" panel — single source of truth
 * for what the newsletter will use.
 */
export async function getNewsletterInputs(
  supabase: Supabase = createAdminClient(),
  now: Date = new Date(),
): Promise<NewsletterInputs> {
  const weekOf = mondayOfWeek(now)
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Phase 3 Wave 2 flip #5: alerts source via AlertView adapter
  // (content_variants + topics) instead of alerts table. Order-by impact then
  // published_at applied client-side because the adapter supports only one
  // sort; result set is tiny (≤19 rows currently) so the perf cost is nil.
  // ai_summary preserved as null — the legacy query was selecting a phantom
  // column that doesn't exist on alerts, so this matches prior behavior.
  const [alertViewRows, newsletterIdeasRes, blogIdeasRes, radarRes] = await Promise.all([
    selectAlertViewFromVariants(supabase, { status: 'published', activeOnly: true, limit: 50 }),
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
    supabase
      .from('intel_items')
      .select('headline, source_name, source_url, raw_text, confidence')
      .gte('created_at', since7d)
      .is('rejected_at', null)
      .in('confidence', ['low', 'medium'])
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const alerts: NewsletterAlertInput[] = alertViewRows
    .filter((a) => a.published_at && a.published_at >= since7d)
    .sort((a, b) => {
      const scoreA = a.impact_score ?? 0
      const scoreB = b.impact_score ?? 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return (b.published_at ?? '').localeCompare(a.published_at ?? '')
    })
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      slug: a.slug ?? null,
      title: a.title,
      summary: a.summary ?? null,
      ai_summary: null, // legacy field never actually existed on alerts; kept null for shape compat
      why_this_matters: a.why_this_matters ?? null,
      description: a.description ?? null,
      published_at: a.published_at ?? null,
      end_date: a.end_date ?? null,
      alert_type: a.type ?? null,
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

  const radar_signals: NewsletterRadarSignalInput[] = (radarRes.data ?? []).map((r) => ({
    headline: r.headline as string,
    source_name: (r.source_name as string | null) ?? null,
    source_url: (r.source_url as string | null) ?? null,
    raw_text: (r.raw_text as string | null) ?? null,
    confidence: (r.confidence as 'low' | 'medium' | null) ?? null,
  }))

  return { week_of: weekOf, alerts, newsletter_ideas, blog_ideas, radar_signals }
}

export type RunBuildNewsletterResult =
  | {
      ok: true
      message: string
      week_of: string
      id: string
      status: 'draft' | 'sent' | 'failed'
      alerts_considered?: number
      ideas_considered?: number
      subject_options?: string[]
      regenerated?: boolean
    }
  | {
      ok: false
      error: string
      week_of: string
      status?: number
    }

/**
 * Full pipeline: query inputs → Sonnet draft → fact-check → upsert row.
 * Honors the same "already sent" / "force=1" semantics the route had before.
 */
export async function runBuildNewsletter(opts: {
  force?: boolean
}): Promise<RunBuildNewsletterResult> {
  const supabase = createAdminClient()
  const inputs = await getNewsletterInputs(supabase)
  const weekOf = inputs.week_of

  const { data: existing } = await supabase
    .from('newsletters')
    .select('id, status, draft_json, jill_prompt, big_story_ref_id, big_story_ref_type, sweet_spot_ref_id, sweet_spot_ref_type')
    .eq('week_of', weekOf)
    .maybeSingle()

  if (existing && existing.status === 'sent') {
    return {
      ok: false,
      error: 'This week has already been sent',
      week_of: weekOf,
      status: 409,
    }
  }

  if (existing && !opts.force) {
    return {
      ok: true,
      message: 'Draft already exists. Pass force=true to regenerate.',
      week_of: weekOf,
      id: existing.id,
      status: existing.status as 'draft' | 'sent' | 'failed',
    }
  }

  // Generate both V1 (legacy draft_json — kept for fact-check pipeline) and
  // V2 (slot fields — what the new admin + email renderer read). Both shapes
  // are saved so we have a fallback during the redesign rollout. The admin
  // editor only writes V2 going forward.
  const jillPrompt: string | null =
    (existing && (existing as { jill_prompt?: string | null }).jill_prompt) ?? null

  // Phase NL1a — honor a manually-picked Big Story across regenerates. When
  // the row already has a big_story_ref_id locked in by the editor, pass it
  // to the slot generator so Sonnet writes the article around that alert
  // instead of picking its own lead.
  const lockedBigStory =
    existing && (existing as { big_story_ref_id?: string | null }).big_story_ref_id
      ? {
          ref_id: (existing as { big_story_ref_id: string }).big_story_ref_id,
          ref_type:
            ((existing as { big_story_ref_type?: 'alert' | 'intel' | null }).big_story_ref_type ??
              'alert') as 'alert' | 'intel',
        }
      : null

  // NL2a — same shape as Big Story lock. Anchors Sonnet's Sweet Spot prose
  // to the editor-picked alert when present; otherwise Sonnet picks.
  const lockedSweetSpot =
    existing && (existing as { sweet_spot_ref_id?: string | null }).sweet_spot_ref_id
      ? {
          ref_id: (existing as { sweet_spot_ref_id: string }).sweet_spot_ref_id,
          ref_type: 'alert' as const,
        }
      : null

  const [draft, slotDraft] = await Promise.all([
    buildNewsletter({
      week_of: weekOf,
      alerts: inputs.alerts,
      newsletter_ideas: inputs.newsletter_ideas,
      blog_ideas: inputs.blog_ideas,
      radar_signals: inputs.radar_signals,
    }),
    buildNewsletterSlots({
      week_of: weekOf,
      alerts: inputs.alerts,
      newsletter_ideas: inputs.newsletter_ideas,
      blog_ideas: inputs.blog_ideas,
      radar_signals: inputs.radar_signals,
      jill_prompt: jillPrompt,
      locked_big_story: lockedBigStory,
      locked_sweet_spot: lockedSweetSpot,
    }),
  ])

  if (!draft) {
    return {
      ok: false,
      error: 'Sonnet generation failed — see server logs',
      week_of: weekOf,
      status: 500,
    }
  }

  // Phase 6b — fact-check the draft against the same source material the
  // writer was given (alerts + tagged program pages).
  const alertsForVerify = inputs.alerts
    .map((a) => `## ${a.title}${a.why_this_matters ? `\n\n_Why this matters:_ ${a.why_this_matters}` : ''}\n\n${a.summary ?? ''}`)
    .join('\n\n---\n\n')

  const alertIds = inputs.alerts.map((a) => a.id)
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

  // Prefer slot subjects when available; fall back to V1 generator's options.
  const subjectOptions = slotDraft?.subject_options?.length
    ? slotDraft.subject_options
    : draft.subject_options

  const row = {
    week_of: weekOf,
    status: 'draft' as const,
    draft_json: {
      the_headline: draft.the_headline,
      quick_wins: draft.quick_wins,
      play_of_the_week: draft.play_of_the_week,
      heads_up: draft.heads_up,
      on_my_radar: draft.on_my_radar,
      jills_take: draft.jills_take,
      // Legacy mirrors keep older readers working.
      opener: draft.opener ?? '',
      big_one: draft.the_headline,
      haul: draft.quick_wins,
      sweet_spot: draft.play_of_the_week,
    },
    subject_options: subjectOptions,
    subject: subjectOptions[0] ?? null,
    fact_checked_at: verify?.checked_at ?? null,
    fact_check_claims: verify?.claims ?? null,
    // V2 slot fields — these are what the new admin + email renderer read.
    hero_kicker: slotDraft?.hero_kicker ?? null,
    big_story_ref_type: slotDraft?.big_story_ref_type ?? null,
    big_story_ref_id: slotDraft?.big_story_ref_id ?? null,
    big_story_html: slotDraft?.big_story_html ?? null,
    sweet_spot: slotDraft?.sweet_spot ?? null,
    also_happening: slotDraft?.also_happening ?? [],
    jills_take_html: slotDraft?.jills_take_html ?? null,
  }

  if (existing) {
    const { error: updErr } = await supabase
      .from('newsletters')
      .update(row)
      .eq('id', existing.id)
    if (updErr) {
      return { ok: false, error: updErr.message, week_of: weekOf, status: 500 }
    }
    return {
      ok: true,
      message: 'Draft regenerated',
      week_of: weekOf,
      id: existing.id,
      status: 'draft',
      alerts_considered: inputs.alerts.length,
      ideas_considered: inputs.newsletter_ideas.length + inputs.blog_ideas.length,
      subject_options: draft.subject_options,
      regenerated: true,
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('newsletters')
    .insert(row)
    .select('id')
    .single()

  if (insErr) {
    return { ok: false, error: insErr.message, week_of: weekOf, status: 500 }
  }

  return {
    ok: true,
    message: 'Draft created',
    week_of: weekOf,
    id: inserted.id,
    status: 'draft',
    alerts_considered: inputs.alerts.length,
    ideas_considered: inputs.newsletter_ideas.length + inputs.blog_ideas.length,
    subject_options: draft.subject_options,
  }
}
