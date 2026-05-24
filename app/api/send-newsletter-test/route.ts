import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterV2Html, formatWeekOf } from '@/utils/ai/newsletterEmailV2'
import type { NewsletterSlots, AlsoHappeningItem } from '@/utils/ai/newsletterSlots'

export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

const SLOT_SELECT =
  'id, week_of, sent_at, display_date, subject, subject_options, status, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, sweet_spot, also_happening, jills_take_html, game_slug, game_title, game_clue_text'

interface SlotRow {
  id: string
  week_of: string
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  display_date: string | null
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_html: string | null
  sweet_spot: NewsletterSlots['sweet_spot'] | null
  also_happening: AlsoHappeningItem[] | null
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
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
  const idParam = url.searchParams.get('id')
  const toParam = url.searchParams.get('to')

  const supabase = createAdminClient()
  const q = supabase.from('newsletters').select(SLOT_SELECT)
  const { data, error } = idParam
    ? await q.eq('id', idParam).maybeSingle()
    : await q.eq('status', 'draft').order('week_of', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: 'No draft found — run /api/build-newsletter first.' },
      { status: 404 },
    )
  }

  const row = data as SlotRow
  const slots: NewsletterSlots = {
    hero_kicker: row.hero_kicker,
    display_date: row.display_date,
    game: { slug: row.game_slug, title: row.game_title, clue_text: row.game_clue_text },
    big_story_ref_type: row.big_story_ref_type,
    big_story_ref_id: row.big_story_ref_id,
    big_story_html: row.big_story_html,
    sweet_spot: row.sweet_spot ?? null,
    also_happening: Array.isArray(row.also_happening) ? row.also_happening : [],
    jills_take_html: row.jills_take_html,
    jill_prompt: row.jill_prompt,
    subject: row.subject ?? row.subject_options?.[0] ?? 'Crazy4Points — Weekly',
    subject_options: row.subject_options ?? [],
  }

  const subject = slots.subject || 'Crazy4Points — Weekly'
  const to = toParam ?? process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'
  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatWeekOf(row.week_of),
    isPreview: true,
    recipientEmail: to,
  })

  const { error: sendErr } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Crazy4Points <hello@crazy4points.com>',
    to,
    subject: `[PREVIEW] ${subject}`,
    html,
  })

  if (sendErr) {
    return NextResponse.json(
      { ok: false, error: 'Resend error', details: sendErr },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'Preview sent',
    to,
    newsletter_id: row.id,
    week_of: row.week_of,
    subject,
  })
}
