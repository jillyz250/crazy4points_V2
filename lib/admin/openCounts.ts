/**
 * openCounts — the ONE place that answers "how much open work is sitting in each
 * admin queue right now?" (Devon, 2026-09-04).
 *
 * Powers the dashboard "Open across the org" board (the nothing-gets-lost layer)
 * AND the per-head "Open queues" slice on each org page. Both read the SAME map,
 * so a queue's number is identical wherever it appears.
 *
 * Each key is a registry surface id (see lib/admin/registry.ts ADMIN_PAGES). The
 * consumer looks up that surface's title/icon/path/owner from the registry; this
 * file owns only the numbers. A surface appears here ONLY if it has a correct,
 * confidently-known open-work count — a wrong count is worse than a missing one,
 * so anything ambiguous is deliberately omitted (see the notes at the bottom).
 *
 * ACCURACY: every query below mirrors the surface's own canonical count so the
 * board can never disagree with the page it links to. Sources cited per line.
 */
import { createAdminClient } from '@/utils/supabase/server'
import { getRefreshQueueByType } from '@/utils/supabase/queries'

/** How a countable queue is presented: ACTIONABLE surfaces read prominently;
 *  BACKLOG piles (big idea queues) render muted so a large number can't scream. */
export type OpenCountTier = 'actionable' | 'backlog'

/** The countable surfaces, by registry id, with their tier. Order is not
 *  significant here — the board sorts by owner + count at render time. */
export const OPEN_COUNT_SPECS: { id: string; tier: OpenCountTier }[] = [
  // ── Actionable queues (real work waiting on a person) ──
  { id: 'triage', tier: 'actionable' },
  { id: 'drafts', tier: 'actionable' },
  { id: 'change-signals', tier: 'actionable' },
  { id: 'card-bonus-signals', tier: 'actionable' },
  { id: 'program-drift', tier: 'actionable' },
  { id: 'verification-findings', tier: 'actionable' },
  { id: 'refresh-queue', tier: 'actionable' },
  { id: 'experiences', tier: 'actionable' },
  { id: 'sweepstakes', tier: 'actionable' },
  { id: 'errors', tier: 'actionable' },
  // ── Backlogs (large piles — informational, rendered quiet) ──
  { id: 'content-ideas-blog', tier: 'backlog' },
]

/** Quick lookup: surface id → tier. */
export const OPEN_COUNT_TIER: Record<string, OpenCountTier> = Object.fromEntries(
  OPEN_COUNT_SPECS.map((s) => [s.id, s.tier]),
)

type DB = ReturnType<typeof createAdminClient>

/** Run one head-only COUNT query; null on any error (surface then drops out). */
async function safeCount(
  build: (db: DB) => PromiseLike<{ count: number | null }>,
): Promise<number | null> {
  try {
    const { count } = await build(createAdminClient())
    return count ?? 0
  } catch {
    return null
  }
}

/**
 * Live open-work counts, keyed by registry surface id. A surface is present only
 * when its count resolved cleanly; callers treat a missing key as "no live
 * count" (row hidden), never as zero-with-certainty.
 */
