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
import { isSupported } from '@/utils/ai/claimStatus'
import { buildProgramReferenceForDraft } from '@/utils/ai/programReferenceData'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import { voiceCheckArticle } from '@/utils/ai/voiceCheckArticle'
import { originalityCheck } from '@/utils/ai/originalityCheck'

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
  const now = new Date().toISOString()
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: now,
    decided_at: now,
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  redirect('/admin/alerts')
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  const now = new Date().toISOString()
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: now,
    approved_at: now,
    decided_at: now,
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
      decided_at: now,
    })
    await trackSourceApprovalIfNeeded(supabase, prev, 'published')
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

  // Build extra_context from public Page content on each tagged program
  // (intro / transfer partners / how to spend / sweet spots / tiers /
  // lounge access / quirks). The writer treats this as authoritative —
  // more trustworthy than raw_text. Programs without Page content
  // contribute nothing; the writer falls back to raw_text for them.
  const intelProgramSlugs = (intel.programs as string[] | null) ?? []
  const intelPrograms = intelProgramSlugs
    .map((slug) => programBySlug.get(slug))
    .filter((p): p is typeof allPrograms[number] => !!p)

  function buildProgramContext(p: typeof allPrograms[number]): string | null {
    const parts: string[] = []
    if (p.intro?.trim()) parts.push(`#### About\n${p.intro.trim()}`)
    if ((p.transfer_partners?.length ?? 0) > 0) {
      const lines = p.transfer_partners!
        .map((row) => {
          const r = row as Record<string, unknown>
          const slug = typeof r.from_slug === 'string' ? r.from_slug : '?'
          const ratio = typeof r.ratio === 'string' ? r.ratio : '?'
          const notes = typeof r.notes === 'string' ? ` — ${r.notes}` : ''
          const bonus = r.bonus_active === true ? '  🔥 BONUS ACTIVE' : ''
          return `- ${slug} → ${ratio}${notes}${bonus}`
        })
        .join('\n')
      parts.push(`#### Transfer partners (inbound to ${p.name})\n${lines}`)
    }
    if (p.how_to_spend?.trim()) parts.push(`#### How to spend miles\n${p.how_to_spend.trim()}`)
    if (p.sweet_spots?.trim()) parts.push(`#### Sweet spots\n${p.sweet_spots.trim()}`)
    if ((p.tier_benefits?.length ?? 0) > 0) {
      const lines = p.tier_benefits!
        .map((row) => {
          const r = row as Record<string, unknown>
          const name = typeof r.name === 'string' ? r.name : '?'
          const qual = typeof r.qualification === 'string' ? r.qualification : ''
          const benefits = Array.isArray(r.benefits)
            ? (r.benefits as unknown[]).filter((b): b is string => typeof b === 'string')
            : []
          const qualPart = qual ? ` (${qual})` : ''
          const bensPart = benefits.length ? `: ${benefits.join('; ')}` : ''
          return `- ${name}${qualPart}${bensPart}`
        })
        .join('\n')
      parts.push(`#### Elite tiers & benefits\n${lines}`)
    }
    if (p.lounge_access?.trim()) parts.push(`#### Lounge access\n${p.lounge_access.trim()}`)
    if (p.quirks?.trim()) parts.push(`#### Tips & quirks\n${p.quirks.trim()}`)
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  const programSections = intelPrograms
    .map((p) => {
      const ctx = buildProgramContext(p)
      return ctx ? `### ${p.name}\n\n${ctx}` : null
    })
    .filter((s): s is string => !!s)

  // Phase 6a — surface currently-active transfer-bonus alerts that involve any
  // of the tagged programs. Sonnet uses these to lead the call-to-action with
  // a "use the live bonus" angle when one exists, and to mention all 1:1
  // partners (so Bilt/Capital One holders also see the alert is for them).
  let activeBonusBlock = ''
  if (intelPrograms.length > 0) {
    const programIds = intelPrograms.map((p) => p.id)
    const today = new Date().toISOString()
    const { data: bonusAlertRows } = await supabase
      .from('alerts')
      .select('id, slug, title, end_date, primary_program_id, alert_programs!inner(program_id)')
      .eq('type', 'transfer_bonus')
      .eq('status', 'published')
      .or(`end_date.gte.${today},end_date.is.null`)
      .in('alert_programs.program_id', programIds)
      .order('end_date', { ascending: true, nullsFirst: false })
      .limit(8)
    const byId = new Map(intelPrograms.map((p) => [p.id, p.name]))
    const lines = (bonusAlertRows ?? [])
      .map((row) => {
        const programName = (row.primary_program_id && byId.get(row.primary_program_id as string)) ?? '?'
        const ends = row.end_date
          ? ` (ends ${new Date(row.end_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
          : ''
        const slug = (row.slug as string | null) ?? null
        const slugRef = slug ? ` [/alerts/${slug}]` : ''
        return `- ${row.title}${ends} — primary program: ${programName}${slugRef}`
      })
      .filter(Boolean)
    if (lines.length > 0) {
      activeBonusBlock =
        `### Active transfer bonuses involving these programs\n\n` +
        lines.join('\n') +
        `\n\n_When relevant, lead the call-to-action with one of these (link the slug)._`
    }
  }

  const ctxParts = programSections.length ? [programSections.join('\n\n---\n\n')] : []
  if (activeBonusBlock) ctxParts.push(activeBonusBlock)
  const extra_context = ctxParts.length > 0 ? ctxParts.join('\n\n---\n\n') : null
  const faq_program_slugs = intelPrograms
    .filter((p) => buildProgramContext(p) !== null)
    .map((p) => p.slug)

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
    faq_program_slugs,
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
    const draftText = `${draft.title}\n${draft.summary}\n${draft.description ?? ''}`
    const programReference = await buildProgramReferenceForDraft(supabase, primaryId, draftText)
    const verify = await verifyAlertDraft({
      draft: { title: draft.title, summary: draft.summary, description: draft.description },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      alert_type: intel.alert_type,
      program_reference: programReference,
    })
    if (verify) {
      finalClaims = verify.claims
      checkedAt = verify.checked_at
      if (finalClaims.some((c) => !isSupported(c))) {
        try {
          finalClaims = await webVerifyClaims({
            claims: finalClaims,
            context: { title: draft.title, source_url: (intel.source_url as string | null) ?? null },
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
