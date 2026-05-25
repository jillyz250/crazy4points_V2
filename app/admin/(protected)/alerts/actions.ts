'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  incrementSourceApproved,
  getAlertById,
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
import { rejectAlertVariant, updateAlertVariantMetadata, updateTopicFactLedger, updateAlertVariantBody, findVariantByAlertId, publishAlertVariant, expireAlertVariant, setAlertVariantPrograms } from '@/utils/content/writeAlertVariant'

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
  // Wave 3a: claims live on topic.fact_ledger. Read from there, mutate, write back.
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error('alert not found (no matching topic)')

  const { data: topic } = await supabase
    .from('topics')
    .select('fact_ledger')
    .eq('id', refs.topic_id)
    .single()

  const claims = Array.isArray(topic?.fact_ledger) ? (topic.fact_ledger as VerifyClaim[]) : []
  if (claimIndex < 0 || claimIndex >= claims.length) return

  const updated = claims.map((c, i) => (i === claimIndex ? { ...c, acknowledged: true } : c))
  await updateTopicFactLedger(supabase, alertId, updated)
  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${alertId}/edit`)
}

export async function publishAlertAction(id: string): Promise<void> {
  const supabase = createAdminClient()
  // Wave 3a: still read via getAlertById (alerts is the mirror, fine for reads).
  // Status flip + short_slug now flows through publishAlertVariant — direct
  // writes to alerts are blocked by the G6 trigger.
  const prev = await getAlertById(supabase, id)

  const gates = await checkAlertGates(supabase, prev)
  if (!gates.canPublish) {
    throw new Error(
      `Publish blocked by gates: ${gates.failures.join(' · ')}. ` +
        `Use Override & Publish (with a reason) to bypass.`
    )
  }

  await publishAlertVariant(supabase, id, {
    shortSlugGenerator: async (title) => {
      try {
        const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
        return await generateUniqueShortSlug(supabase, title, id)
      } catch (err) {
        console.error('[publishAlertAction] short_slug generation failed:', err)
        return null
      }
    },
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
  const prev = await getAlertById(supabase, id)
  const gates = await checkAlertGates(supabase, prev)
  if (!gates.canPublish) {
    throw new Error(
      `Gates still blocked after override: ${gates.failures.join(' · ')}`
    )
  }
  await publishAlertVariant(supabase, id, {
    shortSlugGenerator: async (title) => {
      try {
        const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
        return await generateUniqueShortSlug(supabase, title, id)
      } catch (err) {
        console.error('[overrideAndPublishAlertAction] short_slug generation failed:', err)
        return null
      }
    },
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  await revalidateAlertPaths(supabase, id, prev.slug)
  redirect('/admin/alerts')
}

// `ensureShortSlug` helper removed — publishAlertVariant() now owns short_slug
// generation as its `shortSlugGenerator` option (idempotent, respects existing
// variant.metadata.short_slug per invariant I4).

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
  await publishAlertVariant(supabase, id, {
    approved_at: now,
    shortSlugGenerator: async (title) => {
      try {
        const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
        return await generateUniqueShortSlug(supabase, title, id)
      } catch (err) {
        console.error('[approveIntelAlertAction] short_slug generation failed:', err)
        return null
      }
    },
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
    await publishAlertVariant(supabase, id, {
      approved_at: now,
      shortSlugGenerator: async (title) => {
        try {
          const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
          return await generateUniqueShortSlug(supabase, title, id)
        } catch (err) {
          console.error('[bulkApproveIntelAlertsAction] short_slug generation failed:', err)
          return null
        }
      },
    }).catch((err) => console.error(`[bulkApprove] ${id} failed:`, err))
    await trackSourceApprovalIfNeeded(supabase, prev, 'published')
    await revalidateAlertPaths(supabase, id, prev.slug)
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function bulkRejectAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  for (const id of ids) {
    await rejectAlertVariant(supabase, id, { kind: 'rejected' }).catch((err) => {
      console.error(`[bulkRejectAlertsAction] failed for ${id}:`, err)
    })
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function rejectAlertAction(id: string) {
  const supabase = createAdminClient()
  await rejectAlertVariant(supabase, id, { kind: 'rejected' })
  redirect('/admin/alerts')
}

/**
 * Soft-reject (Phase 2): "not now, but check back in N days." Sets a
 * revisit_after timestamp; Scout's dedup keeps suppressing similar findings
 * until that timestamp passes.
 *
 * Wave 3a: status now lives on variant.status='archived' with
 * metadata.archive_reason='soft_rejected' + metadata.revisit_after. The
 * variants→alerts trigger projects this to alerts.status='soft_rejected'
 * + alerts.revisit_after so Scout's dedup keeps working.
 */
export async function softRejectAlertAction(id: string, days: number) {
  const supabase = createAdminClient()
  const safeDays = Math.max(1, Math.min(180, Math.round(days)))
  const revisitAfter = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString()
  await rejectAlertVariant(supabase, id, {
    kind: 'soft_rejected',
    revisitAfter,
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

  // Wave 3a: read alert state via variant/topic. The alerts row is the
  // downstream mirror; we treat variants as canonical (invariant I2).
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) return { ok: false, error: 'alert not found (no matching topic/variant)' }

  const [{ data: topic }, { data: variant }] = await Promise.all([
    supabase.from('topics').select('id, title, summary, source_urls, fact_ledger, metadata').eq('id', refs.topic_id).single(),
    supabase.from('content_variants').select('id, title, body, metadata').eq('id', refs.variant_id).single(),
  ])
  if (!topic || !variant) return { ok: false, error: 'topic or variant missing' }

  const sourceIntelId = (topic.metadata as { source_intel_id?: string } | null)?.source_intel_id ?? null
  if (!sourceIntelId) return { ok: false, error: 'alert has no source_intel_id — cannot regenerate' }

  // Shim the legacy alert-shape for downstream code that still expects it.
  const alert = {
    id: alertId,
    title: variant.title as string,
    summary: topic.summary as string,
    description: variant.body as string | null,
    source_url: Array.isArray(topic.source_urls) && topic.source_urls.length > 0 ? topic.source_urls[0] : null,
    source_intel_id: sourceIntelId,
    revision_log: (variant.metadata as { revision_log?: unknown[] } | null)?.revision_log ?? [],
    gaps: (variant.metadata as { gaps?: AlertGap[] } | null)?.gaps ?? [],
    verified_terms: (variant.metadata as { verified_terms?: string } | null)?.verified_terms ?? null,
  }

  // recent samples (voice anchors for the writer) come from content_variants
  // via the AlertView adapter — same source the rest of the public site reads.
  const { selectAlertViewFromVariants } = await import('@/utils/content/alertView')
  const [intelRes, programsRes, recentAlertsView] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, alert_type, programs')
      .eq('id', alert.source_intel_id as string)
      .maybeSingle(),
    supabase
      .from('programs')
      .select('id, slug, name, type, intro, transfer_partners, sweet_spots, quirks, how_to_spend, tier_benefits, lounge_access'),
    selectAlertViewFromVariants(supabase, { status: 'published', activeOnly: true, limit: 12 }),
  ])
  const recentRes = {
    data: recentAlertsView.slice(0, 3).map((a) => ({ title: a.title, summary: a.summary })),
    error: null,
  }

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

    // Wave 3a: variant.title/body + variant.metadata (writer fields) +
    // topic.summary + topic.end_date. setAlertVariantPrograms reconciles
    // the junction via the trigger.
    await supabase
      .from('content_variants')
      .update({
        title: draft.title,
        body: draft.description,
        metadata: {
          ...((variant.metadata as object) ?? {}),
          action_type: draft.action_type,
          start_date: draft.start_date,
          revision_log: [...existingLog, regenEntry],
          gaps: mergedGaps,
          editorial_value_add: Array.isArray(draft.editorial_value_add) ? draft.editorial_value_add : [],
          voice_pass: wec.voice?.passed ?? null,
          voice_score: wec.voice?.score ?? null,
          voice_lead_mode: wec.voice?.lead_mode_detected ?? null,
          voice_notes: voiceNotesPayload,
          voice_checked_at: wec.voice ? new Date().toISOString() : null,
          context_loaded_at: new Date().toISOString(),
        },
        brand_voice_run: !!wec.voice,
      })
      .eq('id', refs.variant_id)
      .throwOnError()

    await supabase
      .from('topics')
      .update({
        summary: draft.summary,
        end_date: draft.end_date,
      })
      .eq('id', refs.topic_id)
      .throwOnError()

    await setAlertVariantPrograms(supabase, alertId, {
      primaryProgramId: primaryId,
      secondaryProgramIds: secondaryIds,
    })
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

          // Variant owns title + description; topic owns summary
          await supabase
            .from('content_variants')
            .update({ title: workingDraft.title, body: workingDraft.description })
            .eq('id', refs.variant_id)
          await supabase
            .from('topics')
            .update({ summary: workingDraft.summary })
            .eq('id', refs.topic_id)

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

      // Wave 3a: write claims to topic.fact_ledger + verified_at
      await updateTopicFactLedger(supabase, alertId, finalClaims, {
        verified_at: checkedAt ?? new Date().toISOString(),
      })
    }
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:verify', err, { alert_id: alertId })
  }

  // Append any revise log entries to the variant.metadata.revision_log
  if (reviseLog.length > 0) {
    try {
      const { data: freshVariant } = await supabase
        .from('content_variants')
        .select('metadata')
        .eq('id', refs.variant_id)
        .single()
      const currentLog = ((freshVariant?.metadata as { revision_log?: unknown[] } | null)?.revision_log ?? []) as unknown[]
      await updateAlertVariantMetadata(supabase, alertId, {
        revision_log: [...currentLog, ...reviseLog],
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
  await expireAlertVariant(supabase, id)
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

  // Wave 3a: read variant.title/body + variant.metadata.voice_*
  const refs = await findVariantByAlertId(supabase, id)
  if (!refs) return { ok: false, error: 'Alert not found' }

  const { data: variant } = await supabase
    .from('content_variants')
    .select('title, body, metadata')
    .eq('id', refs.variant_id)
    .single()
  if (!variant) return { ok: false, error: 'Variant not found' }
  if (!variant.body || !(variant.body as string).trim()) {
    return { ok: false, error: 'No description to fix' }
  }
  const meta = (variant.metadata ?? {}) as { voice_pass?: boolean | null; voice_notes?: string | null }
  if (meta.voice_pass !== false || !meta.voice_notes) {
    return { ok: false, error: 'No voice failure notes to apply (voice check has not failed)' }
  }

  const fix = await voiceFixArticle({
    title: variant.title as string,
    article_body: variant.body as string,
    voice_notes: meta.voice_notes,
  })
  if (!fix) return { ok: false, error: 'Quick-fix call failed (see logs)' }

  try {
    await updateAlertVariantBody(supabase, id, fix.article_body)
  } catch (err) {
    return { ok: false, error: errMessage(err) }
  }

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

  // Wave 3a: read from topic + variant via findVariantByAlertId, not alerts.
  const refs = await findVariantByAlertId(supabase, id)
  if (!refs) return { ok: false, error: 'alert not found (no matching topic/variant)' }

  const [{ data: topic }, { data: variant }] = await Promise.all([
    supabase.from('topics').select('id, title, summary, source_urls, programs, metadata').eq('id', refs.topic_id).single(),
    supabase.from('content_variants').select('id, title, body, metadata').eq('id', refs.variant_id).single(),
  ])
  if (!topic || !variant) return { ok: false, error: 'topic or variant missing' }

  const sourceIntelId = (topic.metadata as { source_intel_id?: string } | null)?.source_intel_id ?? null
  if (!sourceIntelId) return { ok: false, error: 'alert has no source_intel_id — cannot fact-check' }

  const { data: intel, error: intelErr } = await supabase
    .from('intel_items')
    .select('raw_text, source_url, alert_type, programs')
    .eq('id', sourceIntelId)
    .maybeSingle()
  if (intelErr || !intel) return { ok: false, error: intelErr?.message ?? 'intel_item not found' }

  const verifiedTerms = (variant.metadata as { verified_terms?: string } | null)?.verified_terms ?? null
  const primaryProgramId = (topic.metadata as { primary_program_id?: string } | null)?.primary_program_id ?? null

  const { extra_context } = await buildExtraContext(supabase, {
    programSlugs: (intel.programs as string[] | null) ?? [],
    verifiedTerms,
    excludeAlertId: id,
  })

  const draftText = `${variant.title}\n${topic.summary}\n${variant.body ?? ''}`
  const programReference = await buildProgramReferenceForDraft(supabase, primaryProgramId, draftText)

  // Tagged program IDs for alliance context.
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
      draft: { title: variant.title as string, summary: topic.summary as string, description: variant.body },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      alert_type: intel.alert_type,
      program_reference: programReference,
      alliance_context,
      verified_terms: verifiedTerms,
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
          title: variant.title as string,
          source_url: (intel.source_url as string | null) ?? null,
          verified_terms: verifiedTerms,
        },
      })
    } catch (err) {
      await logSystemError(supabase, 'alerts:factCheck:webVerify', err, { alert_id: id })
      finalClaims = finalClaims.map((c) =>
        isSupported(c) ? c : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
      )
    }
  }

  // Write claims to topic.fact_ledger + verified_at; trigger mirrors to alerts.
  await updateTopicFactLedger(supabase, id, finalClaims, { verified_at: verify.checked_at })

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)

  const total = finalClaims.length
  const flagged = highSeverityUnsupported(finalClaims).length
  return { ok: true, flagged, total }
}

export async function voiceCheckAlertAction(id: string): Promise<AlertVoiceCheckResult> {
  const supabase = createAdminClient()

  // Wave 3a: read variant.title/body + topic.summary; write voice fields to variant.metadata.
  const refs = await findVariantByAlertId(supabase, id)
  if (!refs) return { ok: false, error: 'Alert not found' }

  const [{ data: variant }, { data: topic }] = await Promise.all([
    supabase.from('content_variants').select('title, body').eq('id', refs.variant_id).single(),
    supabase.from('topics').select('summary').eq('id', refs.topic_id).single(),
  ])
  const body = variant?.body || topic?.summary || ''
  if (!body.trim()) return { ok: false, error: 'No description or summary to check' }

  const res = await voiceCheckArticle({ title: variant?.title as string, article_body: body })
  if (!res) return { ok: false, error: 'Voice-check call failed (see logs)' }

  try {
    await updateAlertVariantMetadata(supabase, id, {
      voice_checked_at: res.checked_at,
      voice_pass: res.pass,
      voice_notes: res.notes,
    }, { brand_voice_run: true })
  } catch (err) {
    return { ok: false, error: errMessage(err) }
  }

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${id}/edit`)
  return { ok: true, pass: res.pass }
}

