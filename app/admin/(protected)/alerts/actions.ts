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
} from '@/utils/supabase/queries'
import type { Alert, AlertStatus } from '@/utils/supabase/queries'
import type { SupabaseClient } from '@supabase/supabase-js'
import { writeAlertDraft } from '@/utils/ai/writeAlertDraft'
import { editAlertDraft } from '@/utils/ai/editAlertDraft'
import { verifyAlertDraft, webVerifyClaims, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import { enrichIntelContext } from '@/utils/ai/enrichIntelContext'

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

export async function publishAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  redirect('/admin/alerts')
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
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
    await updateAlert(supabase, id, {
      status: 'published',
      published_at: now,
      approved_at: now,
    })
    await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function bulkRejectAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  for (const id of ids) {
    await updateAlert(supabase, id, { status: 'rejected' }).catch(() => {})
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function rejectAlertAction(id: string) {
  const supabase = createAdminClient()
  await updateAlert(supabase, id, { status: 'rejected' })
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
    .select('id, title, summary, description, source_url, source_intel_id, revision_log')
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
    supabase.from('programs').select('id, slug, name, type, official_faq_url'),
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
    official_faq_url: (p.official_faq_url as string | null) ?? null,
  }))
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const recentSamples = (recentRes.data ?? []).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  // Pre-writer FAQ enrichment: fetch official FAQ pages for the programs
  // Scout tagged on this intel. 24h cache + fail-soft — on any error we
  // proceed with raw_text alone rather than block the regenerate.
  const intelProgramSlugs = (intel.programs as string[] | null) ?? []
  const intelPrograms = intelProgramSlugs
    .map((slug) => programBySlug.get(slug))
    .filter((p): p is typeof allPrograms[number] => !!p)
  let extra_context: string | null = null
  let faq_urls: string[] = []
  try {
    const enriched = await enrichIntelContext({ supabase, programs: intelPrograms })
    extra_context = enriched.extra_context
    faq_urls = enriched.fetched_urls
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:enrichIntelContext', err, { alert_id: alertId })
    // swallow — enrichment is best-effort
  }

  let draft
  try {
    draft = await writeAlertDraft({
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
    })
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:writeDraft', err, { alert_id: alertId })
    return { ok: false, error: errMessage(err) }
  }
  if (!draft) return { ok: false, error: 'writeAlertDraft returned null' }

  // Editor pass (Phase 1, polish-only) — strip AI-tells, tighten voice.
  // Falls back to writer draft on failure so regenerate still produces output.
  const edited = await editAlertDraft({
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
  })
  if (edited) {
    draft.summary = edited.summary
    draft.description = edited.description
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
    faq_urls,
  }

  try {
    await updateAlert(supabase, alertId, {
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      action_type: draft.action_type,
      primary_program_id: primaryId,
      start_date: draft.start_date,
      end_date: draft.end_date,
      revision_log: [...existingLog, regenEntry],
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
    const verify = await verifyAlertDraft({
      draft: { title: draft.title, summary: draft.summary, description: draft.description },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
    })
    if (verify) {
      finalClaims = verify.claims
      checkedAt = verify.checked_at
      if (finalClaims.some((c) => !c.supported)) {
        try {
          finalClaims = await webVerifyClaims({
            claims: finalClaims,
            context: { title: draft.title, source_url: (intel.source_url as string | null) ?? null },
          })
        } catch (err) {
          await logSystemError(supabase, 'alerts:regenerate:webVerify', err, { alert_id: alertId })
          finalClaims = finalClaims.map((c) =>
            c.supported
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

          const reverify = await verifyAlertDraft({
            draft: workingDraft,
            raw_text: (intel.raw_text as string | null) ?? null,
            source_url: (intel.source_url as string | null) ?? null,
          })
          if (!reverify) break
          let reverified = reverify.claims
          checkedAt = reverify.checked_at
          if (reverified.some((c) => !c.supported)) {
            try {
              reverified = await webVerifyClaims({
                claims: reverified,
                context: {
                  title: workingDraft.title,
                  source_url: (intel.source_url as string | null) ?? null,
                },
              })
            } catch (err) {
              await logSystemError(supabase, 'alerts:regenerate:webVerify:post-revise', err, {
                alert_id: alertId,
                iter,
              })
              reverified = reverified.map((c) =>
                c.supported
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
    if (c.supported) verdictCounts.supported++
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
