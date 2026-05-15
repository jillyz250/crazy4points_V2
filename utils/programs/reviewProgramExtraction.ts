/**
 * Second-pass review for program extraction.
 * Mirrors utils/cards/reviewExtraction.ts but adapted to ProgramExtraction shape.
 *
 * Pass 2's job is narrow: find what pass 1 MISSED on the program page.
 * Conservative bias; only adds, never modifies.
 */

import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { logUsage } from '@/utils/ai/logUsage'
import type { ProgramExtraction } from '@/utils/programs/programExtractionSchema'

const REVIEW_MODEL = 'claude-sonnet-4-6'

type ReviewResponse = {
  additions?: Partial<ProgramExtraction>
  review_notes?: string[]
}

export type ReviewResult = {
  extraction: ProgramExtraction
  addedFields: number
  ran: boolean
}

const REVIEW_SYSTEM_PROMPT = `You are reviewing a first-pass program extraction. Your job: identify fields the first pass returned NULL where the markdown actually has content.

CORE RULES:
1. ONLY add values for fields where pass 1 returned null.
2. ONLY add what's explicitly in the source markdown. Never invent.
3. EVERY addition includes a source_quote — verbatim from the markdown.
4. Conservative bias: when in doubt, do NOT add.
5. Output strict JSON. No prose. No markdown fences.

WHAT TO LOOK FOR:
- Buried lounge access details deeper in FAQ sections
- Award chart references / point amounts the first pass missed
- Sweet spot examples in editorial blocks
- Quirky rules in fine print
- Hubs mentioned in route maps or "Where we fly" sections
- Alliance membership not explicitly named but implied by partner lists
- Status tier qualifications described elsewhere on the page

If a field already has a value (not null) — DO NOT modify it. Skip it.`

function buildReviewUserPrompt(
  programName: string,
  markdown: string,
  pass1: ProgramExtraction,
): string {
  // Build summary of which fields are null vs already populated, so Sonnet
  // can focus only on what's missing.
  const fieldStates: Record<string, string> = {
    intro: pass1.intro?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    sweet_spots: pass1.sweet_spots?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    lounge_access: pass1.lounge_access?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    quirks: pass1.quirks?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    award_chart: pass1.award_chart?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    alliance: pass1.alliance?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    hubs: pass1.hubs?.value && pass1.hubs.value.length > 0 ? 'POPULATED — do not modify' : 'NULL — look for content',
    parent_program_slug: pass1.parent_program_slug?.value ? 'POPULATED — do not modify' : 'NULL — look for content',
    tier_benefits: pass1.tier_benefits?.rows?.length ? 'POPULATED — do not modify' : 'NULL — look for content',
  }

  return `Review the program extraction for: ${programName}

PASS 1 FIELD STATES:
${Object.entries(fieldStates).map(([k, v]) => `  ${k}: ${v}`).join('\n')}

Look at the markdown below and find content for any NULL fields. Skip POPULATED fields.

ORIGINAL MARKDOWN:
---
${markdown}
---

Return JSON:
{
  "additions": {
    "<field_name>": { "value": <correct shape>, "source_quote": <verbatim string>, "confidence": "high"|"medium"|"low" },
    ...
  },
  "review_notes": [ "<observations>" ]
}

Only include fields you can confidently add. Omit fields entirely if no content found. If nothing to add:
{ "additions": {}, "review_notes": ["No additions - pass 1 was complete or markdown was silent on missing fields."] }

Return the JSON now.`
}

export async function reviewProgramExtraction({
  programName,
  markdown,
  programId,
  extraction,
}: {
  programName: string
  markdown: string
  programId: string
  extraction: ProgramExtraction
}): Promise<ReviewResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { extraction, addedFields: 0, ran: false }
  }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: REVIEW_MODEL,
      max_tokens: 6000,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildReviewUserPrompt(programName, markdown, extraction) }],
    })
  } catch (err) {
    console.warn(`[program-extract] review pass error (non-fatal):`, err)
    return { extraction, addedFields: 0, ran: false }
  }

  await logUsage(response, 'program_extraction_review', { program_id: programId })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { extraction, addedFields: 0, ran: false }
  }

  let parsed: ReviewResponse
  try {
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    if (!cleaned.startsWith('{')) return { extraction, addedFields: 0, ran: false }
    try {
      parsed = JSON.parse(cleaned) as ReviewResponse
    } catch {
      parsed = JSON.parse(jsonrepair(cleaned)) as ReviewResponse
    }
  } catch {
    return { extraction, addedFields: 0, ran: false }
  }

  // Merge: only apply additions to currently-null fields.
  const additions = parsed.additions ?? {}
  const merged: ProgramExtraction = { ...extraction }
  let addedFields = 0

  for (const [field, addition] of Object.entries(additions)) {
    if (!addition) continue
    const currentValue = (extraction as unknown as Record<string, { value?: unknown }>)[field]?.value
    if (currentValue == null) {
      // Safe to add - the field was empty
      ;(merged as unknown as Record<string, unknown>)[field] = addition
      addedFields++
    }
  }

  if (parsed.review_notes && parsed.review_notes.length > 0) {
    merged.extraction_warnings = [
      ...(merged.extraction_warnings ?? []),
      ...parsed.review_notes.map((n) => `Review: ${n}`),
    ]
  }
  if (addedFields > 0) {
    merged.extraction_warnings = [
      ...(merged.extraction_warnings ?? []),
      `Review pass added ${addedFields} previously-null field(s).`,
    ]
  }

  return { extraction: merged, addedFields, ran: true }
}
