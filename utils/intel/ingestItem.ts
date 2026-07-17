/**
 * ingestItem — shared insert path for every intake source.
 *
 * Every intake source (Scout, email-forwarding, Grok poller, manual paste)
 * calls this function. It runs the three-layer dedup pipeline + Haiku diff
 * before writing, logs failures to intel_ingest_errors, and returns enough
 * structured info that the caller can decide what to do next (e.g. Scout's
 * "stage as alert" path runs only when this returns kind='inserted').
 *
 * See plans/content-pipeline-overhaul-2026-05-20.md (v9) — "Dedup model" and
 * "Ingestion error contract" sections.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeHeadline } from './normalizeHeadline'
import { findSimilarHeadline } from './findSimilarHeadline'
import { haikuDiff } from './haikuDiff'
import { getRecentDecisionFor } from '@/utils/supabase/queries'
import type { AlertType } from '@/utils/supabase/queries'

export interface IngestItemInput {
  source: 'scout' | 'email' | 'grok' | 'manual' | 'x'
  source_url?: string | null
  source_type: 'official' | 'blog' | 'reddit' | 'social' | 'email' | 'ai-discovery' | 'manual'
  source_name: string
  raw_text?: string | null
  headline: string
  confidence: 'high' | 'medium' | 'low'
  alert_type?: string | null
  programs?: string[] | null
  expires_at?: string | null
  /** Pre-classified by caller. Used to set the fact_origin chip. */
  fact_origin?:
    | 'official'
    | 'secondary'
    | 'social-rumor'
    | 'inferred'
    | 'ai-discovered-only'
    | null
  /**
   * Human-readable names of every source that reported this same story in the
   * SAME extraction batch (Scout's confirming_source_ids, mapped to names).
   * When 2+ are present we seed confirmation_count/confirming_sources on the
   * inserted row, because headline trigram dedup (Layer 3) can't recognize the
   * same story across different blog wording and so never counts them itself.
   */
  confirming_sources?: string[] | null
}

export type IngestResult =
  | { kind: 'inserted'; intel_id: string }
  | {
      kind: 'suppressed_as_dup'
      intel_id: string
      dup_of_intel_id: string
      reason: 'layer2_semantic' | 'layer3_fuzzy' | 'race_unique'
    }
  | {
      kind: 'surfaced_as_update'
      intel_id: string
      update_to_alert_id: string
      summary: string
      categories: string[]
      fail_open: boolean
    }
  | { kind: 'error'; stage: string; message: string }

/**
 * Process one intel candidate end-to-end. Always writes a row (intel_items
 * insert OR intel_ingest_errors on hard failure). Always returns a typed result.
 */
