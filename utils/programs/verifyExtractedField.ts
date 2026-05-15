/**
 * Auto-verify a program field against the raw scraped markdown.
 *
 * Editor clicks "🔍 Verify against source" → this calls Sonnet with:
 *   - Current value (live on site, possibly stale)
 *   - Extracted value (Sonnet's new extraction)
 *   - Raw markdown (what's actually on the source page right now)
 *
 * Sonnet returns:
 *   - verdict: confirmed | corrected | unverifiable
 *   - discrepancies: list of specific facts where current/extracted disagreed
 *     and what the source actually says
 *   - corrected_value: the final markdown in current's voice with verified
 *     facts swapped in (drops things source contradicts, adds things source
 *     confirms that current was missing)
 *
 * Result is stored in program_extractions.verifications[<field>]. The Apply
 * button picks up corrected_value when present (priority order: verification
 * → manual_override → auto-merge → extracted).
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import { MERGEABLE_FIELDS } from '@/utils/programs/mergeExtractedField'

const MODEL = 'claude-sonnet-4-6'

export function isVerifiableField(field: string): boolean {
  // Same set as merge — text fields where comparing current vs extracted vs
  // markdown produces a meaningful corrected version.
  return MERGEABLE_FIELDS.has(field)
}

const VERIFY_SYSTEM_PROMPT = `You are a fact-verification specialist for points-and-miles loyalty program content.

You're given THREE versions of a single field on a program reference page:
1. CURRENT — what's live on the site today. Was hand-authored by an editor. May be stale.
2. EXTRACTED — what Sonnet just extracted from the source page. May be wrong.
3. SOURCE MARKDOWN — the raw scraped content of the source page right now. This is ground truth.

Your job: produce a VERIFIED FINAL version of the field by reconciling all three against the source.

CORE RULES:
1. Keep CURRENT's voice, tone, structure, formatting. The editor's voice matters; don't flatten it.
2. For each specific fact in CURRENT (named lounges, dates, counts, exception clauses, named exclusions):
   - If SOURCE MARKDOWN contains the same fact → keep it.
   - If SOURCE MARKDOWN explicitly contradicts → drop or correct it (note the change).
   - If SOURCE MARKDOWN is silent on it → KEEP it (don't drop something unverifiable; absence ≠ contradiction).
3. For each specific fact in EXTRACTED that's not in CURRENT:
   - If SOURCE MARKDOWN confirms → add it to the final version in current's voice.
   - If SOURCE MARKDOWN is silent → DON'T add it (treat with skepticism — Sonnet may have hallucinated).
4. Specific = dollar amounts, point amounts, dates, named programs, named exclusions, percentages, counts.
5. Generic = "comprehensive priority services", "industry-leading", "best-in-class" — neither add nor drop based on this slop.

DISCREPANCY REPORTING:
For each fact where CURRENT and EXTRACTED disagree (or where you changed something), produce a discrepancy entry:
  - claim: short description of the fact in question
  - current_says: what current claimed (or "(silent)")
  - extracted_says: what extracted claimed (or "(silent)")
  - source_says: what the source markdown says (or "(silent)")
  - resolution: kept_current | used_extracted | corrected | dropped | flagged_for_human

If the source markdown is too thin to verify a fact, set resolution=flagged_for_human and surface it in notes.

VERDICT:
- "confirmed": source confirms current AND extracted agree with each other (no changes needed).
- "corrected": source caused at least one change to current's facts.
- "unverifiable": source markdown is too sparse / not the right page to verify most claims. Keep current as-is.

OUTPUT FORMAT — return ONLY valid JSON, no prose, no markdown fence:
{
  "verdict": "confirmed" | "corrected" | "unverifiable",
  "discrepancies": [
    {
      "claim": "string",
      "current_says": "string",
      "extracted_says": "string",
      "source_says": "string",
      "resolution": "kept_current" | "used_extracted" | "corrected" | "dropped" | "flagged_for_human"
    }
  ],
  "corrected_value": "<final markdown — current's voice + verified facts>",
  "notes": "<one-paragraph narrative for the editor>"
}`

function buildVerifyUserPrompt(
  field: string,
  currentValue: string,
  extractedValue: string,
  markdown: string,
): string {
  // Truncate markdown to keep cost reasonable. 30k chars ≈ 7k tokens.
  const truncated = markdown.length > 30000 ? markdown.slice(0, 30000) + '\n\n[... markdown truncated for cost; first 30k chars only]' : markdown
  return `Field name: ${field}

=== CURRENT (live on site today) ===
${currentValue}

=== EXTRACTED (Sonnet's new extraction) ===
${extractedValue}

=== SOURCE MARKDOWN (ground truth — verify against this) ===
${truncated}

Return only the JSON object specified in the system prompt. No prose, no code fence.`
}

export type VerificationResult =
  | {
      ok: true
      verdict: 'confirmed' | 'corrected' | 'unverifiable'
      discrepancies: Array<{
        claim: string
        current_says: string
        extracted_says: string
        source_says: string
        resolution: string
      }>
      corrected_value: string
      notes: string
    }
  | { ok: false; error: string }

export async function verifyExtractedField({
  programId,
  field,
  currentValue,
  extractedValue,
  markdown,
  extractionId,
}: {
  programId: string
  field: string
  currentValue: string
  extractedValue: string
  markdown: string
  extractionId: string
}): Promise<VerificationResult> {
  if (!isVerifiableField(field)) {
    await persistVerifyError(extractionId, field, `Field "${field}" is not verifiable (text fields only)`)
    return { ok: false, error: `Field "${field}" is not verifiable (text fields only)` }
  }
  if (!currentValue?.trim() || !extractedValue?.trim()) {
    await persistVerifyError(extractionId, field, 'Current or extracted value is empty — nothing to verify')
    return { ok: false, error: 'Current or extracted value is empty — nothing to verify' }
  }
  if (!markdown?.trim()) {
    await persistVerifyError(extractionId, field, 'No source markdown available — cannot verify')
    return { ok: false, error: 'No source markdown available — cannot verify' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    await persistVerifyError(extractionId, field, 'ANTHROPIC_API_KEY not set')
    return { ok: false, error: 'ANTHROPIC_API_KEY not set' }
  }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: VERIFY_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildVerifyUserPrompt(field, currentValue, extractedValue, markdown) },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await persistVerifyError(extractionId, field, `Sonnet error: ${message}`)
    return { ok: false, error: `Sonnet error: ${message}` }
  }

  await logUsage(response, 'program_field_verify', { program_id: programId, field })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    await persistVerifyError(extractionId, field, 'Sonnet returned no text content')
    return { ok: false, error: 'Sonnet returned no text content' }
  }

  // Strip any accidental code fences
  let raw = textBlock.text.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: {
    verdict?: string
    discrepancies?: Array<Record<string, string>>
    corrected_value?: string
    notes?: string
  }
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await persistVerifyError(extractionId, field, `Could not parse Sonnet JSON: ${msg}. First 500 chars: ${raw.slice(0, 500)}`)
    return { ok: false, error: `Could not parse Sonnet JSON: ${msg}` }
  }

  const verdict = parsed.verdict as 'confirmed' | 'corrected' | 'unverifiable' | undefined
  if (!verdict || !['confirmed', 'corrected', 'unverifiable'].includes(verdict)) {
    await persistVerifyError(extractionId, field, `Invalid verdict: ${verdict}`)
    return { ok: false, error: `Invalid verdict: ${verdict}` }
  }
  if (!parsed.corrected_value || typeof parsed.corrected_value !== 'string') {
    await persistVerifyError(extractionId, field, 'Sonnet did not return corrected_value')
    return { ok: false, error: 'Sonnet did not return corrected_value' }
  }

  const result = {
    verdict,
    discrepancies: Array.isArray(parsed.discrepancies)
      ? parsed.discrepancies.map((d) => ({
          claim: String(d.claim ?? ''),
          current_says: String(d.current_says ?? ''),
          extracted_says: String(d.extracted_says ?? ''),
          source_says: String(d.source_says ?? ''),
          resolution: String(d.resolution ?? 'flagged_for_human'),
        }))
      : [],
    corrected_value: parsed.corrected_value,
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
  }

  // Persist into program_extractions.verifications
  const supabase = createAdminClient()
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('verifications')
    .eq('id', extractionId)
    .single()

  const verifications =
    (extractionRow?.verifications as Record<string, unknown> | null) ?? {}
  verifications[field] = {
    ...result,
    generated_at: new Date().toISOString(),
  }

  const { error: updateErr } = await supabase
    .from('program_extractions')
    .update({ verifications })
    .eq('id', extractionId)

  if (updateErr) {
    await persistVerifyError(extractionId, field, `Persist failed: ${updateErr.message}`)
    return { ok: false, error: `Persist failed: ${updateErr.message}` }
  }

  return { ok: true, ...result }
}

/**
 * Write an error into verifications[field] so the UI surfaces what went wrong
 * instead of silently returning nothing on the page. Survives concurrent
 * writes for non-overlapping field keys.
 */
async function persistVerifyError(
  extractionId: string,
  field: string,
  errorMessage: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: row } = await supabase
      .from('program_extractions')
      .select('verifications')
      .eq('id', extractionId)
      .single()
    const verifications = (row?.verifications as Record<string, unknown> | null) ?? {}
    verifications[field] = {
      verdict: 'error',
      error: errorMessage,
      generated_at: new Date().toISOString(),
      discrepancies: [],
      corrected_value: '',
      notes: errorMessage,
    }
    await supabase
      .from('program_extractions')
      .update({ verifications })
      .eq('id', extractionId)
  } catch (e) {
    // Last-resort logging — we already returned the error to the caller
    console.error('[verify] persistVerifyError itself failed:', e)
  }
}
