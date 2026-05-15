/**
 * Merge a program field's current value with the newly-extracted value.
 *
 * Calls Sonnet with both versions + an instruction to keep the current's
 * voice/structure and add only NEW facts from extracted. Used when the
 * editor wants the best of both rather than choosing one over the other.
 *
 * Only applies to text fields (intro, sweet_spots, lounge_access, quirks,
 * award_chart). Structured fields (tier_benefits, hubs, alliance) use plain
 * Apply/Skip — merge is overkill for them.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'

const MODEL = 'claude-sonnet-4-6'

// Fields where merge makes sense (long-form editorial text)
export const MERGEABLE_FIELDS = new Set([
  'intro',
  'sweet_spots',
  'lounge_access',
  'quirks',
  'award_chart',
])

export function isMergeableField(field: string): boolean {
  return MERGEABLE_FIELDS.has(field)
}

const MERGE_SYSTEM_PROMPT = `You are an editorial merge specialist for points-and-miles content. Your job: combine a current manually-authored value with newly-extracted facts, producing a single cohesive version that keeps the current's voice and adds anything new from the extracted version.

CORE RULES:
1. PRESERVE the current's voice, tone, structure, formatting, and editorial style. The current was hand-written by the editor in their brand voice; do NOT flatten it into something generic.
2. ADD facts from the extracted version that are not already in the current. Only add facts that:
   - Are explicitly in the extracted content
   - Are not already present in the current (even implicitly)
   - Add genuine value (specific numbers, dates, exceptions, named programs)
3. DROP NOTHING from the current. Every sentence, bullet, table row, and inline detail in the current stays. Only ADDITIONS happen.
4. If a fact in extracted contradicts the current, KEEP THE CURRENT and add a parenthetical note like "(extraction source says X — verify)". Do NOT silently overwrite.
5. Output should match the current's format exactly — same heading levels, same bullet style, same use of bold/italic.
6. Output is plain markdown text. No JSON wrapping, no explanation, no preamble.

VOICE NOTES:
- Points-and-miles audience — already knows what miles are, doesn't need basics explained.
- Conversational, occasionally cheeky. Not corporate.
- If the current is sassy, the merge stays sassy.
- If the current is straightforward, the merge stays straightforward — don't add sass that wasn't there.

FACTS ARE THE PRIORITY:
- Specific dollar amounts, point amounts, dates, exception clauses, named exclusions are HIGH-VALUE — add them.
- Generic restatements of the current are LOW-VALUE — skip them.

PLAIN-ENGLISH JARGON RULES (always apply):
- Use "fuel surcharge" / "fuel surcharges". NEVER use "YQ" or "YR" (those are IATA fare codes; civilians don't know them).
- Use "round-the-world" (RTW is fine on second mention if already introduced).
- Spell out tier-status abbreviations on first mention: TQP → "tier-qualifying points", MQD → "medallion qualification dollars", PQP → "premier qualifying points", CPQP → "Companion Pass qualifying points".
- If current already uses an abbreviation on first mention, expand it in the merge.

If the extracted version has NOTHING new to add, return the current verbatim.

Return ONLY the merged markdown text. No prefix, no suffix, no code fences.`

function buildMergeUserPrompt(field: string, currentValue: string, extractedValue: string): string {
  return `Merge these two versions of the "${field}" field on a points-and-miles program page.

CURRENT (manually authored, keep voice + structure):
---
${currentValue}
---

NEWLY EXTRACTED (add new facts only, do not replace):
---
${extractedValue}
---

Return the merged markdown. Keep current's voice + structure. Add only new facts from extracted that aren't already in current. Drop nothing.`
}

export type MergeResult =
  | { ok: true; merged: string }
  | { ok: false; error: string }

export async function mergeExtractedField({
  programId,
  field,
  currentValue,
  extractedValue,
  extractionId,
}: {
  programId: string
  field: string
  currentValue: string
  extractedValue: string
  extractionId: string
}): Promise<MergeResult> {
  if (!isMergeableField(field)) {
    return { ok: false, error: `Field "${field}" is not mergeable (only text fields support merge)` }
  }
  if (!currentValue || !currentValue.trim()) {
    return { ok: false, error: 'Current value is empty — nothing to merge with. Use Apply instead.' }
  }
  if (!extractedValue || !extractedValue.trim()) {
    return { ok: false, error: 'Extracted value is empty — nothing to merge in. Keep current as-is.' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: MERGE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildMergeUserPrompt(field, currentValue, extractedValue) }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Sonnet error: ${message}` }
  }

  await logUsage(response, 'program_field_merge', { program_id: programId, field })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, error: 'Sonnet returned no text content' }
  }

  // Strip any accidental code fences (despite the prompt asking for none)
  let merged = textBlock.text.trim()
  merged = merged.replace(/^```(?:markdown|md|text)?\s*/i, '').replace(/```\s*$/i, '').trim()

  // Persist into program_extractions.merged_fields
  const supabase = createAdminClient()
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('merged_fields')
    .eq('id', extractionId)
    .single()

  const mergedFields = ((extractionRow?.merged_fields as Record<string, { value: string; generated_at: string }> | null) ?? {})
  mergedFields[field] = { value: merged, generated_at: new Date().toISOString() }

  const { error: updateErr } = await supabase
    .from('program_extractions')
    .update({ merged_fields: mergedFields })
    .eq('id', extractionId)

  if (updateErr) {
    return { ok: false, error: `Persist failed: ${updateErr.message}` }
  }

  return { ok: true, merged }
}
