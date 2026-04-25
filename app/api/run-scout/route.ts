import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getSources,
  getAllPrograms,
  getRecentIntelItems,
  incrementSourceProduced,
  logSystemError,
  setAlertPrograms,
  getRecentDecisionFor,
} from '@/utils/supabase/queries'
import { runScout } from '@/utils/ai/runScout'
import { enrichPromoFindings } from '@/utils/ai/enrichPromoFindings'
import type { AlertType, IntelItemInsert, IntelConfidence, RecentIntelItem } from '@/utils/supabase/queries'
import type { ScoutFinding } from '@/utils/ai/runScout'

// Boost to 'high' when cross-source corroboration exists within 48h
function applyConfidenceBoost(
  findings: ScoutFinding[],
  recentItems: RecentIntelItem[]
): ScoutFinding[] {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  return findings.map((f) => {
    if (f.confidence === 'high') return f
    const programs = f.programs ?? []
    const corroborated = recentItems.some(
      (r) =>
        r.created_at >= cutoff &&
        r.alert_type === f.alert_type &&
        r.source_type !== f.source_type &&
        (r.programs ?? []).some((p) => programs.includes(p))
    )
    return corroborated ? { ...f, confidence: 'high' as IntelConfidence } : f
  })
}

// True if this finding is a clear cross-day duplicate (same headline or same program+type)
function isDuplicateOfRecent(f: ScoutFinding, recentItems: RecentIntelItem[]): boolean {
  const programs = f.programs ?? []
  return recentItems.some(
    (r) =>
      r.headline.toLowerCase() === f.headline.toLowerCase() ||
      (f.alert_type !== null &&
        r.alert_type === f.alert_type &&
        (r.programs ?? []).some((p) => programs.includes(p)))
  )
}

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
  const sources = await getSources(supabase)
  const activeSources = sources.filter((s) => s.is_active)

  if (activeSources.length === 0) {
    return NextResponse.json({ message: 'No active sources' })
  }

  // Load recent intel for dedup + confidence boost
  const recentItems = await getRecentIntelItems(supabase, 7)
  const recentHeadlines = recentItems.map((r) => r.headline)

  // Load the canonical program list so Scout tags with real DB slugs (fixes co-brand + SAS-style misses)
  const programsForScout = await getAllPrograms(supabase)
  const scoutPrograms = programsForScout.map((p) => ({ slug: p.slug, name: p.name, type: p.type }))

  // Run Claude Scout, passing known headlines so it skips already-seen stories
  let findings = await runScout(activeSources, recentHeadlines, scoutPrograms)
  console.log(`[run-scout] ${findings.length} raw findings from ${activeSources.length} sources`)

  // Filter findings that are obvious cross-day duplicates
  const deduped = findings.filter((f) => !isDuplicateOfRecent(f, recentItems))
  const dedupedCount = findings.length - deduped.length
  console.log(`[run-scout] ${dedupedCount} findings filtered as cross-day duplicates`)

  // Boost confidence where corroborated across source types
  findings = applyConfidenceBoost(deduped, recentItems)
  const boostedCount = findings.filter((f, i) => f.confidence !== deduped[i]?.confidence).length
  console.log(`[run-scout] ${boostedCount} findings confidence-boosted`)

  // Enrich raw_text for promo-shaped findings whose RSS-provided text is
  // too thin to carry the qualifying terms (status tier, min nights, travel
  // window, exclusions, etc). Refetches the source URL via Firecrawl. Only
  // fires for promo alert types — bounded cost. Failures fall back silently
  // to the original raw_text.
  let promoEnrichStats: { candidates: number; enriched: number; skipped: number; failed: number } = {
    candidates: 0, enriched: 0, skipped: 0, failed: 0,
  }
  try {
    promoEnrichStats = await enrichPromoFindings(findings)
  } catch (err) {
    console.error('[run-scout] enrichPromoFindings failed (non-fatal):', err)
  }
  console.log(
    `[run-scout] promo-enrich: ${promoEnrichStats.enriched} enriched, ` +
    `${promoEnrichStats.skipped} skipped, ${promoEnrichStats.failed} failed ` +
    `(of ${promoEnrichStats.candidates} candidates)`
  )

  // Write to intel_items
  let inserted: Array<{
    id: string
    headline: string
    raw_text: string | null
    source_name: string
    source_url: string | null
    confidence: string
    alert_type: string | null
    programs: string[] | null
    expires_at: string | null
  }> = []

  if (findings.length > 0) {
    const items: IntelItemInsert[] = findings.map((f) => ({
      source_url: f.source_url ?? null,
      source_type: f.source_type,
      source_name: f.source_name,
      raw_text: f.raw_text ?? null,
      headline: f.headline,
      confidence: f.confidence,
      alert_type: (f.alert_type as AlertType) ?? null,
      programs: f.programs ?? null,
      expires_at: f.expires_at ?? null,
    }))

    const { data, error: intelError } = await supabase
      .from('intel_items')
      .insert(items)
      .select()

    if (intelError) {
      console.error('[run-scout] intel_items insert error:', intelError)
    } else {
      inserted = data ?? []
    }
  }

  // Update source performance stats (items_produced + last_scraped_at per active source)
  for (const source of activeSources) {
    const count = findings.filter((f) => f.source_name === source.name).length
    await incrementSourceProduced(supabase, source.name, count)
  }

  // Build program slug → id map (reuse the list loaded above)
  const programSlugMap = new Map(programsForScout.map((p) => [p.slug, p.id]))

  // Stage high-confidence items as pending_review alerts
  const staged: string[] = []
  const highConfItems = inserted.filter((i) => i.confidence === 'high' && i.alert_type)

  for (const item of highConfItems) {
    const programIds = (item.programs ?? [])
      .map((slug: string) => programSlugMap.get(slug))
      .filter(Boolean) as string[]
    const primaryProgramId = programIds[0] ?? null

    // Decision memory (Phase 2): suppress staging if an alert for this
    // program+type already had a recent decision — pending_review (any age),
    // published (last 30d), rejected (last 14d), or soft_rejected (until
    // revisit_after). Replaces the old pending-only 7-day check.
    if (primaryProgramId && item.alert_type) {
      const decision = await getRecentDecisionFor(supabase, primaryProgramId, item.alert_type as AlertType)
      if (decision?.block) {
        console.log(
          `[run-scout] Skipping (${decision.reason}) for "${item.headline}" — prior alert: ${decision.alert.title.slice(0, 70)}`
        )
        await supabase.from('intel_items').update({ dedup_count: 1 }).eq('id', item.id)
        continue
      }
    }

    const finding = findings.find((f) => f.headline === item.headline)

    let historyNote: string | null = null
    if (primaryProgramId) {
      const { data: recent } = await supabase
        .from('alerts')
        .select('title, published_at, type')
        .eq('status', 'published')
        .eq('primary_program_id', primaryProgramId)
        .order('published_at', { ascending: false })
        .limit(3)

      if (recent && recent.length > 0) {
        const lines = recent.map((a) => {
          const date = a.published_at
            ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'unknown date'
          return `• ${a.title} (${date})`
        })
        historyNote = `Recent alerts for this program:\n${lines.join('\n')}`
      }
    }

    const slug = `intel-${item.id.slice(0, 8)}-${Date.now()}`
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        slug,
        title: item.headline,
        summary: item.raw_text?.slice(0, 300) ?? item.headline,
        description: finding?.description ?? null,
        type: item.alert_type,
        status: 'pending_review',
        confidence_level: item.confidence,
        source_url: item.source_url ?? null,
        source: item.source_name,
        primary_program_id: primaryProgramId,
        start_date: finding?.start_date ?? null,
        end_date: item.expires_at ?? null,
        history_note: historyNote,
        source_intel_id: item.id,
        impact_score: 5,
        value_score: 5,
        rarity_score: 5,
        impact_justification: 'Auto-staged from Claude Scout',
        action_type: 'monitor',
        registration_required: false,
      })
      .select('id')
      .single()

    if (alertError) {
      console.error('[run-scout] Alert staging error:', alertError)
      continue
    }

    // Tag the alert with primary + any secondaries in alert_programs.
    // Previously only secondaries were inserted (and only when there were
    // ≥2 programs), which left the primary off the junction entirely —
    // breaking every downstream filter that joins on alert_programs.
    await setAlertPrograms(supabase, alert.id, {
      primaryId: primaryProgramId,
      secondaryIds: programIds.slice(1),
    })

    await supabase.from('intel_items').update({ processed: true, alert_id: alert.id }).eq('id', item.id)
    staged.push(alert.id)
  }

  return NextResponse.json({
    sources_scanned: activeSources.length,
    findings_raw: findings.length + dedupedCount,
    findings_new: findings.length,
    deduped: dedupedCount,
    boosted: boostedCount,
    promo_enriched: promoEnrichStats.enriched,
    promo_enrich_skipped: promoEnrichStats.skipped,
    promo_enrich_failed: promoEnrichStats.failed,
    promo_enrich_candidates: promoEnrichStats.candidates,
    staged: staged.length,
  })
  } catch (err) {
    await logSystemError(supabase, 'scout', err)
    throw err
  }
}
