'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { buildBriefEmail, type ApproveMeta, type BriefFinding } from '@/utils/ai/briefEmail'
import type { EditorialPlan } from '@/utils/ai/generateEditorialPlan'

interface FactCheckClaim {
  claim: string
  // Three-state truth — see utils/ai/claimStatus.ts.
  supported: boolean | 'unsupported'
  severity?: string
  acknowledged?: boolean
  web_verdict?: string | null
}

export interface RebuildResult {
  ok: boolean
  error?: string
  htmlLength?: number
}

// Rebuild a brief's rendered HTML from stored editorial_plan + current DB
// state. No Sonnet calls — cheap, fast, idempotent. Useful when the original
// build-brief run timed out before persisting HTML, or when you want to
// re-preview an old brief with current alert data.
export async function rebuildBriefHtmlAction(briefId: string): Promise<RebuildResult> {
  const supabase = createAdminClient()

  const { data: brief, error: briefErr } = await supabase
    .from('daily_briefs')
    .select('id, brief_date, editorial_plan')
    .eq('id', briefId)
    .maybeSingle()

  if (briefErr || !brief) {
    return { ok: false, error: briefErr?.message ?? 'brief not found' }
  }

  const plan = brief.editorial_plan as EditorialPlan | null
  if (!plan) return { ok: false, error: 'brief has no editorial_plan' }

  // Pull all intel for the 24h window that ends around the brief's sent_at.
  // We use the brief_date ± 36h as a safe grab so we catch everything the
  // original run saw. The editorial plan already references by intel_id so
  // extras are harmless.
  const dayStart = new Date(brief.brief_date + 'T00:00:00Z')
  const windowStart = new Date(dayStart.getTime() - 12 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000).toISOString()

  const { data: intelRows, error: intelErr } = await supabase
    .from('intel_items')
    .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs, expires_at')
    .gte('created_at', windowStart)
    .lte('created_at', windowEnd)

  if (intelErr) return { ok: false, error: `intel: ${intelErr.message}` }

  const intelById = new Map((intelRows ?? []).map((r) => [r.id as string, r]))

  const findings: BriefFinding[] = (intelRows ?? []).map((r) => ({
    intel_id: r.id as string,
    headline: r.headline as string,
    raw_text: (r.raw_text as string | null) ?? null,
    source_name: r.source_name as string,
    source_url: (r.source_url as string | null) ?? null,
    confidence: r.confidence as 'high' | 'medium' | 'low',
    alert_type: r.alert_type as string | null,
    programs: (r.programs as string[] | null) ?? null,
  }))

  // Collect approve intel ids to look up alerts + fact_check_claims
  const approveIntelIds = plan.approve.map((a) => a.intel_id)

  const alertIdByIntelId: Record<string, string> = {}
  const approveMetaByIntelId: Record<string, ApproveMeta> = {}
  const reviseCounters = { run: 0, succeeded: 0, failed: 0, resolved: 0, persistent: 0 }

  if (approveIntelIds.length > 0) {
    const { data: alertRows, error: alertErr } = await supabase
      .from('alerts')
      .select('id, source_intel_id, end_date, computed_score, fact_check_claims, revision_log, primary_program_id')
      .in('source_intel_id', approveIntelIds)

    if (alertErr) return { ok: false, error: `alerts: ${alertErr.message}` }

    // Fetch program names for every alert — primary + secondaries from alert_programs
    const alertIds = (alertRows ?? []).map((a) => a.id as string)
    const { data: alertProgramRows } = alertIds.length
      ? await supabase
          .from('alert_programs')
          .select('alert_id, programs(id, name, slug)')
          .in('alert_id', alertIds)
      : { data: [] }

    const programsByAlertId = new Map<string, { name: string; slug: string }[]>()
    for (const row of alertProgramRows ?? []) {
      const r = row as unknown as {
        alert_id: string
        programs: { name: string; slug: string } | { name: string; slug: string }[] | null
      }
      const progs = Array.isArray(r.programs) ? r.programs : r.programs ? [r.programs] : []
      if (progs.length === 0) continue
      const list = programsByAlertId.get(r.alert_id) ?? []
      for (const p of progs) list.push({ name: p.name, slug: p.slug })
      programsByAlertId.set(r.alert_id, list)
    }

    for (const a of alertRows ?? []) {
      const intelId = a.source_intel_id as string
      const alertId = a.id as string
      alertIdByIntelId[intelId] = alertId
      const intel = intelById.get(intelId)
      const claims = Array.isArray(a.fact_check_claims)
        ? (a.fact_check_claims as FactCheckClaim[])
        : []
      // "openUnsupported" preserves legacy semantic — anything not positively
      // confirmed (supported !== true), high-severity, unacknowledged.
      // Includes both contradicted (false) and silent ('unsupported') so the
      // brief surfaces every unresolved claim for human review.
      const openUnsupported = claims.filter(
        (c) => c.supported !== true && !c.acknowledged && c.severity === 'high'
      )
      const programs = programsByAlertId.get(alertId) ?? []
      const revisionLogRaw = Array.isArray(a.revision_log)
        ? (a.revision_log as Array<{
            reason?: string
            source_url?: string | null
            before_claim?: string
            after_claim?: string
          }>)
        : []
      const revisions = revisionLogRaw
        .filter((r) => typeof r.reason === 'string' && r.reason.length > 0)
        .map((r) => ({
          reason: r.reason as string,
          source_url: r.source_url ?? null,
          before_claim: r.before_claim ?? '',
          after_claim: r.after_claim ?? '',
        }))
      if (revisions.length > 0) {
        reviseCounters.run++
        reviseCounters.succeeded++
        const stillWrong = claims.some((c) => c.web_verdict === 'likely_wrong')
        if (stillWrong) reviseCounters.persistent++
        else reviseCounters.resolved++
      }
      approveMetaByIntelId[intelId] = {
        alertId,
        endDate: (a.end_date as string | null) ?? intel?.expires_at ?? null,
        programNames: programs.map((p) => p.name),
        programs,
        computedScore: (a.computed_score as number | null) ?? null,
        sourceName: (intel?.source_name as string | null) ?? null,
        sourceUrl: (intel?.source_url as string | null) ?? null,
        revisions: revisions.length > 0 ? revisions : undefined,
        factCheck:
          openUnsupported.length > 0
            ? {
                openClaimCount: openUnsupported.length,
                likelyWrongCount: openUnsupported.filter((c) => c.web_verdict === 'likely_wrong').length,
                claims: openUnsupported.slice(0, 3).map((c) => ({
                  text: c.claim,
                  severity: c.severity ?? 'high',
                  web_verdict: c.web_verdict ?? null,
                })),
              }
            : undefined,
      }
    }
  }

  const date = new Date(brief.brief_date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const html = buildBriefEmail(findings, date, {
    plan,
    briefId: brief.id as string,
    siteOrigin: 'https://www.crazy4points.com',
    alertIdByIntelId,
    approveMetaByIntelId,
    reviseCounters,
  })

  const { error: updErr } = await supabase
    .from('daily_briefs')
    .update({ brief_html: html })
    .eq('id', brief.id as string)

  if (updErr) return { ok: false, error: `update: ${updErr.message}` }

  revalidatePath('/admin/briefs')
  revalidatePath(`/admin/briefs/${briefId}`)
  return { ok: true, htmlLength: html.length }
}