export type AlertOriginalityCheckResult =
  | { ok: true; pass: boolean; notes: string }
  | { ok: false; error: string }

export async function originalityCheckAlertAction(id: string): Promise<AlertOriginalityCheckResult> {
  const supabase = createAdminClient()

  // Wave 3a: read variant + topic; write originality fields to variant.metadata.
  const refs = await findVariantByAlertId(supabase, id)
  if (!refs) return { ok: false, error: 'Alert not found' }

  const [{ data: variant }, { data: topic }] = await Promise.all([
    supabase.from('content_variants').select('title, body').eq('id', refs.variant_id).single(),
    supabase.from('topics').select('summary, source_urls, metadata').eq('id', refs.topic_id).single(),
  ])
  const body = variant?.body || topic?.summary || ''
  if (!body.trim()) return { ok: false, error: 'No description or summary to check' }

  const sourceIntelId = (topic?.metadata as { source_intel_id?: string } | null)?.source_intel_id ?? null
  const topicSourceUrl = Array.isArray(topic?.source_urls) && topic.source_urls.length > 0 ? topic.source_urls[0] : null

  // v3 — fetch the intel raw_text the alert was drafted from.
  const sources: { url: string | null; text: string }[] = []
  if (sourceIntelId) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text, source_url')
      .eq('id', sourceIntelId)
      .single()
    if (intel?.raw_text) {
      sources.push({ url: intel.source_url ?? topicSourceUrl, text: intel.raw_text })
    }
  }
  if (sources.length === 0) {
    return { ok: false, error: 'No source intel to check against — manual alerts skip this check.' }
  }

  const res = await originalityCheck({ title: variant?.title as string, article_body: body, sources })
  if (!res) return { ok: false, error: 'Originality check failed (see logs)' }

  try {
    await updateAlertVariantMetadata(supabase, id, {
      originality_checked_at: res.checked_at,
      originality_pass: res.pass,
      originality_notes: res.notes,
    })
  } catch (err) {
    return { ok: false, error: errMessage(err) }
  }

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
  // Wave 3a: verified_terms + terms_waived_reason live on variant.metadata.
  // Direct writes to alerts are blocked by the G6 trigger.
  try {
    await updateAlertVariantMetadata(supabase, id, {
      verified_terms: v.length > 0 ? v : null,
      terms_waived_reason: w.length > 0 ? w : null,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `save terms failed — ${errMessage(err)}` }
  }
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
