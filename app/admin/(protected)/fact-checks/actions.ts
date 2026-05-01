'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyAlertDraft, webVerifyClaims, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { buildProgramReferenceForDraft } from '@/utils/ai/programReferenceData'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import { logSystemError, loadAllianceContextForPrograms, type AlertType } from '@/utils/supabase/queries'

export interface ReverifyResult {
  ok: boolean
  error?: string
  verdictCounts?: { likely_correct: number; likely_wrong: number; unverifiable: number }
}

export interface ReviseActionResult {
  ok: boolean
  error?: string
  revisionCount?: number
  residualLikelyWrong?: number
}

// Re-run the webVerifyClaims pass on a single alert's stored fact-check claims.
// Sidesteps the build-brief 300s budget — called directly from the fact-checks
// admin page when the original brief run's web-verify step failed or was skipped.
export async function reverifyAlertClaimsAction(alertId: string): Promise<ReverifyResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, source_url, fact_check_claims')
    .eq('id', alertId)
    .maybeSingle()

  if (alertErr || !alert) {
    return { ok: false, error: alertErr?.message ?? 'alert not found' }
  }

  const claims = Array.isArray(alert.fact_check_claims)
    ? (alert.fact_check_claims as VerifyClaim[])
    : []
  if (claims.length === 0) return { ok: false, error: 'alert has no fact_check_claims' }
  if (!claims.some((c) => !c.supported)) {
    return { ok: false, error: 'no unsupported claims to re-verify' }
  }

  let grounded: VerifyClaim[]
  try {
    grounded = await webVerifyClaims({
      claims,
      context: {
        title: (alert.title as string) ?? '',
        source_url: (alert.source_url as string | null) ?? null,
      },
    })
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reverifyAlertClaims', err, {
      alert_id: alertId,
      title: alert.title,
    })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const { error: updErr } = await supabase
    .from('alerts')
    .update({ fact_check_claims: grounded })
    .eq('id', alertId)

  if (updErr) return { ok: false, error: updErr.message }

  const verdictCounts = { likely_correct: 0, likely_wrong: 0, unverifiable: 0 }
  for (const c of grounded) {
    if (c.web_verdict === 'likely_correct') verdictCounts.likely_correct++
    else if (c.web_verdict === 'likely_wrong') verdictCounts.likely_wrong++
    else if (c.web_verdict === 'unverifiable') verdictCounts.unverifiable++
  }

  revalidatePath('/admin/fact-checks')
  return { ok: true, verdictCounts }
}

// Standalone one-shot reviser — rewrites an alert's draft based on stored
// `likely_wrong` claims, persists revised copy + appends to revision_log,
// then re-runs verify + webVerify to refresh claim verdicts. Sidesteps the
// build-brief 300s budget when the original run skipped or failed revision.
export async function reviseAlertAction(alertId: string): Promise<ReviseActionResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, summary, description, type, source_url, source_intel_id, fact_check_claims, revision_log, primary_program_id')
    .eq('id', alertId)
    .maybeSingle()

  if (alertErr || !alert) {
    return { ok: false, error: alertErr?.message ?? 'alert not found' }
  }

  const claims = Array.isArray(alert.fact_check_claims)
    ? (alert.fact_check_claims as VerifyClaim[])
    : []
  const problemClaims = claims.filter((c) => c.web_verdict === 'likely_wrong')
  if (problemClaims.length === 0) {
    return { ok: false, error: 'no likely_wrong claims to revise' }
  }

  let rawText: string | null = null
  if (alert.source_intel_id) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text')
      .eq('id', alert.source_intel_id as string)
      .maybeSingle()
    rawText = (intel?.raw_text as string | null) ?? null
  }

  const existingLog = Array.isArray(alert.revision_log)
    ? (alert.revision_log as RevisionLogEntry[])
    : []
  const nextIter = existingLog.reduce((m, e) => Math.max(m, e.iter ?? 0), 0) + 1

  const draft = {
    title: (alert.title as string) ?? '',
    summary: (alert.summary as string) ?? '',
    description: (alert.description as string | null) ?? null,
  }

  let revised
  try {
    revised = await reviseAlertDraft({
      draft,
      problem_claims: problemClaims,
      source_url: (alert.source_url as string | null) ?? null,
      iter: nextIter,
    })
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reviseAlert', err, { alert_id: alertId })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const mergedLog = [...existingLog, ...revised.log]

  const { error: updErr } = await supabase
    .from('alerts')
    .update({
      title: revised.revised.title,
      summary: revised.revised.summary,
      description: revised.revised.description,
      revision_log: mergedLog,
    })
    .eq('id', alertId)
  if (updErr) return { ok: false, error: updErr.message }

  // Re-run fact-check on the new draft to refresh claim verdicts.
  let refreshed: VerifyClaim[] = []
  try {
    const reverifyDraftText = `${revised.revised.title}\n${revised.revised.summary}\n${revised.revised.description ?? ''}`
    const programReference = await buildProgramReferenceForDraft(
      supabase,
      (alert.primary_program_id as string | null) ?? null,
      reverifyDraftText
    )
    const primaryId = (alert.primary_program_id as string | null) ?? null
    const alliance_context = await loadAllianceContextForPrograms(
      supabase,
      primaryId ? [primaryId] : []
    )
    const reverify = await verifyAlertDraft({
      draft: revised.revised,
      raw_text: rawText,
      source_url: (alert.source_url as string | null) ?? null,
      alert_type: (alert.type as AlertType | null) ?? null,
      program_reference: programReference,
      alliance_context,
    })
    const newClaims = reverify?.claims ?? []
    if (newClaims.some((c) => !c.supported)) {
      refreshed = await webVerifyClaims({
        claims: newClaims,
        context: {
          title: revised.revised.title,
          source_url: (alert.source_url as string | null) ?? null,
        },
      })
    } else {
      refreshed = newClaims
    }
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reviseAlert:reverify', err, { alert_id: alertId })
    // Revision itself succeeded; report residual as unknown.
    revalidatePath('/admin/fact-checks')
    return { ok: true, revisionCount: revised.log.length, residualLikelyWrong: -1 }
  }

  await supabase
    .from('alerts')
    .update({ fact_check_claims: refreshed, fact_check_at: new Date().toISOString() })
    .eq('id', alertId)

  const residual = refreshed.filter((c) => c.web_verdict === 'likely_wrong').length

  revalidatePath('/admin/fact-checks')
  return { ok: true, revisionCount: revised.log.length, residualLikelyWrong: residual }
}
