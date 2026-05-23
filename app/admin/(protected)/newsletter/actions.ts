'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterV2Html, formatWeekOf } from '@/utils/ai/newsletterEmailV2'
import type { NewsletterSlots } from '@/utils/ai/newsletterSlots'
import { runBuildNewsletter, getNewsletterInputs } from '@/utils/ai/runBuildNewsletter'
import { writeBigStoryHtml } from '@/utils/ai/writeBigStoryHtml'
import { writeSubjectOptions } from '@/utils/ai/writeSubjectOptions'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Crazy4Points <hello@crazy4points.com>'
const ADMIN_EMAIL = process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'

const SLOT_SELECT =
  'id, week_of, subject, subject_options, status, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, sweet_spot, also_happening, jills_take_html, game_slug, game_title, game_clue_text'

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
  sweet_spot: NewsletterSlots['sweet_spot'] | null
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
    sweet_spot: row.sweet_spot ?? null,
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
      sweet_spot: slots.sweet_spot,
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

/**
 * Phase NL1a — Big Story picker actions.
 *
 * lockBigStoryAction:    set the lead alert manually + clear stale HTML so
 *                        the next generate writes fresh prose for it.
 * unlockBigStoryAction:  clear the lock (and the HTML) so Sonnet can pick
 *                        a different lead on next regen.
 * generateBigStoryFromLockAction:
 *                        write the Big Story HTML for the currently-locked
 *                        alert only — does not touch other slots.
 */
export async function lockBigStoryAction(id: string, alertId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      big_story_ref_id: alertId,
      big_story_ref_type: 'alert',
      big_story_html: null,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const }
}

export async function unlockBigStoryAction(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      big_story_ref_id: null,
      big_story_ref_type: null,
      big_story_html: null,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const }
}

export async function generateSubjectOptionsFromLockAction(id: string) {
  const { row } = await loadSlotRow(id)
  if (row.status === 'sent') {
    throw new Error('This newsletter has already been sent.')
  }
  if (!row.big_story_ref_id || row.big_story_ref_type !== 'alert') {
    throw new Error('Lock a Big Story first — subject lines anchor to it.')
  }

  const inputs = await getNewsletterInputs()
  const alert = inputs.alerts.find((a) => a.id === row.big_story_ref_id)
  if (!alert) {
    throw new Error(
      'Locked alert is no longer in the eligible pool (older than 7 days or unpublished). Unlock and pick a new lead.',
    )
  }

  const options = await writeSubjectOptions(alert)
  if (!options || options.length === 0) {
    throw new Error('Sonnet returned no usable subject options — see server logs.')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      subject_options: options,
      // Reset the chosen subject to the first option so the radio doesn't
      // point at a stale value Sonnet just overwrote.
      subject: options[0],
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const, options }
}

export async function generateBigStoryFromLockAction(id: string) {
  const { row } = await loadSlotRow(id)
  if (row.status === 'sent') {
    throw new Error('This newsletter has already been sent.')
  }
  if (!row.big_story_ref_id || row.big_story_ref_type !== 'alert') {
    throw new Error('No alert is locked as the Big Story. Pick one first.')
  }

  // Pull the same alert pool the generator would see so the locked alert
  // is hydrated with the fields Sonnet needs (summary, why_this_matters,
  // etc.). The pool is small and the lookup is cheap.
  const inputs = await getNewsletterInputs()
  const alert = inputs.alerts.find((a) => a.id === row.big_story_ref_id)
  if (!alert) {
    throw new Error(
      'Locked alert is no longer in the eligible pool (older than 7 days or unpublished). Unlock and pick a new one.',
    )
  }

  const html = await writeBigStoryHtml(alert)
  if (!html) {
    throw new Error('Sonnet returned no Big Story HTML — see server logs.')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({ big_story_html: html })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const, html }
}

/**
 * Send a single copy of the newsletter. Two modes, picked automatically:
 *
 * - **Preview mode** (status='draft' OR no toOverride): renders with the
 *   gold "Preview" banner and prefixes the subject with [PREVIEW]. Used
 *   while editing/testing.
 * - **Catch-up mode** (status='sent' AND toOverride is set): renders as
 *   the actual newsletter with NO preview chrome. Used to forward a
 *   published newsletter to a subscriber who joined after the broadcast —
 *   they should see what everyone else saw, not a "preview" copy.
 */
export async function sendTestAction(id: string, toOverride?: string) {
  const { row } = await loadSlotRow(id)
  const slots = rowToSlots(row)

  const target = toOverride?.trim() || ADMIN_EMAIL
  if (toOverride && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    throw new Error("That email doesn't look right.")
  }

  // Catch-up = forwarding a sent newsletter to a specific late-joining
  // subscriber. Anything else (drafts, "Send test to me") stays in preview.
  const isCatchUp = row.status === 'sent' && !!toOverride

  const subject = slots.subject || 'Crazy4Points — Weekly'
  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatWeekOf(row.week_of),
    isPreview: !isCatchUp,
    recipientEmail: target,
  })

  const { error } = await resend.emails.send({
    from: FROM,
    to: target,
    subject: isCatchUp ? subject : `[PREVIEW] ${subject}`,
    html,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
  return { ok: true, to: target, mode: isCatchUp ? ('catchup' as const) : ('preview' as const) }
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

  if (!slots.big_story_html && slots.also_happening.length === 0 && !slots.jills_take_html && !slots.sweet_spot) {
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

  // Resend's free tier rate-limits at 5 requests/sec. We throttle each send
  // by 250ms (= 4/sec) so the last subscribers in the list don't get 429'd
  // and silently dropped. Discovered the hard way on 2026-05-07: 8 subs sent
  // in a tight loop, last 3 were rejected. See PR #382/383 history.
  const SEND_DELAY_MS = 250
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (let i = 0; i < recipients.length; i++) {
    const to = recipients[i]
    if (i > 0) await sleep(SEND_DELAY_MS)
    try {
      // Re-render per recipient so the unsubscribe URL carries that
      // subscriber's HMAC token. Cheap (~ms per render, dwarfed by the
      // 250ms throttle below).
      const html = renderNewsletterV2Html({
        slots,
        weekOf: formatWeekOf(row.week_of),
        isPreview: false,
        recipientEmail: to,
      })
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
