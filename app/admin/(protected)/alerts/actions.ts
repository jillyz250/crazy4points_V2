'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  updateAlert,
  expireAlert,
  incrementSourceApproved,
  getAlertById,
  setAlertPrograms,
  logSystemError,
  loadAllianceContextForPrograms,
} from '@/utils/supabase/queries'
import type { Alert, AlertStatus, AlertGap } from '@/utils/supabase/queries'
import type { SupabaseClient } from '@supabase/supabase-js'
import { writeAlertDraft } from '@/utils/ai/writeAlertDraft'
import { editAlertDraft } from '@/utils/ai/editAlertDraft'
import { writeEditCheck } from '@/utils/ai/writeEditCheck'
import { buildExtraContext } from '@/utils/ai/buildExtraContext'
import { verifyAlertDraft, webVerifyClaims, highSeverityUnsupported, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { isSupported } from '@/utils/ai/claimStatus'
import { buildProgramReferenceForDraft } from '@/utils/ai/programReferenceData'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import { voiceCheckArticle } from '@/utils/ai/voiceCheckArticle'
import { originalityCheck } from '@/utils/ai/originalityCheck'
import { checkAlertGates } from '@/utils/alerts/publishGates'
import { logAlertOverride, type OverrideGate } from '@/utils/supabase/alertOverrides'

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

// Revalidate the public-facing pages an alert lives on. Used by every flow
// that flips an alert's status (publish, approve, bulk approve, bulk reject,
// edit). Without this, the /alerts index and the per-program /programs/[slug]
// pages keep serving their cached snapshot for up to `revalidate = 60`
// seconds and a fresh publish doesn't show up.
//
// We revalidate:
//   • /alerts index
//   • /alerts/[slug] for the alert itself
//   • /programs/[slug] for the primary program
//   • /programs/[slug] for every program tagged via alert_programs junction
async function revalidateAlertPaths(
  supabase: SupabaseClient,
  alertId: string,
  alertSlug: string | null,
) {
  revalidatePath('/alerts')
  if (alertSlug) revalidatePath(`/alerts/${alertSlug}`)
  // Pull the primary program + every junction-tagged program in one shot.
  const { data: row } = await supabase
    .from('alerts')
    .select('primary_program_id, alert_programs(program_id)')
    .eq('id', alertId)
    .maybeSingle()
  const programIds = new Set<string>()
  if (row?.primary_program_id) programIds.add(row.primary_program_id as string)
  const junction = (row?.alert_programs ?? []) as { program_id: string }[]
  for (const j of junction) if (j.program_id) programIds.add(j.program_id)
  if (programIds.size === 0) return
  const { data: programs } = await supabase
    .from('programs')
    .select('slug')
    .in('id', Array.from(programIds))
  for (const p of programs ?? []) {
    if (p.slug) revalidatePath(`/programs/${p.slug}`)
  }
}

// Increment the source-approved counter whenever an alert from intel
// transitions into a published/approved state — regardless of which button
// triggered the transition. Keeps source approval metrics honest.
async function trackSourceApprovalIfNeeded(
  supabase: SupabaseClient,
  prev: Pick<Alert, 'status' | 'source_intel_id'>,
  nextStatus: AlertStatus,
) {
  if (nextStatus !== 'published') return
  if (prev.status === 'published') return
  if (!prev.source_intel_id) return
  await incrementSourceApproved(supabase, prev.source_intel_id).catch(() => {})
}

export async function acknowledgeFactCheckClaimAction(alertId: string, claimIndex: number) {
  const supabase = createAdminClient()
  const { data: alert, error } = await supabase
    .from('alerts')
    .select('fact_check_claims')
    .eq('id', alertId)
    .single()
  if (error) throw error

  const claims = Array.isArray(alert?.fact_check_claims)
    ? (alert.fact_check_claims as VerifyClaim[])
    : []
  if (claimIndex < 0 || claimIndex >= claims.length) return

  const updated = claims.map((c, i) => (i === claimIndex ? { ...c, acknowledged: true } : c))
  await updateAlert(supabase, alertId, { fact_check_claims: updated })
  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${alertId}/edit`)
}

export async function publishAlertAction(id: string): Promise<void> {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)

  // Writer redesign — gate check before publish. Overrides logged in
  // alert_overrides count as pass. If a gate fails, throw — the form will
  // surface the error via Next's error boundary, and admin can use
  // overrideAndPublishAlertAction to bypass with a reason.
  const gates = await checkAlertGates(supabase, prev)
  if (!gates.canPublish) {
    throw new Error(
      `Publish blocked by gates: ${gates.failures.join(' · ')}. ` +
        `Use Override & Publish (with a reason) to bypass.`
    )
  }

  const now = new Date().toISOString()
  const shortSlug = await ensureShortSlug(supabase, prev as { id: string; title: string; short_slug?: string | null })
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: now,
    decided_at: now,
    ...(shortSlug ? { short_slug: shortSlug } : {}),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  await revalidateAlertPaths(supabase, id, prev.slug)
  redirect('/admin/alerts')
}

/**
 * Override one or more publish gates with a written reason, then publish.
 * Each override is logged in alert_overrides for audit. The reason field
 * must be a non-empty string — UI surfaces a textarea for it.
 */
export async function overrideAndPublishAlertAction(
  id: string,
  overrides: Array<{ gate: OverrideGate; reason: string }>
): Promise<void> {
  const supabase = createAdminClient()
  for (const o of overrides) {
    const res = await logAlertOverride(supabase, {
      alertId: id,
      gate: o.gate,
      reason: o.reason,
    })
    if (!res.ok) {
      throw new Error(`Override logging failed: ${res.error}`)
    }
  }
  // Now check gates again — overrides should make canPublish=true.
  const prev = await getAlertById(supabase, id)
  const gates = await checkAlertGates(supabase, prev)
  if (!gates.canPublish) {
    throw new Error(
      `Gates still blocked after override: ${gates.failures.join(' · ')}`
    )
  }
  const now = new Date().toISOString()
  const shortSlug = await ensureShortSlug(supabase, prev as { id: string; title: string; short_slug?: string | null })
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: now,
    decided_at: now,
    ...(shortSlug ? { short_slug: shortSlug } : {}),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  await revalidateAlertPaths(supabase, id, prev.slug)
  redirect('/admin/alerts')
}

/**
 * Generate a short_slug if the alert doesn't already have one. Idempotent:
 * returns the existing slug if set. Used by publish + bulk-approve paths.
 */
async function ensureShortSlug(
  supabase: ReturnType<typeof createAdminClient>,
  alert: { id: string; title: string; short_slug?: string | null },
): Promise<string | null> {
  if (alert.short_slug) return null // already has one, don't overwrite
  try {
    const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
    return await generateUniqueShortSlug(supabase, alert.title, alert.id)
  } catch (err) {
    console.error('[ensureShortSlug] failed:', err)
    return null
  }
}

/**
 * Bulk-regenerate every pending_review alert from the last `daysWindow` days
 * through the new writer pipeline (persona + context + voice gate). Used to
 * backfill alerts written under the old system after the writer redesign
 * shipped. Runs serially with a 250ms gap to stay under Anthropic rate
 * limits and the Resend-tier 4/sec ceiling.
 *
 * No-op when zero matches. Returns a count summary the UI can surface.
 */
export async function bulkRegeneratePendingAlertsAction(
  daysWindow = 30,
  maxAlerts = 25
): Promise<{ ok: true; processed: number; failed: number; skipped: number } | { ok: false; error: string }> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000).toISOString()
  const { data: targets, error } = await supabase
    .from('alerts')
    .select('id, source_intel_id')
    .eq('status', 'pending_review')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(maxAlerts)
  if (error) return { ok: false, error: error.message }

  let processed = 0
  let failed = 0
  let skipped = 0
  for (const row of targets ?? []) {
    if (!row.source_intel_id) {
      skipped++
      continue
    }
    try {
      const res = await regenerateAlertDraftAction(row.id as string)
      if (res.ok) processed++
      else failed++
    } catch (err) {
      console.error('[bulkRegenerate] failed for', row.id, err)
      failed++
    }
    // Small delay between calls to avoid hammering the Anthropic API.
    await new Promise((r) => setTimeout(r, 250))
  }
  revalidatePath('/admin/alerts')
  return { ok: true, processed, failed, skipped }
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  const now = new Date().toISOString()
  const shortSlug = await ensureShortSlug(supabase, prev as { id: string; title: string; short_slug?: string | null })
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: now,
    approved_at: now,
    decided_at: now,
    ...(shortSlug ? { short_slug: shortSlug } : {}),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  await revalidateAlertPaths(supabase, id, prev.slug)
  redirect('/admin/alerts')
}

export async function bulkApproveIntelAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  for (const id of ids) {
    const prev = await getAlertById(supabase, id).catch(() => null)
    if (!prev) continue
    if (prev.status === 'published') continue
    const shortSlug = await ensureShortSlug(supabase, prev as { id: string; title: string; short_slug?: string | null })
    await updateAlert(supabase, id, {
      status: 'published',
      published_at: now,
      approved_at: now,
      decided_at: now,
      ...(shortSlug ? { short_slug: shortSlug } : {}),
    })
    await trackSourceApprovalIfNeeded(supabase, prev, 'published')
    await revalidateAlertPaths(supabase, id, prev.slug)
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function bulkRejectAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  for (const id of ids) {
    await updateAlert(supabase, id, { status: 'rejected', decided_at: now }).catch(() => {})
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function rejectAlertAction(id: string) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await updateAlert(supabase, id, {
    status: 'rejected',
    decided_at: now,
  })
  redirect('/admin/alerts')
}

/**
 * Soft-reject (Phase 2): "not now, but check back in N days." Sets a
 * revisit_after timestamp; Scout's dedup keeps suppressing similar findings
 * until that timestamp passes.
 */
export async function softRejectAlertAction(id: string, days: number) {
  const supabase = createAdminClient()
  const safeDays = Math.max(1, Math.min(180, Math.round(days)))
  const now = new Date()
  const revisitAfter = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000).toISOString()
  await updateAlert(supabase, id, {
    status: 'soft_rejected',
    decided_at: now.toISOString(),
    revisit_after: revisitAfter,
  })
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export interface RegenerateResult {
  ok: boolean
  error?: string
  verdictCounts?: { likely_correct: number; likely_wrong: number; unverifiable: number; supported: number }
}

// Re-runs the stager (writeAlertDraft + program tagging + fact-check) against
// the original intel raw_text using current rules. Overwrites title/summary/
// description/action_type/dates/programs and appends a 'regenerate' entry to
// revision_log with the prior copy so you can eyeball before/after.
export async function regenerateAlertDraftAction(alertId: string): Promise<RegenerateResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, summary, description, source_url, source_intel_id, revision_log, gaps, verified_terms')
    .eq('id', alertId)
    .maybeSingle()
  if (alertErr || !alert) return { ok: false, error: alertErr?.message ?? 'alert not found' }
  if (!alert.source_intel_id) return { ok: false, error: 'alert has no source_intel_id — cannot regenerate' }

  const [intelRes, programsRes, recentRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, alert_type, programs')
      .eq('id', alert.source_intel_id as string)
      .maybeSingle(),
    supabase
      .from('programs')
      .select('id, slug, name, type, intro, transfer_partners, sweet_spots, quirks, how_to_spend, tier_benefits, lounge_access'),
    supabase
      .from('alerts')
      .select('title, summary')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  if (intelRes.error || !intelRes.data) {
    return { ok: false, error: intelRes.error?.message ?? 'intel_item not found' }
  }
  if (programsRes.error) return { ok: false, error: programsRes.error.message }

  const intel = intelRes.data
  const allPrograms = (programsRes.data ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    type: p.type as string,
    intro: (p.intro as string | null) ?? null,
    transfer_partners: (p.transfer_partners as Array<Record<string, unknown>> | null) ?? null,
    sweet_spots: (p.sweet_spots as string | null) ?? null,
    quirks: (p.quirks as string | null) ?? null,
    how_to_spend: (p.how_to_spend as string | null) ?? null,
    tier_benefits: (p.tier_benefits as Array<Record<string, unknown>> | null) ?? null,
    lounge_access: (p.lounge_access as string | null) ?? null,
  }))
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const recentSamples = (recentRes.data ?? []).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  // Resolve the intel-tagged programs (kept for downstream use in primary/
  // secondary ID lookup, alliance context, etc.). The actual extra_context
  // construction is delegated to buildExtraContext below — same util used
  // by build-brief on first drafts, so regenerate and first-draft stay in
  // sync.
  const intelProgramSlugs = (intel.programs as string[] | null) ?? []
  const intelPrograms = intelProgramSlugs
    .map((slug) => programBySlug.get(slug))
    .filter((p): p is typeof allPrograms[number] => !!p)

  // Preserve existing gaps for the merge logic later in this function.
  const existingGaps: AlertGap[] = Array.isArray(alert.gaps)
    ? (alert.gaps as AlertGap[]).filter(
        (g) => g && typeof g === 'object' && typeof g.field === 'string'
      )
    : []

  // Build the writer payload: program Page content + concurrent active
  // offers + verified T&Cs + admin-filled gap values. Shared with first-
  // draft path in app/api/build-brief.
  const verifiedTermsRaw = (alert.verified_terms as string | null) ?? null
  const { extra_context, faq_program_slugs } = await buildExtraContext(supabase, {
    programSlugs: intelProgramSlugs,
    verifiedTerms: verifiedTermsRaw,
    filledGaps: existingGaps,
    excludeAlertId: alertId,
  })

  // Fetch alliance context once for both writer + fact-checker passes.
  // Reads programs.alliance for each tagged program; if any belong to
  // oneworld / SkyTeam / Star Alliance, format that alliance's content
  // (intro, sweet spots, lounge ruleset, tier crossover, member airlines,
  // quirks) as a markdown block. Null when no aligned programs.
  const alliance_context = await loadAllianceContextForPrograms(
    supabase,
    intelPrograms.map((p) => p.id)
  )

  // Write → edit → voice-check with one retry on voice failure. The voice
  // check scores the post-edit draft against the c4p-writer persona; if it
  // fails (score < 4, banned phrases, hyphen-pause, or sounds_like_ai),
  // re-runs the writer with the specific issues fed back. Cap at 1 retry.
  let wec
  try {
    wec = await writeEditCheck({
      intel: {
        intel_id: intel.id as string,
        headline: intel.headline as string,
        raw_text: (intel.raw_text as string | null) ?? null,
        source_name: intel.source_name as string,
        source_url: (intel.source_url as string | null) ?? null,
        alert_type: intel.alert_type,
        programs: intel.programs as string[] | null,
      },
      programs: allPrograms,
      recent_samples: recentSamples,
      extra_context,
      alliance_context,
    })
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:writeDraft', err, { alert_id: alertId })
    return { ok: false, error: errMessage(err) }
  }
  const draft = wec.draft
  if (!draft) return { ok: false, error: 'writeAlertDraft returned null' }
  if (wec.voice && !wec.voice.passed) {
    console.warn('[alerts:regenerate] voice gate failed after retry', {
      alert_id: alertId,
      score: wec.voice.score,
      issues: wec.voice.issues,
      banned: wec.voice.banned_phrases_found,
    })
  }

  const primaryId = draft.primary_program_slug
    ? programBySlug.get(draft.primary_program_slug)?.id ?? null
    : null
  const secondaryIds = draft.secondary_program_slugs
    .map((s) => programBySlug.get(s)?.id)
    .filter((x): x is string => typeof x === 'string')

  const existingLog = Array.isArray(alert.revision_log)
    ? (alert.revision_log as Array<Record<string, unknown>>)
    : []
  const nextIter = existingLog.reduce((m, e) => Math.max(m, (e.iter as number | undefined) ?? 0), 0) + 1
  const regenEntry = {
    iter: nextIter,
    kind: 'regenerate' as const,
    at: new Date().toISOString(),
    prev: {
      title: (alert.title as string) ?? '',
      summary: (alert.summary as string) ?? '',
      description: (alert.description as string | null) ?? null,
    },
    faq_program_slugs,
  }

  // Merge writer-flagged gaps with any existing admin fills.
  // - Field newly flagged → add as { field, filled: null }
  // - Field still flagged AND previously filled → preserve fill (rare; writer
  //   should have absorbed it via the verified-gap-fields block, but if the
  //   writer re-flags despite the fill we keep admin's input around)
  // - Field no longer flagged → drop entirely (writer either filled it from
  //   source or admin's fill was absorbed)
  const flaggedNow = new Set(draft.gaps_acknowledged)
  const filledLookup = new Map(existingGaps.map((g) => [g.field, g.filled]))
  const mergedGaps: AlertGap[] = Array.from(flaggedNow).map((field) => ({
    field,
    filled: filledLookup.get(field) ?? null,
  }))

  try {
    const voiceNotesPayload = wec.voice
      ? JSON.stringify({
          banned_phrases_found: wec.voice.banned_phrases_found,
          em_dash_count: wec.voice.em_dash_count,
          hyphen_pause_count: wec.voice.hyphen_pause_count,
          sounds_like_ai: wec.voice.sounds_like_ai,
          issues: wec.voice.issues,
          retried: wec.retried,
        })
      : null
    await updateAlert(supabase, alertId, {
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      action_type: draft.action_type,
      primary_program_id: primaryId,
      start_date: draft.start_date,
      end_date: draft.end_date,
      revision_log: [...existingLog, regenEntry],
      gaps: mergedGaps,
      // Writer redesign — voice gate result + context-load timestamp.
      voice_pass: wec.voice?.passed ?? null,
      voice_score: wec.voice?.score ?? null,
      voice_lead_mode: wec.voice?.lead_mode_detected ?? null,
      voice_notes: voiceNotesPayload,
      voice_checked_at: wec.voice ? new Date().toISOString() : null,
      context_loaded_at: new Date().toISOString(),
    })
    await setAlertPrograms(supabase, alertId, secondaryIds)
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:persist', err, { alert_id: alertId })
    return { ok: false, error: errMessage(err) }
  }

  let finalClaims: VerifyClaim[] = []
  let checkedAt: string | null = null
  let reviseLog: RevisionLogEntry[] = []
  try {
    const draftText = `${draft.title}\n${draft.summary}\n${draft.description ?? ''}`
    const programReference = await buildProgramReferenceForDraft(supabase, primaryId, draftText)
    const verify = await verifyAlertDraft({
      draft: { title: draft.title, summary: draft.summary, description: draft.description },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      alert_type: intel.alert_type,
      program_reference: programReference,
      alliance_context,
      gaps_acknowledged: draft.gaps_acknowledged,
      verified_terms: verifiedTermsRaw,
      extra_context,
    })
    if (verify) {
      finalClaims = verify.claims
      checkedAt = verify.checked_at
      if (finalClaims.some((c) => !isSupported(c))) {
        try {
          finalClaims = await webVerifyClaims({
            claims: finalClaims,
            context: {
              title: draft.title,
              source_url: (intel.source_url as string | null) ?? null,
              verified_terms: verifiedTermsRaw,
            },
          })
        } catch (err) {
          await logSystemError(supabase, 'alerts:regenerate:webVerify', err, { alert_id: alertId })
          finalClaims = finalClaims.map((c) =>
            isSupported(c)
              ? c
              : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
          )
        }
      }

      // Revise loop — parity with build-brief. Rewrite likely_wrong claims
      // up to REGEN_REVISE_MAX_ITERS times. Each pass: revise → persist →
      // re-verify → re-webVerify. Exits early if no likely_wrong remain.
      const REGEN_REVISE_MAX_ITERS = 2
      let workingDraft = {
        title: draft.title,
        summary: draft.summary,
        description: draft.description,
      }
      let iter = 0
      while (iter < REGEN_REVISE_MAX_ITERS) {
        const likelyWrong = finalClaims.filter((c) => c.web_verdict === 'likely_wrong')
        if (likelyWrong.length === 0) break
        iter++
        try {
          const revised = await reviseAlertDraft({
            draft: workingDraft,
            problem_claims: likelyWrong,
            source_url: (intel.source_url as string | null) ?? null,
            iter,
          })
          workingDraft = revised.revised
          reviseLog = [...reviseLog, ...revised.log]

          await updateAlert(supabase, alertId, {
            title: workingDraft.title,
            summary: workingDraft.summary,
            description: workingDraft.description,
          })

          const reverifyDraftText = `${workingDraft.title}\n${workingDraft.summary}\n${workingDraft.description ?? ''}`
          const reverifyProgramReference = await buildProgramReferenceForDraft(
            supabase,
            primaryId,
            reverifyDraftText
          )
          const reverify = await verifyAlertDraft({
            draft: workingDraft,
            raw_text: (intel.raw_text as string | null) ?? null,
            source_url: (intel.source_url as string | null) ?? null,
            alert_type: intel.alert_type,
            program_reference: reverifyProgramReference,
            alliance_context,
            gaps_acknowledged: draft.gaps_acknowledged,
            verified_terms: verifiedTermsRaw,
            extra_context,
          })
          if (!reverify) break
          let reverified = reverify.claims
          checkedAt = reverify.checked_at
          if (reverified.some((c) => !isSupported(c))) {
            try {
              reverified = await webVerifyClaims({
                claims: reverified,
                context: {
                  title: workingDraft.title,
                  source_url: (intel.source_url as string | null) ?? null,
                  verified_terms: verifiedTermsRaw,
                },
              })
            } catch (err) {
              await logSystemError(supabase, 'alerts:regenerate:webVerify:post-revise', err, {
                alert_id: alertId,
                iter,
              })
              reverified = reverified.map((c) =>
                isSupported(c)
                  ? c
                  : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
              )
              finalClaims = reverified
              break
            }
          }
          finalClaims = reverified
        } catch (err) {
          await logSystemError(supabase, 'alerts:regenerate:reviseAlertDraft', err, {
            alert_id: alertId,
            iter,
          })
          break
        }
      }

      await updateAlert(supabase, alertId, {
        fact_check_claims: finalClaims,
        fact_check_at: checkedAt,
      })
    }
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:verify', err, { alert_id: alertId })
  }

  // Append any revise log entries to the revision_log we already wrote
  // (which contains the 'regenerate' prev-snapshot entry).
  if (reviseLog.length > 0) {
    try {
      const { data: fresh } = await supabase
        .from('alerts')
        .select('revision_log')
        .eq('id', alertId)
        .maybeSingle()
      const current = Array.isArray(fresh?.revision_log)
        ? (fresh!.revision_log as Array<Record<string, unknown>>)
        : []
      await updateAlert(supabase, alertId, {
        revision_log: [...current, ...reviseLog],
      })
    } catch (err) {
      await logSystemError(supabase, 'alerts:regenerate:revision_log_append', err, {
        alert_id: alertId,
      })
    }
  }

  const verdictCounts = { likely_correct: 0, likely_wrong: 0, unverifiable: 0, supported: 0 }
  for (const c of finalClaims) {
    if (isSupported(c)) verdictCounts.supported++
    else if (c.web_verdict === 'likely_correct') verdictCounts.likely_correct++
    else if (c.web_verdict === 'likely_wrong') verdictCounts.likely_wrong++
    else verdictCounts.unverifiable++
  }

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${alertId}/edit`)
  return { ok: true, verdictCounts }
}

