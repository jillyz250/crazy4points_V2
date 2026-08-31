/**
 * Drain the undecided intel backlog through the editorial planner.
 *
 * WHY THIS EXISTS
 * The daily brief's planner only ever *sees* the first ~35 intel items it's
 * fed. On spike-ingest days (bulk email segmentation can drop 100-224 items at
 * once) the overflow never reaches Sonnet, so it stays triage_decision=NULL and
 * ages into a permanent backlog (found 2026-08-31: 658 undecided, oldest 28d).
 * The backlog re-feed that was meant to rescue those items was itself defeated
 * by the same inner cap, so orphans never actually got classified.
 *
 * This is the shared drain engine: it pulls the OLDEST undecided items (the ones
 * the daily fresh feed keeps outranking), sends them through the SAME proven
 * Sonnet planner in bounded batches, and persists every decision via
 * persistPlanDecisions. Reused by:
 *   - /api/build-brief            (bonus drain after the email, tight time gate)
 *   - /api/cron/intel-triage-sweep (second daily pass, its own time gate)
 *   - scripts/drain-triage-backlog.mjs (unbounded manual drain of a big backlog)
 *
 * SELF-HEALING: each batch is persisted the moment the planner returns, so a
 * timeout or a null plan mid-run simply leaves the remainder NULL for the next
 * run — nothing is stranded and nothing is double-decided (the pool re-queries
 * triage_decision IS NULL each run).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateEditorialPlan, type PlanIntelItem } from '@/utils/ai/generateEditorialPlan'
import { persistPlanDecisions } from '@/utils/intel/persistPlanDecisions'

export interface DrainOptions {
  /** Items per planner call. Keep <= the planner's internal cap (35) so nothing is silently dropped. */
  batchSize?: number
  /** Hard cap on batches this invocation. */
  maxBatches?: number
  /**
   * Called before each batch; return false to stop. Callers put their time
   * budget here (e.g. `() => Date.now() - start < 130_000`) so a serverless
   * function never blows past maxDuration. Omit for "run until the pool/maxBatches
   * is exhausted" (manual drain script).
   */
  shouldContinue?: () => boolean
  /** intel_ids to skip (e.g. ones the caller's email batch already classified this run). */
  excludeIds?: Set<string>
  /** Published/approved headlines to seed the planner's dupe guard. */
  alreadyCovered?: string[]
  /** Optional progress logger. */
  onBatch?: (info: { batch: number; sent: number; persisted: number; poolRemaining: number }) => void
}

export interface DrainResult {
  batches: number
  itemsSeen: number
  decisionsPersisted: number
  approved: number
  rejected: number
  blogIdea: number
  newsletterIdea: number
  nullPlans: number
}

export async function drainUndecidedBacklog(
  supabase: SupabaseClient,
  opts: DrainOptions = {},
): Promise<DrainResult> {
  const batchSize = Math.min(opts.batchSize ?? 28, 35)
  const maxBatches = opts.maxBatches ?? 3
  const shouldContinue = opts.shouldContinue ?? (() => true)
  const exclude = opts.excludeIds ?? new Set<string>()
  const covered = [...(opts.alreadyCovered ?? [])]

  const result: DrainResult = {
    batches: 0, itemsSeen: 0, decisionsPersisted: 0,
    approved: 0, rejected: 0, blogIdea: 0, newsletterIdea: 0, nullPlans: 0,
  }

  for (let b = 0; b < maxBatches; b++) {
    if (!shouldContinue()) break

    // Re-query each batch (not one big upfront fetch): items just decided drop
    // out via triage_decision IS NULL, so the oldest undecided always lead and
    // we never re-send a row we already marked. `exclude` covers rows a caller
    // handled earlier in the same run that may not have committed yet.
    const nowIso = new Date().toISOString()
    const { data: pool, error } = await supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs, expires_at')
      .is('triage_decision', null)
      .is('rejected_at', null)
      .is('archived_at', null)
      .is('alert_id', null)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .order('created_at', { ascending: true })
      .limit(batchSize + exclude.size)
    if (error) break

    const slice = (pool ?? []).filter((r) => !exclude.has(r.id as string)).slice(0, batchSize)
    if (slice.length === 0) break

    const batchIntel: PlanIntelItem[] = slice.map((r) => ({
      intel_id: r.id as string,
      headline: r.headline as string,
      source_name: r.source_name as string,
      source_url: r.source_url as string | null,
      confidence: (r.confidence as 'high' | 'medium' | 'low') ?? 'low',
      alert_type: r.alert_type as string | null,
      programs: r.programs as string[] | null,
      raw_text: r.raw_text as string | null,
    }))

    const plan = await generateEditorialPlan({
      today_intel: batchIntel,
      voice_samples: [],
      existing_open_blog_ideas: [],
      already_covered: covered.slice(0, 150),
    })

    if (!plan) {
      // Best-effort: leave this batch NULL for the next run. Guard against an
      // infinite loop on a persistently-failing head-of-queue by excluding this
      // slice for the remainder of THIS invocation.
      result.nullPlans++
      for (const r of slice) exclude.add(r.id as string)
      continue
    }

    const persisted = await persistPlanDecisions(supabase, plan)
    result.batches++
    result.itemsSeen += slice.length
    result.decisionsPersisted += persisted.persisted
    result.approved += persisted.approved
    result.rejected += persisted.rejected
    result.blogIdea += persisted.blogIdea
    result.newsletterIdea += persisted.newsletterIdea

    // Any item the planner omitted from every bucket stays NULL and would be
    // re-fetched next batch — exclude it for the rest of this run so we don't
    // spin on it. (Coverage probe shows this is ~0 in practice.)
    for (const r of slice) if (!persisted.decidedIds.has(r.id as string)) exclude.add(r.id as string)

    // Feed this batch's approvals into the next batch's dupe guard.
    for (const a of plan.approve) if (a.headline) covered.push(a.headline)

    opts.onBatch?.({ batch: result.batches, sent: slice.length, persisted: persisted.persisted, poolRemaining: (pool?.length ?? 0) - slice.length })
  }

  return result
}