export async function ingestItem(
  supabase: SupabaseClient,
  input: IngestItemInput,
  programSlugToId?: Map<string, string>,
): Promise<IngestResult> {
  const headlineNormalized = normalizeHeadline(input.headline)

  // -------------------------------------------------------------------------
  // Layer 2 — semantic dedup via getRecentDecisionFor (status-aware).
  // Blocks only when an active alert exists for same program + alert_type.
  // -------------------------------------------------------------------------
  let layer2Block: Awaited<ReturnType<typeof getRecentDecisionFor>> = null
  try {
    if (input.alert_type && input.programs?.length && programSlugToId) {
      const primarySlug = input.programs[0]
      const primaryProgramId = programSlugToId.get(primarySlug) ?? null
      if (primaryProgramId) {
        layer2Block = await getRecentDecisionFor(
          supabase,
          primaryProgramId,
          input.alert_type as AlertType,
        )
      }
    }
  } catch (err) {
    return await logErrorAndReturn(supabase, input, 'dedup', err)
  }

  // -------------------------------------------------------------------------
  // Layer 3 — fuzzy headline similarity over last 14 days.
  // Independent of Layer 2; can catch dups Layer 2 missed (e.g. no program tag).
  // -------------------------------------------------------------------------
  let layer3Match: Awaited<ReturnType<typeof findSimilarHeadline>> = null
  try {
    layer3Match = await findSimilarHeadline(supabase, headlineNormalized)
  } catch (err) {
    return await logErrorAndReturn(supabase, input, 'dedup', err)
  }

  // -------------------------------------------------------------------------
  // Decision tree:
  //
  //   Layer 2 hits AND has active alert → Haiku diff
  //     ├─ has_new_facts=true  → insert + update_to_alert_id (surface in Triage)
  //     └─ has_new_facts=false → insert with dup_of=<intel_id of source alert>
  //                              (we don't have intel_id here — use Layer 3
  //                              match if available, else alert_id stays linked)
  //
  //   Layer 2 misses, Layer 3 hits → insert with dup_of_intel_id = match.id
  //                                  (silent suppress)
  //
  //   Both miss → insert normally
  // -------------------------------------------------------------------------

  // Seed corroboration only on real multi-source stories (2+). A single-source
  // finding lists just its own id, which is not corroboration — leave the
  // defaults (0 / null) so the Triage "confirmed by N" badge stays honest.
  const distinctConfirming = Array.from(new Set(input.confirming_sources ?? [])).filter(Boolean)
  const corroboration =
    distinctConfirming.length >= 2
      ? { confirmation_count: distinctConfirming.length, confirming_sources: distinctConfirming }
      : {}

  // Helper to write the row with all the right metadata.
  const baseInsert = {
    source_url: input.source_url ?? null,
    source_type: input.source_type,
    source_name: input.source_name,
    raw_text: input.raw_text ?? null,
    headline: input.headline,
    headline_normalized: headlineNormalized,
    confidence: input.confidence,
    alert_type: input.alert_type ?? null,
    programs: input.programs ?? null,
    expires_at: input.expires_at ?? null,
    fact_origin: input.fact_origin ?? null,
    ...corroboration,
  }

  if (layer2Block?.block) {
    // Fetch the matched alert's summary so the diff compares real content, not
    // just the title. Without it the classifier was near-blind and mislabeled
    // different-but-same-program stories as "updates."
    let existingSummary: string | null = null
    try {
      const { data: alertRow } = await supabase
        .from('alerts')
        .select('summary')
        .eq('id', layer2Block.alert.id)
        .maybeSingle()
      existingSummary = (alertRow?.summary as string | null) ?? null
    } catch {
      /* non-fatal — diff still has the title */
    }

    // Active alert exists. Run Haiku diff to classify the relation.
    let diff
    try {
      diff = await haikuDiff({
        existing_alert: {
          title: layer2Block.alert.title,
          summary: existingSummary,
        },
        new_intel: {
          headline: input.headline,
          raw_text: input.raw_text ?? null,
          expires_at: input.expires_at ?? null,
        },
      })
    } catch (err) {
      return await logErrorAndReturn(supabase, input, 'haiku-diff', err)
    }

    // "different_story": same program + alert_type but a genuinely different
    // offer. Not a dup and not an update — fall through to the normal insert
    // path below so it stages as its own alert.
    if (diff.relation !== 'different_story') {
    if (diff.relation === 'same_story_new_facts') {
      // Surface as an update to the existing alert.
      try {
        const { data, error } = await supabase
          .from('intel_items')
          .insert({
            ...baseInsert,
            update_to_alert_id: layer2Block.alert.id,
            haiku_diff_summary: diff.summary,
            haiku_diff_categories: diff.categories,
            haiku_diff_fail_open: diff.fail_open,
          })
          .select('id')
          .single()
        if (error) return await handleInsertError(supabase, input, error)
        return {
          kind: 'surfaced_as_update',
          intel_id: data.id,
          update_to_alert_id: layer2Block.alert.id,
          summary: diff.summary,
          categories: diff.categories,
          fail_open: diff.fail_open,
        }
      } catch (err) {
        return await logErrorAndReturn(supabase, input, 'insert', err)
      }
    }

    // same_story_dup → silently suppress as dup.
    // Layer 2 doesn't give us a source intel_id, but Layer 3 might.
    const originalIntelId = layer3Match?.id ?? null
    try {
      const { data, error } = await supabase
        .from('intel_items')
        .insert({
          ...baseInsert,
          processed: true,
          dup_of_intel_id: originalIntelId,
        })
        .select('id')
        .single()
      if (error) return await handleInsertError(supabase, input, error)
      if (originalIntelId) {
        await supabase.rpc('increment_intel_confirmation', {
          p_intel_id: originalIntelId,
          p_source: input.source_name,
        })
      }
      return {
        kind: 'suppressed_as_dup',
        intel_id: data.id,
        dup_of_intel_id: originalIntelId ?? layer2Block.alert.id,
        reason: 'layer2_semantic',
      }
    } catch (err) {
      return await logErrorAndReturn(supabase, input, 'insert', err)
    }
    } // end: relation !== 'different_story' (different_story falls through to normal insert)
  }

  if (layer3Match) {
    // No active alert but a similar headline exists in the last 14 days.
    // Silently attach as a dup.
    try {
      const { data, error } = await supabase
        .from('intel_items')
        .insert({
          ...baseInsert,
          processed: true,
          dup_of_intel_id: layer3Match.id,
        })
        .select('id')
        .single()
      if (error) return await handleInsertError(supabase, input, error)
      await supabase.rpc('increment_intel_confirmation', {
        p_intel_id: layer3Match.id,
        p_source: input.source_name,
      })
      return {
        kind: 'suppressed_as_dup',
        intel_id: data.id,
        dup_of_intel_id: layer3Match.id,
        reason: 'layer3_fuzzy',
      }
    } catch (err) {
      return await logErrorAndReturn(supabase, input, 'insert', err)
    }
  }

  // Both layers miss — insert normally.
  try {
    const { data, error } = await supabase
      .from('intel_items')
      .insert(baseInsert)
      .select('id')
      .single()
    if (error) return await handleInsertError(supabase, input, error)
    return { kind: 'inserted', intel_id: data.id }
  } catch (err) {
    return await logErrorAndReturn(supabase, input, 'insert', err)
  }
}

