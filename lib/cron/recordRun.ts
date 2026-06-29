import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Lightweight cron-run logging for the monitoring health section of the daily
 * digest. Each detector calls `startCronRun` at the top and `finishCronRun`
 * before returning (success) or in its catch (failed). The digest then reads
 * the latest row per job to answer: did it run, did it finish, how long, and
 * how many records it checked / changed.
 *
 * Rich metrics (records, firecrawl/anthropic call + failure counts) live in the
 * existing `cron_runs.details` jsonb — no schema migration needed. The dedicated
 * columns (started_at, completed_at, status) are reused as-is.
 *
 * Failures here must never break the detector itself, so every call is wrapped
 * and swallows its own errors.
 */

export interface CronRunMetrics {
  recordsChecked?: number
  recordsChanged?: number
  firecrawlCalls?: number
  firecrawlFailures?: number
  anthropicCalls?: number
  anthropicFailures?: number
  /** Free-form extras merged into details. */
  extra?: Record<string, unknown>
}

/**
 * Insert a `running` row and return its id (or null if the insert failed —
 * callers should treat null as "logging unavailable" and carry on).
 */
export async function startCronRun(
  supabase: SupabaseClient,
  jobName: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('cron_runs')
      .insert({ job_name: jobName, status: 'running' })
      .select('id')
      .single()
    if (error || !data) return null
    return data.id as string
  } catch {
    return null
  }
}

/**
 * Close out a run row with its final status + metrics. No-op when `runId` is
 * null (start failed). Never throws.
 */
export async function finishCronRun(
  supabase: SupabaseClient,
  runId: string | null,
  opts: {
    status: 'success' | 'partial' | 'failed'
    error?: string
  } & CronRunMetrics,
): Promise<void> {
  if (!runId) return
  const { status, error, extra, ...metrics } = opts
  const details: Record<string, unknown> = {}
  if (metrics.recordsChecked != null) details.records_checked = metrics.recordsChecked
  if (metrics.recordsChanged != null) details.records_changed = metrics.recordsChanged
  if (metrics.firecrawlCalls != null) details.firecrawl_calls = metrics.firecrawlCalls
  if (metrics.firecrawlFailures != null) details.firecrawl_failures = metrics.firecrawlFailures
  if (metrics.anthropicCalls != null) details.anthropic_calls = metrics.anthropicCalls
  if (metrics.anthropicFailures != null) details.anthropic_failures = metrics.anthropicFailures
  if (extra) Object.assign(details, extra)
  try {
    await supabase
      .from('cron_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_message: error ?? null,
        details: Object.keys(details).length ? details : null,
      })
      .eq('id', runId)
  } catch {
    /* logging failure must never break the cron */
  }
}
