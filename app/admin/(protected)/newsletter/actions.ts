'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterV2Html, formatWeekOf } from '@/utils/ai/newsletterEmailV2'
import type { NewsletterSlots } from '@/utils/ai/newsletterSlots'
import { runBuildNewsletter } from '@/utils/ai/runBuildNewsletter'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Crazy4Points <hello@crazy4points.com>'
const ADMIN_EMAIL = process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'

const SLOT_SELECT =
  'id, week_of, subject, subject_options, status, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, also_happening, jills_take_html, game_slug, game_title, game_clue_text'

interface SlotRow {
  id: string
  week_of: string
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_html: string | null
  also_happening: NewsletterSlots['also_happening'] | null
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
}

function rowToSlots(row: SlotRow): NewsletterSlots {
  return {
    hero_kicker: row.hero_kicker,
    game: {
      slug: row.game_slug,
      title: row.game_title,
      clue_text: row.game_clue_text,
    },
    big_story_ref_type: row.big_story_ref_type,
    big_story_ref_id: row.big_story_ref_id,
    big_story_html: row.big_story_html,
    also_happening: Array.isArray(row.also_happening) ? row.also_happening : [],
    jills_take_html: row.jills_take_html,
    jill_prompt: row.jill_prompt,
    subject: row.subject ?? row.subject_options?.[0] ?? '',
    subject_options: row.subject_options ?? [],
  }
}

async function loadSlotRow(id: string): Promise<{
  supabase: ReturnType<typeof createAdminClient>
  row: SlotRow
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletters')
    .select(SLOT_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return { supabase, row: data as SlotRow }
}

export async function saveSlotsAction(id: string, slots: NewsletterSlots) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      subject: slots.subject || null,
      subject_options: slots.subject_options,
      hero_kicker: slots.hero_kicker,
      jill_prompt: slots.jill_prompt,
      big_story_ref_type: slots.big_story_ref_type,
      big_story_ref_id: slots.big_story_ref_id,
      big_story_html: slots.big_story_html,
      also_happening: slots.also_happening,
      jills_take_html: slots.jills_take_html,
      game_slug: slots.game.slug,
      game_title: slots.game.title,
      game_clue_text: slots.game.clue_text,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true }
}

export async function runNowAction() {
  const result = await runBuildNewsletter({ force: true })
  if (!result.ok) throw new Error(result.error)
  revalidatePath('/admin/newsletter')
  return result
}

export async function sendTestAction(id: string) {
  const { row } = await loadSlotRow(id)
  const slots = rowToSlots(row)

  const subject = slots.subject || 'Crazy4Points — Weekly'
  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatWeekOf(row.week_of),
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

  const { supabase, row } = await loadSlotRow(id)
  if (row.status === 'sent') {
    throw new Error('This newsletter has already been sent.')
  }

  const slots = rowToSlots(row)
  const subject = slots.subject || 'Crazy4Points — Weekly'

  if (!slots.big_story_html && slots.also_happening.length === 0 && !slots.jills_take_html) {
    throw new Error('Newsletter is empty — fill at least one section before sending.')
  }

  const { data: subs, error: subErr } = await supabase
    .from('subscribers')
    .select('email')
    .eq('active', true)
  if (subErr) throw new Error(subErr.message)

  const recipients = ((subs ?? []) as { email: string | null }[])
    .map((s) => s.email)
    .filter((e): e is string => !!e)
  if (recipients.length === 0) {
    throw new Error('No active subscribers to send to.')
  }

  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatWeekOf(row.week_of),
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
        subject,
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