export async function expireAlertAction(id: string) {
  const supabase = createAdminClient()
  await expireAlert(supabase, id)
  redirect('/admin/alerts')
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 5b — bring brand voice + originality checks to alerts.
// Reuses voiceCheckArticle + originalityCheck from blog drafts; the body
// passed in is the alert's description (or summary if description is empty).
// ────────────────────────────────────────────────────────────────────────────

export type AlertVoiceCheckResult =
  | { ok: true; pass: boolean }
  | { ok: false; error: string }

/**
 * Apply the voice checker's failure notes back to the article body via a
 * surgical AI edit, save the revised description, and re-run the voice
 * check. Faster than re-running the full pipeline because writer +
 * fact-check + originality don't need to re-execute.
 */
export type AlertQuickFixVoiceResult =
  | { ok: true; pass: boolean }
  | { ok: false; error: string }

export async function quickFixVoiceAlertAction(id: string): Promise<AlertQuickFixVoiceResult> {
  const { voiceFixArticle } = await import('@/utils/ai/voiceFixArticle')
  const supabase = createAdminClient()
  const { data: alert } = await supabase
    .from('alerts')
    .select('id, title, description, voice_notes, voice_pass')
    .eq('id', id)
    .single()
  if (!alert) return { ok: false, error: 'Alert not found' }
  if (!alert.description || !alert.description.trim()) {
    return { ok: false, error: 'No description to fix' }
  }
  if (alert.voice_pass !== false || !alert.voice_notes) {
    return { ok: false, error: 'No voice failure notes to apply (voice check has not failed)' }
  }

  const fix = await voiceFixArticle({
    title: alert.title as string,
    article_body: alert.description as string,
    voice_notes: alert.voice_notes as string,
  })
  if (!fix) return { ok: false, error: 'Quick-fix call failed (see logs)' }

  const { error: updateErr } = await supabase
    .from('alerts')
    .update({
      description: fix.article_body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  // Re-run the voice check against the revised body. If it still fails,
  // surface the new notes; if it passes, the pill flips green.
  const recheck = await voiceCheckAlertAction(id)
  if (!recheck.ok) return { ok: false, error: `voice re-check failed — ${recheck.error}` }

  revalidatePath(`/admin/alerts/${id}/edit`)
  return { ok: true, pass: recheck.pass }
}

export type AlertFactCheckResult =
  | { ok: true; flagged: number; total: number }
  | { ok: false; error: string }

/**
 * Run only the fact-checker on the alert's CURRENT persisted draft. Does
 * NOT touch the writer — admin edits to title/summary/description are
 * preserved. Used by the "Fact-check" button on the Pipeline Actions
 * panel after the admin hand-edits a draft and wants to re-verify
 * without losing their edits to a fresh regenerate.
 *
 * Same verification surface as regenerate: raw_text + verified_terms +
 * extra_context + program_reference + alliance_context.
 */
export async function factCheckAlertAction(id: string): Promise<AlertFactCheckResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, summary, description, source_url, source_intel_id, verified_terms, primary_program_id')
    .eq('id', id)
    .maybeSingle()
  if (alertErr || !alert) return { ok: false, error: alertErr?.message ?? 'alert not found' }
  if (!alert.source_intel_id) return { ok: false, error: 'alert has no source_intel_id — cannot fact-check' }

  const { data: intel, error: intelErr } = await supabase
    .from('intel_items')
    .select('raw_text, source_url, alert_type, programs')
    .eq('id', alert.source_intel_id as string)
    .maybeSingle()
  if (intelErr || !intel) return { ok: false, error: intelErr?.message ?? 'intel_item not found' }

  const programSlugs = (intel.programs as string[] | null) ?? []
  const { extra_context } = await buildExtraContext(supabase, {
    programSlugs,
    verifiedTerms: (alert.verified_terms as string | null) ?? null,
    excludeAlertId: id,
  })

  const draftText = `${alert.title}\n${alert.summary}\n${alert.description ?? ''}`
  const programReference = await buildProgramReferenceForDraft(
    supabase,
    alert.primary_program_id as string | null,
    draftText
  )

  // Look up tagged program IDs for alliance context lookup.
  const { data: taggedRows } = await supabase
    .from('alert_programs')
    .select('program_id')
    .eq('alert_id', id)
  const programIds = (taggedRows ?? [])
    .map((r) => (r as { program_id: string }).program_id)
    .filter(Boolean)
  const alliance_context = await loadAllianceContextForPrograms(supabase, programIds)

  let verify
  try {
    verify = await verifyAlertDraft({
      draft: { title: alert.title, summary: alert.summary, description: alert.description },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      alert_type: intel.alert_type,
      program_reference: programReference,
      alliance_context,
      verified_terms: (alert.verified_terms as string | null) ?? null,
      extra_context,
    })
  } catch (err) {
    await logSystemError(supabase, 'alerts:factCheck:verify', err, { alert_id: id })
    return { ok: false, error: errMessage(err) }
  }
  if (!verify) return { ok: false, error: 'verifyAlertDraft returned null' }

  let finalClaims = verify.claims
  if (finalClaims.some((c) => !isSupported(c))) {
    try {
      finalClaims = await webVerifyClaims({
        claims: finalClaims,
        context: {
          title: alert.title,
          source_url: (intel.source_url as string | null) ?? null,
          verified_terms: (alert.verified_terms as string | null) ?? null,
        },
      })
    } catch (err) {
      await logSystemError(supabase, 'alerts:factCheck:webVerify', err, { alert_id: id })
      finalClaims = finalClaims.map((c) =>
        isSupported(c) ? c : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
      )
    }
  }

  await updateAlert(supabase, id, {
    fact_check_claims: finalClaims,
    fact_check_at: verify.checked_at,
  })

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)

  const total = finalClaims.length
  const flagged = highSeverityUnsupported(finalClaims).length
  return { ok: true, flagged, total }
}

export async function voiceCheckAlertAction(id: string): Promise<AlertVoiceCheckResult> {
  const supabase = createAdminClient()
  const { data: alert } = await supabase
    .from('alerts')
    .select('id, title, description, summary')
    .eq('id', id)
    .single()
  if (!alert) return { ok: false, error: 'Alert not found' }
  const body = alert.description || alert.summary || ''
  if (!body.trim()) return { ok: false, error: 'No description or summary to check' }

  const res = await voiceCheckArticle({ title: alert.title, article_body: body })
  if (!res) return { ok: false, error: 'Voice-check call failed (see logs)' }

  const { error } = await supabase
    .from('alerts')
    .update({
      voice_checked_at: res.checked_at,
      voice_pass: res.pass,
      voice_notes: res.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)
  return { ok: true, pass: res.pass }
}

export type AlertOriginalityCheckResult =
  | { ok: true; pass: boolean; notes: string }
  | { ok: false; error: string }

export async function originalityCheckAlertAction(id: string): Promise<AlertOriginalityCheckResult> {
  const supabase = createAdminClient()
  const { data: alert } = await supabase
    .from('alerts')
    .select('id, title, description, summary, source_intel_id, source_url')
    .eq('id', id)
    .single()
  if (!alert) return { ok: false, error: 'Alert not found' }
  const body = alert.description || alert.summary || ''
  if (!body.trim()) return { ok: false, error: 'No description or summary to check' }

  // v3 — fetch the intel raw_text the alert was drafted from. Originality
  // check now compares against the source, not the open web.
  const sources: { url: string | null; text: string }[] = []
  if (alert.source_intel_id) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text, source_url')
      .eq('id', alert.source_intel_id)
      .single()
    if (intel?.raw_text) {
      sources.push({ url: intel.source_url ?? alert.source_url ?? null, text: intel.raw_text })
    }
  }
  if (sources.length === 0) {
    return { ok: false, error: 'No source intel to check against — manual alerts skip this check.' }
  }

  const res = await originalityCheck({ title: alert.title, article_body: body, sources })
  if (!res) return { ok: false, error: 'Originality check failed (see logs)' }

  const { error } = await supabase
    .from('alerts')
    .update({
      originality_checked_at: res.checked_at,
      originality_pass: res.pass,
      originality_notes: res.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)
  return { ok: true, pass: res.pass, notes: res.notes }
}

/**
 * One-click pipeline for alerts. Runs Regenerate (writer + fact-check + web
 * verify) → voice + originality in parallel. Same shape as runAllChecksAction
 * for blog drafts.
 */
export type AlertPipelineResult =
  | {
      ok: true
      regenerated: boolean
      facts: { ran: boolean; flagged: number; error?: string }
      voice: { ran: boolean; pass: boolean; error?: string }
      originality: { ran: boolean; pass: boolean; error?: string }
      ready: boolean
    }
  | { ok: false; error: string }

/**
 * Save verified_terms (or any unsaved edit-form value) FIRST, then run the
 * full pipeline. Prevents the "I pasted T&Cs but the writer didn't see them"
 * bug: regenerateAlertDraftAction reads alert.verified_terms from the DB,
 * which is only populated after the user clicks "Save Changes". This action
 * persists the field before regen so admins can iterate without that extra
 * click.
 */
export async function saveAndRunAllChecksAction(
  id: string,
  verifiedTerms: string,
  termsWaivedReason?: string,
): Promise<AlertPipelineResult> {
  const supabase = createAdminClient()
  const persistRes = await persistTermsFields(supabase, id, verifiedTerms, termsWaivedReason)
  if (!persistRes.ok) return persistRes
  // Then run the full pipeline as usual.
  return runAllChecksAlertAction(id)
}

/**
 * Save the verified_terms + terms_waived_reason fields, then regenerate
 * the writer only (no voice / originality / extra-checks pass). The
 * regenerate path internally runs writer + edit + voice-check + fact-check,
 * but skips the standalone voiceCheckArticle + originalityCheck steps.
 *
 * Pairs with the "Save & regenerate" button on the alert edit page —
 * useful when admin wants a fresh draft after pasting/tweaking T&Cs
 * without paying for the full pipeline.
 */
export async function saveTermsAndRegenerateAction(
  id: string,
  verifiedTerms: string,
  termsWaivedReason?: string,
): Promise<RegenerateResult> {
  const supabase = createAdminClient()
  const persistRes = await persistTermsFields(supabase, id, verifiedTerms, termsWaivedReason)
  if (!persistRes.ok) return { ok: false, error: persistRes.error }
  return regenerateAlertDraftAction(id)
}

async function persistTermsFields(
  supabase: SupabaseClient,
  id: string,
  verifiedTerms: string,
  termsWaivedReason: string | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const v = verifiedTerms.trim()
  const w = (termsWaivedReason ?? '').trim()
  const { error } = await supabase
    .from('alerts')
    .update({
      verified_terms: v.length > 0 ? v : null,
      terms_waived_reason: w.length > 0 ? w : null,
    })
    .eq('id', id)
  if (error) return { ok: false, error: `save terms failed — ${error.message}` }
  return { ok: true }
}

export async function runAllChecksAlertAction(id: string): Promise<AlertPipelineResult> {
  // Regenerate already runs writer + fact-check + web-verify in one shot.
  const regen = await regenerateAlertDraftAction(id)
  if (!regen.ok) {
    return { ok: false, error: `regenerate failed — ${regen.error ?? 'unknown'}` }
  }

  const [voiceRes, origRes] = await Promise.all([
    voiceCheckAlertAction(id),
    originalityCheckAlertAction(id),
  ])

  const counts = regen.verdictCounts ?? { likely_correct: 0, likely_wrong: 0, unverifiable: 0, supported: 0 }
  // "Flagged" for the alert pipeline = high-severity unsupported claims that
  // web-verify scored likely_wrong. Other unsupported (unverifiable) is noise.
  const flagged = counts.likely_wrong

  const facts = { ran: true, flagged }
  const voice = voiceRes.ok
    ? { ran: true, pass: voiceRes.pass }
    : { ran: false, pass: false, error: voiceRes.error }
  const originality = origRes.ok
    ? { ran: true, pass: origRes.pass }
    : { ran: false, pass: false, error: origRes.error }

  const ready = facts.flagged === 0 && voice.ran && voice.pass && originality.ran && originality.pass

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)
  return { ok: true, regenerated: true, facts, voice, originality, ready }
}
