'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { renderNewsletterV2Html, formatNewsletterDate } from '@/utils/ai/newsletterEmailV2'
import type { NewsletterSlots } from '@/utils/ai/newsletterSlots'
import { runBuildNewsletter, getNewsletterInputs } from '@/utils/ai/runBuildNewsletter'
import { writeBigStoryHtml } from '@/utils/ai/writeBigStoryHtml'
import { writeSubjectOptions } from '@/utils/ai/writeSubjectOptions'
import { writeSweetSpotProse } from '@/utils/ai/writeSweetSpotProse'
import { getActiveBonusAlerts } from '@/utils/ai/getActiveBonusAlerts'
import { getActiveOffers } from '@/utils/ai/gatherActiveOffers'
import { verifyBigStoryDraft } from '@/utils/ai/verifyBigStoryDraft'
import type { MissingFact } from '@/utils/ai/verifyBigStoryDraft'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Crazy4Points <hello@crazy4points.com>'
const ADMIN_EMAIL = process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'

const SLOT_SELECT =
  'id, week_of, sent_at, display_date, subject, subject_options, status, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, big_story_claims, big_story_missing_facts, sweet_spot_ref_type, sweet_spot_ref_id, sweet_spot, also_happening, jills_take_html, game_slug, game_title, game_clue_text, active_offers'

interface SlotRow {
  id: string
  week_of: string
  sent_at: string | null
  display_date: string | null
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_html: string | null
  big_story_claims: VerifyClaim[] | null
  big_story_missing_facts: MissingFact[] | null
  sweet_spot_ref_type: 'alert' | null
  sweet_spot_ref_id: string | null
  sweet_spot: NewsletterSlots['sweet_spot'] | null
  also_happening: NewsletterSlots['also_happening'] | null
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
  active_offers: NewsletterSlots['active_offers'] | null
}

function rowToSlots(row: SlotRow): NewsletterSlots {
  return {
    hero_kicker: row.hero_kicker,
    display_date: row.display_date,
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
    active_offers: row.active_offers ?? null,
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
      display_date: slots.display_date,
      jill_prompt: slots.jill_prompt,
      big_story_ref_type: slots.big_story_ref_type,
      big_story_ref_id: slots.big_story_ref_id,
      big_story_html: slots.big_story_html,
      sweet_spot: slots.sweet_spot,
      also_happening: slots.also_happening,
      active_offers: slots.active_offers,
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

export async function pullActiveOffersAction(id: string) {
  const supabase = createAdminClient()
  const offers = await getActiveOffers(supabase)
  const { error } = await supabase
    .from('newsletters')
    .update({ active_offers: offers })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return {
    ok: true,
    offers,
    counts: {
      transfer: offers.transfer_bonuses.length,
      earning: offers.earning_promos.length,
      purchase: offers.purchase_bonuses.length,
    },
  }
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
      big_story_claims: null,
      big_story_missing_facts: null,
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
      big_story_claims: null,
      big_story_missing_facts: null,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const }
}

/**
 * NL2a — Sweet Spot alert picker.
 *
 * Like the Big Story picker but anchors the SECOND editorial pick.
 * Sonnet writes the Sweet Spot prose (topic + mechanic_explainer +
 * best_uses) around this alert on the next Run Now. When null, current
 * behavior is preserved (Sonnet picks).
 */
export async function lockSweetSpotAction(id: string, alertId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      sweet_spot_ref_id: alertId,
      sweet_spot_ref_type: 'alert',
      // Clear the prose so the next regenerate writes fresh content for
      // this alert. Editor can still hand-edit after.
      sweet_spot: null,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const }
}

export async function generateSweetSpotFromLockAction(id: string) {
  const { row } = await loadSlotRow(id)
  if (row.status === 'sent') {
    throw new Error('This newsletter has already been sent.')
  }
  if (!row.sweet_spot_ref_id || row.sweet_spot_ref_type !== 'alert') {
    throw new Error('No alert is locked as the Sweet Spot anchor. Pick one first.')
  }

  const inputs = await getNewsletterInputs()
  const alert = inputs.alerts.find((a) => a.id === row.sweet_spot_ref_id)
  if (!alert) {
    throw new Error(
      'Locked Sweet Spot alert is no longer in the eligible pool (older than 7 days or unpublished). Unlock and pick a new one.',
    )
  }

  const supabase = createAdminClient()
  const { data: alertRow } = await supabase
    .from('alerts')
    .select('verified_terms')
    .eq('id', alert.id)
    .maybeSingle()
  const verifiedTerms =
    (alertRow as { verified_terms?: string | null } | null)?.verified_terms ?? null

  const sweetSpot = await writeSweetSpotProse(alert, verifiedTerms)
  if (!sweetSpot) {
    throw new Error('Sonnet returned no Sweet Spot prose — see server logs.')
  }

  const { error } = await supabase
    .from('newsletters')
    .update({ sweet_spot: sweetSpot })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return { ok: true as const, sweet_spot: sweetSpot }
}

export async function unlockSweetSpotAction(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletters')
    .update({
      sweet_spot_ref_id: null,
      sweet_spot_ref_type: null,
      sweet_spot: null,
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

  // Pull issuer T&Cs BEFORE writing so the writer can see them too. The
  // verifier needs them as ground truth for the fact-check pass, and the
  // writer needs them to surface actionable facts (event dates, on-sale
  // times, multi-city listings) that often only live in T&Cs rather than
  // the alert's summary/why_this_matters.
  const supabase = createAdminClient()
  const { data: alertRow } = await supabase
    .from('alerts')
    .select('verified_terms')
    .eq('id', alert.id)
    .maybeSingle()
  const verifiedTerms =
    (alertRow as { verified_terms?: string | null } | null)?.verified_terms ?? null

  const html = await writeBigStoryHtml(alert, row.subject, verifiedTerms)
  if (!html) {
    throw new Error('Sonnet returned no Big Story HTML — see server logs.')
  }

  const sourceText = [
    alert.title ? `# ${alert.title}` : '',
    alert.summary ?? '',
    alert.why_this_matters ? `\nWhy this matters:\n${alert.why_this_matters}` : '',
    // Full alert body / description carries most of the actionable facts
    // (event dates, multi-city listings, eligibility). Without this the
    // verifier can't compare article claims against the full source.
    alert.description ? `\nFull alert body:\n${alert.description}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  // Haiku fact-check — quick and cheap. Doesn't block save; null result
  // just means no chips render (logged to server).
  const verify = await verifyBigStoryDraft({
    big_story_html: html,
    source_text: sourceText,
    verified_terms: verifiedTerms,
  })

  const { error } = await supabase
    .from('newsletters')
    .update({
      big_story_html: html,
      big_story_claims: verify?.claims ?? null,
      big_story_missing_facts: verify?.missing_facts ?? null,
    })
    .eq('id', id)
    .neq('status', 'sent')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/newsletter')
  return {
    ok: true as const,
    html,
    claims: verify?.claims ?? [],
    missing_facts: verify?.missing_facts ?? [],
  }
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
  const currentBonuses = await getActiveBonusAlerts()
  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatNewsletterDate(row),
    isPreview: !isCatchUp,
    recipientEmail: target,
    currentBonuses,
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

  // Pull live bonuses ONCE up front (single query) — same data for every
  // recipient on this blast. Cheaper than re-querying per render.
  const currentBonuses = await getActiveBonusAlerts(supabase)

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
        weekOf: formatNewsletterDate(row),  // bulk send
        isPreview: false,
        recipientEmail: to,
        currentBonuses,
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
