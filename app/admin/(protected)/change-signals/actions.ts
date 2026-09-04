'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { draftProgramQuirk, sanitizeQuirkBullet } from '@/utils/ai/draftProgramQuirk'
import { isStandingSignal } from './reconcile'

/**
 * Dismiss a change signal as noise / not applicable / already handled.
 *
 * The announcement monitor is detection-only: it flags potential transfer-
 * partner / ratio changes from issuer newsrooms + blogs for human review. The
 * editor verifies against our stored data, applies any real change manually
 * (per the issuer-source rule), then dismisses the signal to clear the queue.
 */
export async function dismissSignal(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('change_signals').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/accuracy')
}

/**
 * Snooze a signal: hide it from the queue until `days` from now (default 30),
 * then it auto-resurfaces. For speculative "check back later" signals (a change
 * announced as "coming soon" but not yet live) that are neither noise nor
 * actionable today. status stays 'new' — it's still an open item, just deferred.
 */
export async function snoozeSignal(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const days = parseInt(String(formData.get('days') ?? '30'), 10)
  const until = new Date(Date.now() + (Number.isFinite(days) ? days : 30) * 86_400_000).toISOString()
  const supabase = createAdminClient()
  await supabase.from('change_signals').update({ status: 'new', snoozed_until: until }).eq('id', id)
  revalidatePath('/admin/accuracy')
}

type SignalRow = {
  id: string
  signal_type: string
  program_slug: string | null
  summary: string
  source_url: string | null
  status: string
}

/**
 * Load a change signal and confirm it's eligible for an "Apply to page" edit:
 * still open, a STANDING program-fact change (not a temporary promo), and tied
 * to a real program. Returns the row + program on success, or an error string.
 *
 * Shared by both draft and apply so the eligibility rule is enforced in ONE
 * place and can't be bypassed by a crafted client call (e.g. a transfer_bonus).
 */
async function loadEligibleSignal(
  supabase: ReturnType<typeof createAdminClient>,
  signalId: string,
): Promise<
  | { ok: true; signal: SignalRow; programId: string; programName: string; programSlug: string; quirks: string | null }
  | { ok: false; error: string }
> {
  const { data: sig } = await supabase
    .from('change_signals')
    .select('id, signal_type, program_slug, summary, source_url, status')
    .eq('id', signalId)
    .maybeSingle()
  const signal = sig as SignalRow | null
  if (!signal) return { ok: false, error: 'Signal not found.' }
  if (signal.status !== 'new') return { ok: false, error: 'This signal is no longer open.' }
  if (!isStandingSignal(signal.signal_type)) {
    return {
      ok: false,
      error: `"${signal.signal_type}" is not a standing program change, so it does not belong on the program page.`,
    }
  }
  if (!signal.program_slug) return { ok: false, error: 'This signal has no program to edit.' }

  const { data: prog } = await supabase
    .from('programs')
    .select('id, name, slug, quirks')
    .eq('slug', signal.program_slug)
    .maybeSingle()
  const program = prog as { id: string; name: string; slug: string; quirks: string | null } | null
  if (!program) return { ok: false, error: `No program found for slug "${signal.program_slug}".` }

  return {
    ok: true,
    signal,
    programId: program.id,
    programName: program.name,
    programSlug: program.slug,
    quirks: program.quirks,
  }
}

/**
 * Draft (but never write) a house-style quirk bullet for a STANDING change
 * signal, so the editor can review and edit it before it goes on the page.
 * Detection-to-draft only — the write happens in applyQuirkToProgram.
 */
export async function draftQuirkForSignal(
  signalId: string,
): Promise<{ ok: boolean; draft?: string; error?: string }> {
  await assertAdmin()
  const id = String(signalId ?? '').trim()
  if (!id) return { ok: false, error: 'Missing signal id.' }
  const supabase = createAdminClient()
  const loaded = await loadEligibleSignal(supabase, id)
  if (!loaded.ok) return { ok: false, error: loaded.error }

  const draft = await draftProgramQuirk({
    programName: loaded.programName,
    programSlug: loaded.programSlug,
    signalType: loaded.signal.signal_type,
    summary: loaded.signal.summary,
    sourceUrl: loaded.signal.source_url,
  })
  return { ok: true, draft }
}

/**
 * Apply the editor-approved quirk to the program page: APPEND it to
 * programs.quirks (never overwrite), bump content_updated_at, and resolve the
 * signal. Re-checks eligibility server-side so a temporary promo can never be
 * written to a page even via a crafted call.
 */
export async function applyQuirkToProgram(
  signalId: string,
  quirkText: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin()
  const id = String(signalId ?? '').trim()
  if (!id) return { ok: false, error: 'Missing signal id.' }

  // Sanitize the (possibly hand-edited) text to the hard house-style rules.
  const bullet = sanitizeQuirkBullet(String(quirkText ?? ''))
  // Reject an empty draft (only bullet/whitespace left after sanitizing).
  if (bullet.replace(/[-*•\s]/g, '').length < 5) {
    return { ok: false, error: 'The edit is empty. Add the quirk text before applying.' }
  }

  const supabase = createAdminClient()
  const loaded = await loadEligibleSignal(supabase, id)
  if (!loaded.ok) return { ok: false, error: loaded.error }

  // Append-only: keep every existing quirk, add the new bullet on its own line.
  const base = (loaded.quirks ?? '').replace(/\s+$/, '')
  const nextQuirks = base ? `${base}\n${bullet}` : bullet

  const { error: updErr } = await supabase
    .from('programs')
    .update({ quirks: nextQuirks, content_updated_at: new Date().toISOString() })
    .eq('id', loaded.programId)
  if (updErr) return { ok: false, error: `Could not update the program page: ${updErr.message}` }

  await supabase.from('change_signals').update({ status: 'resolved' }).eq('id', id)

  revalidatePath('/admin/accuracy')
  revalidatePath(`/programs/${loaded.programSlug}`)
  return { ok: true }
}
