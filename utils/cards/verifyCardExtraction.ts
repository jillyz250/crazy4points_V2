/**
 * Auto-verify a credit card extraction against the scraped source markdown.
 *
 * Sonnet receives the full CardExtraction JSON + raw_markdown and returns:
 *   - Overall verdict (confirmed / corrected / unverifiable)
 *   - Per-field verdicts with source quotes + corrected values
 *   - A one-paragraph narrative for the editor
 *
 * Persists to credit_card_extractions.verifications. Admin UI surfaces the
 * verdicts so the editor can review + apply corrections without manually
 * comparing extraction against the issuer page.
 *
 * Mirror of utils/programs/verifyExtractedField.ts but adapted for the
 * structured CardExtraction shape (cards have arrays of benefits, earn rates,
 * etc. — programs are flat narrative fields).
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

const MODEL = 'claude-sonnet-4-6'

const VERIFY_SYSTEM_PROMPT = `You are a fact-verification specialist for credit card content.

You receive TWO things:
1. A CardExtraction JSON that an extraction agent produced from a card's issuer page.
2. The SOURCE MARKDOWN — the raw scraped content of the card's official page right now. This is ground truth.

Your job: reconcile the extraction against the source markdown and surface per-field verdicts.

CORE RULES:
1. For each top-level field in the extraction, check whether the markdown supports the extracted value.
2. Verdict per field:
   - confirmed: markdown supports the extracted value verbatim
   - corrected: markdown says something different — provide the corrected_value
   - unverifiable: markdown is silent on this field (don't change the extraction; just flag)
3. Absence ≠ contradiction. If the markdown doesn't mention something, mark unverifiable, NOT corrected. Don't drop facts just because they're not on this scrape.
4. For arrays (benefits, earn_rates):
   - Identify each item by a stable key (benefit name; earn_rate category)
   - Per item: confirmed / corrected / unverifiable
   - Also flag missing-items the markdown mentions but the extraction didn't capture
   - Also flag extra-items the extraction has but the markdown doesn't support

PLAIN-ENGLISH JARGON RULES (apply to all corrected_value fields):
- Use "fuel surcharge" / "fuel surcharges". NEVER use "YQ" or "YR".
- Use "round-the-world" (RTW abbreviation only on second mention).
- Spell out tier-status abbreviations on first mention (TQP, MQD, PQP, CPQP).

VERDICT (top-level):
- confirmed: every field is confirmed; no corrections
- corrected: at least one field was corrected
- unverifiable: the markdown is too sparse to verify most fields (e.g., wrong page scraped)

OUTPUT: call the submit_verification tool with the structured fields.`

function buildVerifyUserPrompt(extraction: CardExtraction, markdown: string, cardName: string): string {
  const extractionJson = JSON.stringify(extraction, null, 2)
  // Truncate markdown to 35k chars to keep cost reasonable; cards are usually well under this.
  const truncated = markdown.length > 35000 ? markdown.slice(0, 35000) + '\n\n[... markdown truncated]' : markdown
  return `Card: ${cardName}

=== EXTRACTED CardExtraction JSON ===
${extractionJson}

=== SOURCE MARKDOWN (ground truth) ===
${truncated}

Call submit_verification with per-field verdicts.`
}

export type CardFieldVerdict = {
  field: string
  verdict: 'confirmed' | 'corrected' | 'unverifiable'
  extracted_value: string
  source_says: string
  corrected_value: string
  note: string
}

export type CardVerificationResult =
  | {
      ok: true
      verdict: 'confirmed' | 'corrected' | 'unverifiable'
      notes: string
      field_verdicts: CardFieldVerdict[]
    }
  | { ok: false; error: string }

export async function verifyCardExtraction({
  cardId,
  cardName,
  extraction,
  markdown,
  extractionId,
}: {
  cardId: string
  cardName: string
  extraction: CardExtraction
  markdown: string
  extractionId: string
}): Promise<CardVerificationResult> {
  if (!markdown?.trim()) {
    await persistVerifyError(extractionId, 'No source markdown — cannot verify')
    return { ok: false, error: 'No source markdown available' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    await persistVerifyError(extractionId, 'ANTHROPIC_API_KEY not set')
    return { ok: false, error: 'ANTHROPIC_API_KEY not set' }
  }

  const client = new Anthropic({ apiKey })

  const verifyTool = {
    name: 'submit_verification',
    description: 'Submit per-field verification of the card extraction',
    input_schema: {
      type: 'object' as const,
      properties: {
        verdict: {
          type: 'string',
          enum: ['confirmed', 'corrected', 'unverifiable'],
        },
        notes: {
          type: 'string',
          description: 'One-paragraph narrative for the editor explaining the overall verification.',
        },
        field_verdicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                description: 'Field name. Examples: "annual_fee_usd", "welcome_bonus.main.bonus_amount", "intro", "benefit:Priority Pass Select", "earn_rate:dining".',
              },
              verdict: {
                type: 'string',
                enum: ['confirmed', 'corrected', 'unverifiable'],
              },
              extracted_value: {
                type: 'string',
                description: 'The value the extraction had (stringified).',
              },
              source_says: {
                type: 'string',
                description: 'What the source markdown says about this field. "(silent)" if markdown does not mention it.',
              },
              corrected_value: {
                type: 'string',
                description: 'The recommended value after verification. Same as extracted_value when verdict=confirmed or unverifiable.',
              },
              note: {
                type: 'string',
                description: 'One-sentence reason for the verdict.',
              },
            },
            required: ['field', 'verdict', 'extracted_value', 'source_says', 'corrected_value', 'note'],
          },
        },
      },
      required: ['verdict', 'notes', 'field_verdicts'],
    },
  }

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: VERIFY_SYSTEM_PROMPT,
      tools: [verifyTool],
      tool_choice: { type: 'tool', name: 'submit_verification' },
      messages: [
        { role: 'user', content: buildVerifyUserPrompt(extraction, markdown, cardName) },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await persistVerifyError(extractionId, `Sonnet error: ${message}`)
    return { ok: false, error: `Sonnet error: ${message}` }
  }

  await logUsage(response, 'card_verification', { card_id: cardId })

  const toolUseBlock = response.content.find(
    (c): c is Extract<typeof c, { type: 'tool_use' }> => c.type === 'tool_use',
  )
  if (!toolUseBlock) {
    await persistVerifyError(extractionId, `Sonnet did not call submit_verification (stop_reason=${response.stop_reason})`)
    return { ok: false, error: 'Sonnet did not call submit_verification' }
  }

  const parsed = toolUseBlock.input as {
    verdict?: 'confirmed' | 'corrected' | 'unverifiable'
    notes?: string
    field_verdicts?: CardFieldVerdict[]
  }

  if (!parsed.verdict || !['confirmed', 'corrected', 'unverifiable'].includes(parsed.verdict)) {
    await persistVerifyError(extractionId, `Invalid verdict: ${parsed.verdict}`)
    return { ok: false, error: `Invalid verdict: ${parsed.verdict}` }
  }

  const result = {
    verdict: parsed.verdict,
    notes: parsed.notes ?? '',
    field_verdicts: Array.isArray(parsed.field_verdicts) ? parsed.field_verdicts : [],
  }

  // Persist
  const supabase = createAdminClient()
  const { error: updateErr } = await supabase
    .from('credit_card_extractions')
    .update({
      verifications: {
        ...result,
        generated_at: new Date().toISOString(),
      },
    })
    .eq('id', extractionId)

  if (updateErr) {
    return { ok: false, error: `Persist failed: ${updateErr.message}` }
  }

  return { ok: true, ...result }
}

/**
 * Write an error verdict into verifications so the UI can surface what
 * went wrong instead of silently showing nothing.
 */
async function persistVerifyError(extractionId: string, errorMessage: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase
      .from('credit_card_extractions')
      .update({
        verifications: {
          verdict: 'error',
          notes: errorMessage,
          field_verdicts: [],
          error: errorMessage,
          generated_at: new Date().toISOString(),
        },
      })
      .eq('id', extractionId)
  } catch (e) {
    console.error('[verifyCardExtraction] persistVerifyError failed:', e)
  }
}