/**
 * 23505 = unique_violation on (headline_normalized, day) UNIQUE — race guard.
 * Convert to a silent dup attachment against the row that won the race.
 */
async function handleInsertError(
  supabase: SupabaseClient,
  input: IngestItemInput,
  error: { code?: string; message?: string },
): Promise<IngestResult> {
  if (error.code === '23505') {
    // Look up the winning row by (headline_normalized, UTC day).
    const headlineNormalized = normalizeHeadline(input.headline)
    const today = new Date().toISOString().slice(0, 10) // UTC date
    const { data: winner } = await supabase
      .from('intel_items')
      .select('id')
      .eq('headline_normalized', headlineNormalized)
      .gte('created_at', today + 'T00:00:00Z')
      .lt('created_at', today + 'T23:59:59Z')
      .limit(1)
      .single()
    if (winner?.id) {
      await supabase.rpc('increment_intel_confirmation', {
        p_intel_id: winner.id,
        p_source: input.source_name,
      })
      return {
        kind: 'suppressed_as_dup',
        intel_id: winner.id, // we never inserted our own row
        dup_of_intel_id: winner.id,
        reason: 'race_unique',
      }
    }
  }
  return await logErrorAndReturn(supabase, input, 'insert', error)
}

async function logErrorAndReturn(
  supabase: SupabaseClient,
  input: IngestItemInput,
  stage: 'classify' | 'dedup' | 'haiku-diff' | 'insert' | 'surface' | 'security' | 'parse',
  err: unknown,
): Promise<IngestResult> {
  const message = extractErrorMessage(err)
  try {
    await supabase.from('intel_ingest_errors').insert({
      source: input.source,
      stage,
      payload: input as unknown as Record<string, unknown>,
      error_message: message.slice(0, 1000),
      error_stack: err instanceof Error ? err.stack?.slice(0, 4000) ?? null : null,
    })
  } catch {
    // Last-resort: console.error so it shows up in Vercel logs at least.
    console.error('[ingestItem] failed to log to intel_ingest_errors', message)
  }
  return { kind: 'error', stage, message }
}

/**
 * Pull a useful string out of any error shape. PostgrestError isn't an Error
 * instance — it's a plain object with .message / .code / .details / .hint —
 * so String(err) gives "[object Object]". Walk the shape carefully.
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const parts: string[] = []
    if (typeof e.message === 'string') parts.push(e.message)
    if (typeof e.code === 'string') parts.push(`code=${e.code}`)
    if (typeof e.details === 'string') parts.push(`details=${e.details}`)
    if (typeof e.hint === 'string') parts.push(`hint=${e.hint}`)
    if (parts.length > 0) return parts.join('; ')
  }
  return String(err)
}
