/**
 * Second-pass review of a card extraction.
 *
 * Takes a completed CardExtraction + the original markdown, asks Sonnet
 * to identify anything missed, and merges additions into the extraction.
 *
 * Conservative by design: only adds items, never modifies. Failures
 * fall through silently — pass 1's output is returned unchanged.
 *
 * Cost: ~$0.03-0.06 per extraction. ~$3-6 across the full 108-card seed.
 */

import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { logUsage } from '@/utils/ai/logUsage'
import {
  CARD_REVIEW_SYSTEM_PROMPT,
  buildCardReviewUserPrompt,
} from '@/utils/cards/cardReviewPrompt'
import type { BenefitExtraction, CardExtraction, EarnRateExtraction } from '@/utils/cards/cardExtractionSchema'

const REVIEW_MODEL = 'claude-sonnet-4-6'

type ReviewResponse = {
  additional_benefits?: BenefitExtraction[]
  additional_earn_rates?: EarnRateExtraction[]
  review_notes?: string[]
}

export type ReviewResult = {
  /** Merged extraction (pass 1 + pass 2 additions). */
  extraction: CardExtraction
  /** Counts for audit. */
  addedBenefits: number
  addedEarnRates: number
  reviewNotes: string[]
  /** Whether the review pass actually ran successfully. */
  ran: boolean
  inputTokens: number | null
  outputTokens: number | null
}

export async function reviewExtraction({
  cardName,
  markdown,
  cardId,
  extraction,
}: {
  cardName: string
  markdown: string
  cardId: string
  extraction: CardExtraction
}): Promise<ReviewResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      extraction,
      addedBenefits: 0,
      addedEarnRates: 0,
      reviewNotes: ['Review pass skipped — ANTHROPIC_API_KEY not set'],
      ran: false,
      inputTokens: null,
      outputTokens: null,
    }
  }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: REVIEW_MODEL,
      // Smaller cap than pass 1 — review output is bounded (just additions).
      max_tokens: 8000,
      system: CARD_REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildCardReviewUserPrompt(
            cardName,
            markdown,
            extraction.benefits ?? [],
            extraction.earn_rates ?? [],
          ),
        },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[card-extract] review pass failed (non-fatal): ${message}`)
    return {
      extraction,
      addedBenefits: 0,
      addedEarnRates: 0,
      reviewNotes: [`Review pass errored (non-fatal): ${message}`],
      ran: false,
      inputTokens: null,
      outputTokens: null,
    }
  }

  await logUsage(response, 'card_extraction_review', { card_id: cardId })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return {
      extraction,
      addedBenefits: 0,
      addedEarnRates: 0,
      reviewNotes: ['Review pass returned no text content'],
      ran: false,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    }
  }

  // Parse — same defensive strategy as pass 1.
  let parsed: ReviewResponse
  try {
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    if (!cleaned.startsWith('{')) {
      console.warn('[card-extract] review pass returned non-JSON — skipping')
      return {
        extraction,
        addedBenefits: 0,
        addedEarnRates: 0,
        reviewNotes: [`Review pass returned prose: "${cleaned.slice(0, 120)}..."`],
        ran: false,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
      }
    }
    try {
      parsed = JSON.parse(cleaned) as ReviewResponse
    } catch {
      parsed = JSON.parse(jsonrepair(cleaned)) as ReviewResponse
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[card-extract] review pass JSON parse failed (non-fatal): ${message}`)
    return {
      extraction,
      addedBenefits: 0,
      addedEarnRates: 0,
      reviewNotes: [`Review pass JSON parse failed: ${message}`],
      ran: false,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    }
  }

  // Stamp metadata.from_review_pass=true on every addition (defensive — the
  // prompt asks for this but we enforce it here regardless).
  const additionalBenefits = (parsed.additional_benefits ?? []).map((b) => ({
    ...b,
    metadata: { ...(b.metadata ?? {}), from_review_pass: true },
  }))

  // Merge into the extraction. Pass 1's items keep their original sort_order;
  // additions append at the end.
  const merged: CardExtraction = {
    ...extraction,
    benefits: [...(extraction.benefits ?? []), ...additionalBenefits],
    earn_rates: [...(extraction.earn_rates ?? []), ...(parsed.additional_earn_rates ?? [])],
    extraction_warnings: [
      ...(extraction.extraction_warnings ?? []),
      ...(additionalBenefits.length > 0 || (parsed.additional_earn_rates ?? []).length > 0
        ? [`Review pass added ${additionalBenefits.length} benefits and ${(parsed.additional_earn_rates ?? []).length} earn rates.`]
        : []),
      ...((parsed.review_notes ?? []).map((n) => `Review: ${n}`)),
    ],
  }

  return {
    extraction: merged,
    addedBenefits: additionalBenefits.length,
    addedEarnRates: (parsed.additional_earn_rates ?? []).length,
    reviewNotes: parsed.review_notes ?? [],
    ran: true,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
  }
}
