import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterHtml } from '@/utils/ai/newsletterEmail'
import type { NewsletterDraft } from '@/utils/ai/buildNewsletter'

export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const query = supabase
    .from('newsletters')
    .select('id, week_of, subject, subject_options, draft_json, comic_url, status')

  const { data, error } = idParam
    ? await query.eq('id', idParam).maybeSingle()
    : await query.eq('status', 'draft').order('week_of', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: 'No draft found — run /api/build-newsletter first.' },
      { status: 404 },
    )
  }

  const draft = data.draft_json as NewsletterDraft | null
  if (!draft) {
    return NextResponse.json(
      { ok: false, error: 'Row has no draft_json. Regenerate it.' },
      { status: 422 },
    )
  }

  const subject = data.subject ?? (Array.isArray(data.subject_options) ? data.subject_options[0] : null) ?? 'Crazy4Points — Weekly'

  const html = renderNewsletterHtml({
    draft,
    subject,
    weekOf: data.week_of,
    comicUrl: data.comic_url ?? null,
    isPreview: true,
  })

  const to = toParam ?? process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'

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
    newsletter_id: data.id,
    week_of: data.week_of,
    subject,
  })
}
