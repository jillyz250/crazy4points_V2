'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyAlertDraft, webVerifyClaims, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { buildProgramReferenceForDraft } from '@/utils/ai/programReferenceData'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import { logSystemError, loadAllianceContextForPrograms, type AlertType } from '@/utils/supabase/queries'
import { findVariantByAlertId } from '@/utils/content/writeAlertVariant'

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

/**
 * Wave 3a rewrite: reads from the variant/topic; writes to topic.fact_ledger
 * (which the variants→alerts trigger mirrors to alerts.fact_check_claims) and
 * touches the variant so the trigger fires.
 *
 * Direct writes to alerts are now blocked by the G6 trigger; everything flows
 * through content_variants + topics.
 */
export async function reverifyAlertClaimsAction(alertId: string): Promise<ReverifyResult> {
  const supabase = createAdminClient()

  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) return { ok: false, error: 'alert not found (no matching topic/variant)' }

  const { data: topic } = await supabase
    .from('topics')
    .select('id, title, source_urls, fact_ledger')
    .eq('id', refs.topic_id)
    .single()
  // Pull verified_terms from the variant — Sonnet's web-verify pass should
  // check pasted T&Cs first before issuing a web search.
  const { data: variantMeta } = await supabase
    .from('content_variants')
    .select('metadata')
    .eq('id', refs.variant_id)
    .single()
  const verifiedTerms =
    (variantMeta?.metadata as { verified_terms?: string } | null)?.verified_terms ?? null

  const claims = Array.isArray(topic?.fact_ledger) ? (topic.fact_ledger as VerifyClaim[]) : []
  if (claims.length === 0) return { ok: false, error: 'alert has no fact_check_claims' }
  if (!claims.some((c) => !c.supported)) {
    return { ok: false, error: 'no unsupported claims to re-verify' }
  }

  let grounded: VerifyClaim[]
  try {
    grounded = await webVerifyClaims({
      claims,
      context: {
        title: (topic?.title as string) ?? '',
        source_url: Array.isArray(topic?.source_urls) && topic.source_urls.length > 0 ? topic.source_urls[0] : null,
        verified_terms: verifiedTerms,
      },
    })
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reverifyAlertClaims', err, {
      alert_id: alertId,
      title: topic?.title,
    })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // Update topic.fact_ledger (the new home for fact-check claims)
  const { error: tuErr } = await supabase
    .from('topics')
    .update({ fact_ledger: grounded, verified_at: new Date().toISOString() })
    .eq('id', refs.topic_id)
  if (tuErr) return { ok: false, error: tuErr.message }

  // Touch the variant so the trigger fires and mirrors the new fact_ledger
  // to alerts.fact_check_claims. Using updated_at avoids any semantic change.
  const { error: vtErr } = await supabase
    .from('content_variants')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', refs.variant_id)
  if (vtErr) return { ok: false, error: vtErr.message }

  const verdictCounts = { likely_correct: 0, likely_wrong: 0, unverifiable: 0 }
  for (const c of grounded) {
    if (c.web_verdict === 'likely_correct') verdictCounts.likely_correct++
    else if (c.web_verdict === 'likely_wrong') verdictCounts.likely_wrong++
    else if (c.web_verdict === 'unverifiable') verdictCounts.unverifiable++
  }

  revalidatePath('/admin/fact-checks')
  return { ok: true, verdictCounts }
}

/**
 * Wave 3a rewrite: reads from the variant/topic; writes title/body/metadata
 * via content_variants UPDATE (the trigger mirrors to alerts.title/description/
 * revision_log) and writes the refreshed claims to topic.fact_ledger.
 */
