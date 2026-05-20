/**
 * Haiku diff — runs ONLY when Layer 2 (getRecentDecisionFor) would block.
 *
 * Asks Haiku: "Does the new intel introduce a fact the existing alert doesn't
 * have?" Used to distinguish a true dup (silently suppress, increment
 * confirmation_count) from a follow-up that should surface in Triage with an
 * update_to_alert_id link (deadline extended, rate changed, walked back, etc.).
 *
 * Fail-open: any API error / timeout / malformed JSON → surfaces in Triage with
 * a banner. Prefer false alarm over missed real update.
 *
 * Cost: ~$0.0005 per call. Only fires when Layer 2 would have blocked.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

const SYSTEM_PROMPT = `You are a dedup classifier for a points-and-miles alert system.

You receive (a) an existing PUBLISHED ALERT and (b) NEW INTEL that semantically matches it (same program + alert type).

Your job: decide whether the new intel introduces a NEW FACT not present in the existing alert. Examples of new facts:
- Deadline extended or shortened
- Bonus rate changed (e.g. 20% became 25%)
- New destination/partner added or removed
- Promo walked back / canceled / clarified
- New cap or restriction announced

NOT new facts (these are duplicates, suppress silently):
- Same headline reported by a second source
- Same promo summarized in a slightly different way
- Already-known info repackaged
- Promotional reminder ("don't forget" / "last chance" without new details)

Return STRICT JSON. No prose, no markdown, no fences. Always include all four fields.

{
  "has_new_facts": true | false,
  "summary": "one short sentence describing what's new (when has_new_facts=true) OR why this is a dup (when false)",
  "confidence": "high" | "medium" | "low",
  "categories": ["deadline_change" | "rate_change" | "destination_change" | "walkback" | "cap_change" | "other"] | []
}

Bias: when in doubt, return has_new_facts=true. Better to surface a maybe-dup for human review than to silently bury a real update.`

export interface HaikuDiffResult {
  has_new_facts: boolean
  summary: string
  confidence: 'high' | 'medium' | 'low'
  categories: string[]
  /** True when we failed to get a real Haiku response. Caller should fail-open (surface). */
  fail_open: boolean
}

export interface HaikuDiffInput {
  existing_alert: {
    title: string
    summary?: string | null
    description?: string | null
    end_date?: string | null
  }
  new_intel: {
    headline: string
    raw_text?: string | null
    expires_at?: string | null
  }
}

export async function haikuDiff(input: HaikuDiffInput): Promise<HaikuDiffResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return failOpen('ANTHROPIC_API_KEY missing')
  }

  const userMessage = `EXISTING ALERT:
Title: ${input.existing_alert.title}
Summary: ${input.existing_alert.summary ?? '(none)'}
Description: ${(input.existing_alert.description ?? '').slice(0, 1000)}
End date: ${input.existing_alert.end_date ?? '(none)'}

NEW INTEL:
Headline: ${input.new_intel.headline}
Raw text: ${(input.new_intel.raw_text ?? '').slice(0, 1000)}
Expires at: ${input.new_intel.expires_at ?? '(none)'}

Return strict JSON only.`

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    try {
      await logUsage(response, 'haiku_diff', { existing_title: input.existing_alert.title })
    } catch {
      /* non-fatal */
    }

    const content = response.content[0]
    if (content.type !== 'text') return failOpen('non-text response')

    const raw = content.text.trim()
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return failOpen('non-JSON response: ' + raw.slice(0, 120))
    }

    if (!isHaikuDiffShape(parsed)) {
      return failOpen('malformed shape: ' + raw.slice(0, 120))
    }

    return {
      has_new_facts: parsed.has_new_facts,
      summary: parsed.summary,
      confidence: parsed.confidence,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      fail_open: false,
    }
  } catch (err) {
    return failOpen(err instanceof Error ? err.message : String(err))
  }
}

function failOpen(reason: string): HaikuDiffResult {
  return {
    has_new_facts: true,
    summary: `dedup check failed (${reason.slice(0, 80)}) — please review manually`,
    confidence: 'low',
    categories: [],
    fail_open: true,
  }
}

function isHaikuDiffShape(x: unknown): x is {
  has_new_facts: boolean
  summary: string
  confidence: 'high' | 'medium' | 'low'
  categories: string[]
} {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.has_new_facts === 'boolean' &&
    typeof r.summary === 'string' &&
    (r.confidence === 'high' || r.confidence === 'medium' || r.confidence === 'low')
  )
}
