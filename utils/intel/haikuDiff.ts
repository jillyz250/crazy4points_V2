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

You receive (a) an existing PUBLISHED ALERT and (b) NEW INTEL. They were matched ONLY because they share the same loyalty program and the same alert type. That does NOT mean they are the same story: two different signup-bonus promos for two different cards, or two different limited-time offers from the same hotel, share program+type but are DISTINCT stories.

Decide the RELATION of the new intel to the existing alert. Choose exactly one:

- "same_story_dup": the SAME offer/story, nothing new. e.g. a second source reporting the same promo, the same offer reworded, a "last chance"/reminder with no new detail. (We suppress these.)
- "same_story_new_facts": the SAME offer/story, but the intel adds a fact the alert lacks. e.g. deadline extended or shortened, bonus rate changed, destination/partner added or removed, promo walked back or clarified, new cap or restriction. (We attach these to the alert as an update.)
- "different_story": a DIFFERENT offer that only happens to share the program and alert type — different card, different promo, different sale, different partner. (We treat these as their own new alert.)

Return STRICT JSON. No prose, no markdown, no fences. All fields:

{
  "relation": "same_story_dup" | "same_story_new_facts" | "different_story",
  "summary": "one short sentence: what's new (new_facts), why it's a dup (dup), or why it's a different story",
  "confidence": "high" | "medium" | "low",
  "categories": ["deadline_change" | "rate_change" | "destination_change" | "walkback" | "cap_change" | "other"] | []
}

Compare the actual OFFER, not just the program. If the new intel is clearly a different card/promo/sale than the alert describes, choose "different_story" even though program and type match. When genuinely torn between dup and new_facts on the SAME story, prefer "same_story_new_facts" so a human reviews it.`

export type IntelRelation = 'same_story_dup' | 'same_story_new_facts' | 'different_story'

export interface HaikuDiffResult {
  /**
   * Relation of the new intel to the matched alert. Layer 2 only matches on
   * program + alert_type, so "different_story" is a real outcome: a distinct
   * offer that merely shares those two fields (e.g. Hyatt 75k card vs Sapphire
   * 100k, both chase + signup_bonus). Callers route on this.
   */
  relation: IntelRelation
  /** Back-compat convenience: true only for same_story_new_facts. */
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

    const relation = coerceRelation(parsed)
    if (!relation || typeof (parsed as Record<string, unknown>).summary !== 'string') {
      return failOpen('malformed shape: ' + raw.slice(0, 120))
    }
    const p = parsed as Record<string, unknown>
    const confidence =
      p.confidence === 'high' || p.confidence === 'medium' || p.confidence === 'low'
        ? p.confidence
        : 'medium'

    return {
      relation,
      has_new_facts: relation === 'same_story_new_facts',
      summary: p.summary as string,
      confidence,
      categories: Array.isArray(p.categories) ? (p.categories as string[]) : [],
      fail_open: false,
    }
  } catch (err) {
    return failOpen(err instanceof Error ? err.message : String(err))
  }
}

function failOpen(reason: string): HaikuDiffResult {
  // Surface for human review on failure (never silently suppress a real update).
  return {
    relation: 'same_story_new_facts',
    has_new_facts: true,
    summary: `dedup check failed (${reason.slice(0, 80)}) — please review manually`,
    confidence: 'low',
    categories: [],
    fail_open: true,
  }
}

/**
 * Accept the new `relation` field; fall back to the legacy `has_new_facts`
 * boolean if Haiku returns the old shape. Returns null if neither is present.
 */
function coerceRelation(x: unknown): IntelRelation | null {
  if (typeof x !== 'object' || x === null) return null
  const r = x as Record<string, unknown>
  if (r.relation === 'same_story_dup' || r.relation === 'same_story_new_facts' || r.relation === 'different_story') {
    return r.relation
  }
  if (typeof r.has_new_facts === 'boolean') {
    return r.has_new_facts ? 'same_story_new_facts' : 'same_story_dup'
  }
  return null
}
