/**
 * Focused Sonnet call that writes ONLY the Sweet Spot prose for a locked
 * alert.
 *
 * Used by the newsletter editor's "Generate Sweet Spot" button (Phase NL2c)
 * — same pattern as writeBigStoryHtml: Jill picks the anchor alert, then
 * this writes just that one slot's contents without touching the rest of
 * the newsletter (subject, Big Story, also-happening, Jill's Take all
 * survive the call).
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'
import type { NewsletterAlertInput } from './buildNewsletter'
import type { NewsletterSweetSpot, SweetSpotBestUse } from './newsletterSlots'

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. The editor has already picked the alert that anchors this week's Sweet Spot — your only job is to write that one section.

${BRAND_VOICE}

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no fences)
═══════════════════════════════════════════════════════════

{
  "topic": "<short phrase naming the play, e.g. 'Capital One -> Qantas 20% transfer bonus' or 'Hyatt off-peak award nights'>",
  "mechanic_explainer": "<3-5 plain sentences explaining HOW the play works. Real numbers, real ratios, real dates. The reader should finish this paragraph understanding why the play is good.>",
  "best_uses": [
    { "name": "<specific property/route/award with numbers>", "why": "<1 sentence — why this is a great use of the play>" }
  ]
}

═══════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════

- The locked alert IS the anchor. Topic + mechanic + best_uses must all derive from or connect to it. Don't pivot to a different play.
- mechanic_explainer: 3-5 sentences. Explain it like a friend who already knows the basics. Lead with the number that matters.
- best_uses: 3-4 items. Each name MUST be specific (a property, a route, a chart cell). Each why MUST cite a real number (points cost, value ratio, cabin class). Don't list "cool destinations" — list the math that wins.
- **EVERY actionable fact from the source (dates, ratios, on-sale times, eligibility, multi-city listings) must appear in the prose.** Skip legal boilerplate, arbitration clauses, "void where prohibited," generic exclusion lists.
- If verified_terms is provided, treat it as ground truth for numbers + dates.
- NEVER claim a play is "first/only/best/biggest" — comparative absolutes are off-limits.
- NEVER use "savvy", "insider", "hack", "game-changer", "must-know".
- NEVER use "drop/drops/dropping" as a release verb. Use "go on sale," "open," "release."
- NEVER use influencer phrasing: "Love this for you," "obsessed," "iconic," "the girlies."
- NEVER recommend transferring points without a redemption in mind — every transfer mention pairs with a specific redemption play.
- Don't editorialize beyond the data the alert + verified_terms give you.
- **NEVER claim a mechanic about how a points/currency/card/gift-card product works** (how transfers post, where redemption credit applies, whether something "loads into" an account, expiration behavior, stacking rules, etc.) **unless the mechanic is stated verbatim in the source alert or verified_terms.** Vague paraphrase = fabrication risk. If the mechanic isn't in the source, don't claim it — describe what IS verifiable (e.g. "$350 in gift card credit" rather than "$350 loaded into your account").`

interface SonnetOutput {
  topic?: string
  mechanic_explainer?: string
  best_uses?: Array<{ name?: string; why?: string }>
}

function extractJson(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

export async function writeSweetSpotProse(
  alert: NewsletterAlertInput,
  verifiedTerms?: string | null,
): Promise<NewsletterSweetSpot | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[writeSweetSpotProse] ANTHROPIC_API_KEY missing')
    return null
  }

  const userContent = JSON.stringify(
    {
      locked_alert: {
        id: alert.id,
        title: alert.title,
        alert_type: alert.alert_type,
        summary: alert.summary,
        why_this_matters: alert.why_this_matters,
        description: alert.description,
        end_date: alert.end_date,
        published_at: alert.published_at,
      },
      verified_terms: verifiedTerms?.trim() || null,
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'writeSweetSpotProse')

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[writeSweetSpotProse] Non-text block returned')
      return null
    }
    const parsed = JSON.parse(extractJson(block.text)) as SonnetOutput
    if (!parsed.topic || typeof parsed.topic !== 'string') {
      console.error('[writeSweetSpotProse] Missing topic in output')
      return null
    }
    const best_uses: SweetSpotBestUse[] = Array.isArray(parsed.best_uses)
      ? parsed.best_uses
          .filter((u): u is { name: string; why?: string } => !!u && typeof u.name === 'string')
          .map((u) => ({
            name: String(u.name).slice(0, 200),
            why: String(u.why ?? '').slice(0, 400),
          }))
          .slice(0, 6)
      : []
    return {
      topic: parsed.topic.slice(0, 200),
      mechanic_explainer:
        typeof parsed.mechanic_explainer === 'string'
          ? parsed.mechanic_explainer.slice(0, 1200)
          : '',
      best_uses,
    }
  } catch (err) {
    console.error('[writeSweetSpotProse] Sonnet call failed:', err)
    return null
  }
}
