import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getSources,
  getAllPrograms,
  getRecentIntelItems,
  incrementSourceProduced,
  logSystemError,
  getRecentDecisionFor,
} from '@/utils/supabase/queries'
import { runScout } from '@/utils/ai/runScout'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'
import { enrichPromoFindings } from '@/utils/ai/enrichPromoFindings'
import { ingestItem } from '@/utils/intel/ingestItem'
import { writeAlertVariant } from '@/utils/content/writeAlertVariant'
import type { AlertType, IntelConfidence, RecentIntelItem } from '@/utils/supabase/queries'
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
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = !!process.env.INTEL_API_SECRET && manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const runId = await startCronRun(supabase, 'run-scout')

  try {
  const sources = await getSources(supabase)
  const activeSources = sources.filter((s) => s.is_active)

  if (activeSources.length === 0) {
    await finishCronRun(supabase, runId, { status: 'success', recordsChecked: 0 })
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

  // Write to intel_items via shared ingestItem helper.
  //
  // Layer 1 (in-batch) is already done inside runScout's Haiku prompt.
  // Layer 2 (getRecentDecisionFor — status-aware semantic) + Layer 3 (pg_trgm
  // fuzzy headline) + Haiku diff all run inside ingestItem per item.
  //
  // We need the program-slug→id map for Layer 2; build it once here.
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

  const programSlugToId = new Map(programsForScout.map((p) => [p.slug, p.id]))
  // Map a finding's confirming_source_ids (UUIDs Haiku echoes back) to
  // human-readable source names for confirmation_count/confirming_sources.
  const sourceIdToName = new Map(activeSources.map((s) => [s.id, s.name]))

  if (findings.length > 0) {
    const ingestStats = {
      inserted: 0,
      suppressed_as_dup: 0,
      surfaced_as_update: 0,
      error: 0,
    }

    for (const f of findings) {
      // Map Scout source_type to ingestItem's wider enum
      const result = await ingestItem(
        supabase,
        {
          source: 'scout',
          source_url: f.source_url ?? null,
          source_type: f.source_type,
          source_name: f.source_name,
          raw_text: f.raw_text ?? null,
          headline: f.headline,
          confidence: f.confidence,
          alert_type: (f.alert_type as AlertType) ?? null,
          programs: f.programs ?? null,
          expires_at: f.expires_at ?? null,
          // Scout sources are typically 'secondary' (blog) or 'official' (newsroom).
          // Reddit / social use 'social-rumor'.
          fact_origin:
            f.source_type === 'official'
              ? 'official'
              : f.source_type === 'reddit' || f.source_type === 'social'
                ? 'social-rumor'
                : 'secondary',
          confirming_sources: (f.confirming_source_ids ?? [])
            .map((id) => sourceIdToName.get(id))
            .filter((n): n is string => Boolean(n)),
        },
        programSlugToId,
      )

      ingestStats[result.kind]++

      // Only the 'inserted' path (fresh news, no dedup hit) feeds the
      // legacy staging path below. Suppressed dups and update surfaces are
      // handled by Triage — don't auto-stage them as new alerts.
      if (result.kind === 'inserted') {
        inserted.push({
          id: result.intel_id,
          headline: f.headline,
          raw_text: f.raw_text ?? null,
          source_name: f.source_name,
          source_url: f.source_url ?? null,
          confidence: f.confidence,
          alert_type: (f.alert_type as AlertType) ?? null,
          programs: f.programs ?? null,
          expires_at: f.expires_at ?? null,
        })
      }
    }

    console.log(
      `[run-scout] ingest stats: inserted=${ingestStats.inserted} ` +
        `suppressed=${ingestStats.suppressed_as_dup} ` +
        `surfaced_as_update=${ingestStats.surfaced_as_update} ` +
        `errors=${ingestStats.error} (of ${findings.length} findings)`,
    )
  }

  // Update source performance stats (items_produced + last_scraped_at per active source)
  //
  // Match findings to sources by source_id (UUID) first — Haiku is instructed
  // to return the registered source_id verbatim. If a finding lacks source_id
  // (older runs, JSON parse glitches), fall back to case-insensitive name
  // match and log the mismatch so we can audit attribution drift.
  const sourcesById = new Map(activeSources.map((s) => [s.id, s]))
  const sourcesByName = new Map(activeSources.map((s) => [s.name.toLowerCase(), s]))
  const findingsBySourceId = new Map<string, number>()
  const attributionFailures: Array<{
    haiku_source_name: string
    haiku_source_id?: string
    headline: string
    source_url?: string
  }> = []

  for (const f of findings) {
    let matched: typeof activeSources[number] | undefined
    if (f.source_id && sourcesById.has(f.source_id)) {
      matched = sourcesById.get(f.source_id)
    } else {
      // Fallback: case-insensitive name match. Log a warning so we can see
      // when Haiku is paraphrasing the registered name (or omitting source_id).
      matched = sourcesByName.get((f.source_name ?? '').toLowerCase())
      if (matched) {
        console.warn(
          `[run-scout] attribution fallback: finding source_name="${f.source_name}" source_id="${f.source_id ?? ''}" matched by name to source ${matched.id} (${matched.name})`,
        )
      }
    }

    if (matched) {
      findingsBySourceId.set(matched.id, (findingsBySourceId.get(matched.id) ?? 0) + 1)
    } else {
      attributionFailures.push({
        haiku_source_name: f.source_name ?? '',
        haiku_source_id: f.source_id,
        headline: f.headline,
        source_url: f.source_url ?? undefined,
      })
    }
  }

  if (attributionFailures.length > 0) {
    const registeredNames = activeSources.map((s) => s.name)
    console.warn(
      `[run-scout] attribution_failures count=${attributionFailures.length} ` +
        `ts=${new Date().toISOString()}`,
    )
    for (const f of attributionFailures) {
      console.warn(
        `[run-scout] attribution_failure: haiku_source_name="${f.haiku_source_name}" ` +
          `haiku_source_id="${f.haiku_source_id ?? ''}" headline="${f.headline.slice(0, 100)}" ` +
          `url=${f.source_url ?? ''} registered_names_count=${registeredNames.length}`,
      )
    }
    // Log the registered roster once so the editor can diff against Haiku's
    // returned names without paging through hundreds of failure lines.
    console.warn(`[run-scout] registered_source_names: ${JSON.stringify(registeredNames)}`)
  }

  for (const source of activeSources) {
    const count = findingsBySourceId.get(source.id) ?? 0
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

    // Snapshot of recent ACTIVE alerts for this program. Renders as the
    // "Historical Context" box on the public alert page. Filtered to alerts
    // whose end_date is in the future (or null = evergreen) so we don't show
    // expired deals as "context" and mislead the reader. Sorted newest-first.
    // history_note is reserved for editorial historical context — short
    // human-written notes like "Last sale was 50% in November 2025". It
    // surfaces on the public alert page as "Historical Context". Scout
    // used to auto-fill this with cross-promo ("Recent alerts for this
    // program: …") which (a) duplicated the active-alerts surfaces on
    // the program page and (b) misnamed the data as history. Field now
    // starts null and is admin-editable only.
    const historyNote: string | null = null

    const slug = `intel-${item.id.slice(0, 8)}-${Date.now()}`

    // Wave 3a: stage via writeAlertVariant(); the variants→alerts trigger
    // mirrors back. Direct alerts inserts are blocked by the G6 trigger.
    let stagedAlertId: string
    try {
      const result = await writeAlertVariant(supabase, {
        slug,
        title: item.headline,
        summary: item.raw_text?.slice(0, 300) ?? item.headline,
        description: finding?.description ?? null,
        type: (item.alert_type ?? 'industry_news') as AlertType,
        status: 'pending_review',
        action_type: 'monitor',
        confidence_level: item.confidence,
        source_url: item.source_url ?? null,
        source: item.source_name,
        source_intel_id: item.id,
        primary_program_id: primaryProgramId,
        program_slugs: (item.programs ?? []) as string[],
        start_date: finding?.start_date ?? null,
        end_date: item.expires_at ?? null,
        history_note: historyNote,
        impact_score: 5,
        value_score: 5,
        rarity_score: 5,
        impact_justification: 'Auto-staged from Claude Scout',
        registration_required: false,
      })
      stagedAlertId = result.alert_id
    } catch (err) {
      console.error('[run-scout] writeAlertVariant staging error:', err)
      continue
    }

    await supabase.from('intel_items').update({ processed: true, alert_id: stagedAlertId }).eq('id', item.id)
    staged.push(stagedAlertId)
  }

  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: activeSources.length,
    recordsChanged: findings.length,
    firecrawlCalls: promoEnrichStats.candidates,
    firecrawlFailures: promoEnrichStats.failed,
    extra: { staged: staged.length },
  })
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
    await finishCronRun(supabase, runId, { status: 'failed', error: String(err) })
    await logSystemError(supabase, 'scout', err)
    throw err
  }
}
