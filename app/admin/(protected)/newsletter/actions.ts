'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterHtml } from '@/utils/ai/newsletterEmail'
import type { NewsletterDraft } from '@/utils/ai/buildNewsletter'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Crazy4Points <hello@crazy4points.com>'
const ADMIN_EMAIL = process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'

async function loadRow(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletters')
    .select('id, week_of, subject, subject_options, draft_json, comic_url, status')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return { supabase, row: data }
}

export async function saveNewsletterAction(
  id: string,
  payload: {
    subject: string
    draft_json: NewsletterDraft
  },
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      subject: payload.subject,
      draft_json: payload.draft_json,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true }
}

export async function runNowAction() {
  const secret = process.env.INTEL_API_SECRET
  if (!secret) throw new Error('INTEL_API_SECRET not configured')
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${origin}/api/build-newsletter?force=1`, {
    headers: { 'x-intel-secret': secret },
    cache: 'no-store',
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? 'build-newsletter failed')
  revalidatePath('/admin/newsletter')
  return { ok: true, ...body }
}

export async function sendTestAction(id: string) {
  const { row } = await loadRow(id)
  if (!row.draft_json) throw new Error('Row has no draft_json')

  const subject = row.subject ?? (Array.isArray(row.subject_options) ? row.subject_options[0] : 'Crazy4Points — Weekly')
  const html = renderNewsletterHtml({
    draft: row.draft_json as NewsletterDraft,
    subject: String(subject),
    weekOf: row.week_of,
    comicUrl: row.comic_url ?? null,
    isPreview: true,
  })

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[PREVIEW] ${subject}`,
    html,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
  return { ok: true, to: ADMIN_EMAIL }
}

export async function sendToSubscribersAction(id: string, confirmWord: string) {
  if (confirmWord !== 'Send') {
    throw new Error('Confirmation failed. Type the word "Send" exactly to confirm.')
  }

  const { supabase, row } = await loadRow(id)
  if (row.status === 'sent') {
    throw new Error('This newsletter has already been sent.')
  }
  if (!row.draft_json) throw new Error('Row has no draft_json')

  const { data: subs, error: subErr } = await supabase
    .from('subscribers')
    .select('email')
    .eq('active', true)
  if (subErr) throw new Error(subErr.message)

  const recipients = (subs ?? []).map((s) => s.email).filter(Boolean)
  if (recipients.length === 0) {
    throw new Error('No active subscribers to send to.')
  }

  const subject = row.subject ?? (Array.isArray(row.subject_options) ? row.subject_options[0] : 'Crazy4Points — Weekly')
  const html = renderNewsletterHtml({
    draft: row.draft_json as NewsletterDraft,
    subject: String(subject),
    weekOf: row.week_of,
    comicUrl: row.comic_url ?? null,
    isPreview: false,
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const to of recipients) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: String(subject),
        html,
      })
      if (error) {
        failed++
        errors.push(`${to}: ${error.message}`)
      } else {
        sent++
      }
    } catch (err) {
      failed++
      errors.push(`${to}: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const finalStatus = sent > 0 ? 'sent' : 'failed'
  await supabase
    .from('newsletters')
    .update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipient_count: sent,
      error: errors.length > 0 ? errors.slice(0, 5).join(' | ') : null,
    })
    .eq('id', id)

  revalidatePath('/admin/newsletter')
  return { ok: sent > 0, sent, failed, total: recipients.length }
}
