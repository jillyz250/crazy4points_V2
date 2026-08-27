import type { SupabaseClient } from '@supabase/supabase-js'
import { EXPERIENCE_PROGRAMS, type ExperienceProgram } from './runExperiencesWatch'
import { logSystemError } from '@/utils/supabase/queries'

/**
 * Coverage helpers for the experiences watcher.
 *
 * The watcher used to loop all 18 programs sequentially in one 300s function and
 * time out after ~3-4, silently leaving the back of the list (United, Amex, Citi…)
 * stale for days — with NO error, because a maxDuration timeout is a kill, not a
 * throw, and un-reached programs simply leave no scrape_run row (missing reads as
 * "nothing new"). These helpers fix both: stalest-first ordering so a bounded run
 * always tackles the most-neglected first, and a watchdog that surfaces any
 * program gone quiet as a real system error.
 */

/** Latest run-start per program (ms epoch) from experience_scrape_runs. */
async function latestRuns(supabase: SupabaseClient): Promise<Record<string, number>> {
  const cutoff = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  const { data } = await supabase
    .from('experience_scrape_runs')
    .select('program_slug, run_started_at')
    .gte('run_started_at', cutoff)
    .order('run_started_at', { ascending: false })
  const m: Record<string, number> = {}
  for (const r of (data ?? []) as Array<{ program_slug: string; run_started_at: string }>) {
    if (!(r.program_slug in m)) m[r.program_slug] = Date.parse(r.run_started_at)
  }
  return m
}

/** Programs ordered STALEST-first (never-run programs lead), for a bounded run. */
export async function orderProgramsByStaleness(
  supabase: SupabaseClient,
  programs: ExperienceProgram[] = EXPERIENCE_PROGRAMS,
): Promise<ExperienceProgram[]> {
  const last = await latestRuns(supabase)
  return [...programs].sort((a, b) => (last[a.program_slug] ?? 0) - (last[b.program_slug] ?? 0))
}

/**
 * Watchdog: log ONE system error if any program hasn't scraped in > maxAgeHours,
 * so a coverage lapse can't stay silent again. Deduped to at most once / 18h so a
 * persistent gap doesn't spam the error log. Returns the stale slugs.
 */
export async function checkExperiencesCoverage(supabase: SupabaseClient, maxAgeHours = 36): Promise<string[]> {
  const last = await latestRuns(supabase)
  const cutoff = Date.now() - maxAgeHours * 3600 * 1000
  const stale = EXPERIENCE_PROGRAMS.filter((p) => (last[p.program_slug] ?? 0) < cutoff).map((p) => p.program_slug)
  if (stale.length) {
    const since = new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('system_errors')
      .select('id')
      .eq('source', 'experiences-coverage')
      .gte('created_at', since)
      .limit(1)
    if (!recent?.length) {
      await logSystemError(
        supabase,
        'experiences-coverage',
        new Error(`${stale.length} experiences program(s) not scraped in ${maxAgeHours}h: ${stale.join(', ')}`),
        { stale, maxAgeHours },
      )
    }
  }
  return stale
}