export async function getOpenCounts(): Promise<Record<string, number>> {
  const nowIso = new Date().toISOString()

  const [
    triage,
    drafts,
    changeSignals,
    cardBonus,
    programDrift,
    verification,
    refresh,
    experiences,
    sweepstakes,
    errors,
    contentIdeas,
  ] = await Promise.all([
    // triage — unprocessed intel. Mirrors the dashboard's triage tile and
    // orgAging 'intel'. (app/admin/(protected)/page.tsx)
    safeCount((c) =>
      c.from('intel_items').select('*', { count: 'exact', head: true })
        .eq('processed', false).is('rejected_at', null).is('archived_at', null)),
    // drafts — content variants awaiting review. (dashboard drafts tile)
    safeCount((c) =>
      c.from('content_variants').select('*', { count: 'exact', head: true })
        .eq('status', 'needs_review')),
    // change signals — new AND not currently snoozed. Mirrors changeSignalsCount()
    // (change-signals/ChangeSignalsPanel.tsx).
    safeCount((c) =>
      c.from('change_signals').select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)),
    // welcome-bonus signals — new. Mirrors cardBonusSignalsCount()
    // (card-bonus-signals/CardBonusSignalsPanel.tsx).
    safeCount((c) =>
      c.from('card_bonus_signals').select('*', { count: 'exact', head: true })
        .eq('status', 'new')),
    // program-fact drift — unresolved intel conflicts. Mirrors programDriftCount()
    // (program-drift/ProgramDriftPanel.tsx).
    safeCount((c) =>
      c.from('intel_items').select('*', { count: 'exact', head: true })
        .not('conflicts_program_id', 'is', null).is('conflict_resolution', null).is('archived_at', null)),
    // re-verification findings — new. Mirrors the agents page finding query
    // (agents/page.tsx: verification_findings status='new').
    safeCount((c) =>
      c.from('verification_findings').select('*', { count: 'exact', head: true })
        .eq('status', 'new')),
    // refresh queue — total across entity types. Mirrors refreshQueueCount()
    // (refresh-queue/RefreshQueuePanel.tsx → getRefreshQueueByType).
    (async () => {
      try {
        const byType = await getRefreshQueueByType(createAdminClient())
        return Object.values(byType).reduce((s, n) => s + n, 0)
      } catch {
        return null
      }
    })(),
    // experiences to review — unreviewed + active + not closed. Mirrors the
    // dashboard "New experiences" Pulse query. (page.tsx)
    safeCount((c) =>
      c.from('experience_listings').select('*', { count: 'exact', head: true })
        .is('editorial_reviewed_at', null)
        .eq('status', 'active')
        .or(`close_date.is.null,close_date.gte.${nowIso}`)),
    // sweepstakes to review — running + not yet reviewed. Mirrors the dashboard
    // "New sweepstakes" Pulse query. (page.tsx)
    safeCount((c) =>
      c.from('sweepstakes').select('*', { count: 'exact', head: true })
        .eq('status', 'running').is('reviewed_at', null)),
    // errors — unresolved system errors. Mirrors the dashboard errors tile +
    // orgAging 'errors'. (page.tsx)
    safeCount((c) =>
      c.from('system_errors').select('*', { count: 'exact', head: true })
        .is('resolved_at', null)),
    // content ideas backlog — new + idea bank (the big pile; shown MUTED). The
    // status vocabulary is new|idea_bank|published|dismissed
    // (content-ideas/page.tsx IdeaStatus).
    safeCount((c) =>
      c.from('content_ideas').select('*', { count: 'exact', head: true })
        .in('status', ['new', 'idea_bank'])),
  ])

  const out: Record<string, number> = {}
  const put = (id: string, n: number | null) => {
    if (n != null) out[id] = n
  }
  put('triage', triage)
  put('drafts', drafts)
  put('change-signals', changeSignals)
  put('card-bonus-signals', cardBonus)
  put('program-drift', programDrift)
  put('verification-findings', verification)
  put('refresh-queue', refresh)
  put('experiences', experiences)
  put('sweepstakes', sweepstakes)
  put('errors', errors)
  put('content-ideas-blog', contentIdeas)
  return out
}

/*
 * DELIBERATELY OMITTED (would be a guess or a duplicate — accuracy first):
 *  - data-integrity: its true count is the heavy structural audit
 *    (runDataIntegrity → runIntegrityChecks, many queries). The only CHEAP query
 *    available for it (intel_items conflicts) is IDENTICAL to program-drift, so
 *    showing it would double-count the same number under two labels. Left to the
 *    Accuracy hub, which runs the real audit once.
 *  - fact-checks: no dedicated open-rows table — it derives flagged claims by
 *    parsing alerts.fact_check_claims over a 30-day window. No clean COUNT.
 *  - roadmap: a strategy ladder, not an open-work queue with a defined backlog
 *    count.
 *  - agents / sources / scrapes / extractions / card-extractions / manual-
 *    overrides / reference catalogs: browsable catalogs, not "waiting work".
 */