export async function reviseAlertAction(alertId: string): Promise<ReviseActionResult> {
  const supabase = createAdminClient()

  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) return { ok: false, error: 'alert not found (no matching topic/variant)' }

  const { data: topic } = await supabase
    .from('topics')
    .select('id, title, summary, source_urls, topic_type, fact_ledger, metadata, programs')
    .eq('id', refs.topic_id)
    .single()
  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, title, body, metadata')
    .eq('id', refs.variant_id)
    .single()

  if (!topic || !variant) return { ok: false, error: 'topic or variant missing' }

  const claims = Array.isArray(topic.fact_ledger) ? (topic.fact_ledger as VerifyClaim[]) : []
  const problemClaims = claims.filter((c) => c.web_verdict === 'likely_wrong')
  if (problemClaims.length === 0) {
    return { ok: false, error: 'no likely_wrong claims to revise' }
  }

  // Fetch raw_text from intel_items if linked (via topic.metadata.source_intel_id)
  const sourceIntelId = (topic.metadata as { source_intel_id?: string } | null)?.source_intel_id ?? null
  let rawText: string | null = null
  if (sourceIntelId) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text')
      .eq('id', sourceIntelId)
      .maybeSingle()
    rawText = (intel?.raw_text as string | null) ?? null
  }

  const existingLog = Array.isArray((variant.metadata as { revision_log?: RevisionLogEntry[] } | null)?.revision_log)
    ? ((variant.metadata as { revision_log: RevisionLogEntry[] }).revision_log)
    : []
  const nextIter = existingLog.reduce((m, e) => Math.max(m, e.iter ?? 0), 0) + 1

  const sourceUrl = Array.isArray(topic.source_urls) && topic.source_urls.length > 0 ? topic.source_urls[0] : null

  const draft = {
    title: (variant.title as string) ?? '',
    summary: (topic.summary as string) ?? '',
    description: (variant.body as string | null) ?? null,
  }

  let revised
  try {
    revised = await reviseAlertDraft({
      draft,
      problem_claims: problemClaims,
      source_url: sourceUrl,
      iter: nextIter,
    })
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reviseAlert', err, { alert_id: alertId })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const mergedLog = [...existingLog, ...revised.log]

  // Write revised title + body to variant; summary lives on topic.
  // metadata.revision_log captures the iteration log (the trigger projects
  // it back to alerts.revision_log via the metadata->revision_log mapping).
  const newVariantMeta = { ...(variant.metadata as object), revision_log: mergedLog }
  const { error: vuErr } = await supabase
    .from('content_variants')
    .update({
      title: revised.revised.title,
      body: revised.revised.description,
      metadata: newVariantMeta,
    })
    .eq('id', refs.variant_id)
  if (vuErr) return { ok: false, error: vuErr.message }

  // Update topic.summary
  const { error: tuErr } = await supabase
    .from('topics')
    .update({ summary: revised.revised.summary })
    .eq('id', refs.topic_id)
  if (tuErr) return { ok: false, error: tuErr.message }

  // Re-run fact-check on the new draft to refresh claim verdicts.
  let refreshed: VerifyClaim[] = []
  try {
    const reverifyDraftText = `${revised.revised.title}\n${revised.revised.summary}\n${revised.revised.description ?? ''}`
    const primaryProgramId = (topic.metadata as { primary_program_id?: string } | null)?.primary_program_id ?? null
    const programReference = await buildProgramReferenceForDraft(
      supabase,
      primaryProgramId,
      reverifyDraftText
    )
    const alliance_context = await loadAllianceContextForPrograms(
      supabase,
      primaryProgramId ? [primaryProgramId] : []
    )
    const verifiedTermsRevise =
      (variant.metadata as { verified_terms?: string } | null)?.verified_terms ?? null
    const reverify = await verifyAlertDraft({
      draft: revised.revised,
      raw_text: rawText,
      source_url: sourceUrl,
      alert_type: (topic.topic_type as AlertType | null) ?? null,
      program_reference: programReference,
      alliance_context,
      verified_terms: verifiedTermsRevise,
    })
    const newClaims = reverify?.claims ?? []
    if (newClaims.some((c) => !c.supported)) {
      refreshed = await webVerifyClaims({
        claims: newClaims,
        context: {
          title: revised.revised.title,
          source_url: sourceUrl,
          verified_terms: verifiedTermsRevise,
        },
      })
    } else {
      refreshed = newClaims
    }
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reviseAlert:reverify', err, { alert_id: alertId })
    revalidatePath('/admin/fact-checks')
    return { ok: true, revisionCount: revised.log.length, residualLikelyWrong: -1 }
  }

  // Write refreshed claims to topic.fact_ledger + bump verified_at, then
  // touch the variant so the trigger mirrors everything down to alerts.
  await supabase
    .from('topics')
    .update({ fact_ledger: refreshed, verified_at: new Date().toISOString() })
    .eq('id', refs.topic_id)
  await supabase
    .from('content_variants')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', refs.variant_id)

  const residual = refreshed.filter((c) => c.web_verdict === 'likely_wrong').length

  revalidatePath('/admin/fact-checks')
  return { ok: true, revisionCount: revised.log.length, residualLikelyWrong: residual }
}
