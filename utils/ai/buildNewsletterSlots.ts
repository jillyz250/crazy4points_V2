/**
 * Newsletter V2 generator — Claude Sonnet writes the slot-shape draft.
 *
 * Produces NewsletterSlots: hero_kicker, big_story_html, also_happening[],
 * jills_take_html, subject_options. Game slot is filled separately in the
 * caller (read from a games-of-week source). Sonnet does NOT pick the game.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'
import type {
  NewsletterAlertInput,
  NewsletterIdeaInput,
  NewsletterRadarSignalInput,
} from './buildNewsletter'
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot } from './newsletterSlots'

export interface BuildSlotsInput {
  week_of: string
  alerts: NewsletterAlertInput[]
  newsletter_ideas: NewsletterIdeaInput[]
  blog_ideas: NewsletterIdeaInput[]
  radar_signals?: NewsletterRadarSignalInput[]
  /** Admin scratchpad — informs Jill's Take direction. Empty = generator picks topic. */
  jill_prompt?: string | null
  /**
   * Big Story lock (Phase NL1a). When set, Sonnet must use this alert/intel
   * as the Big Story and not pick its own. Editor sets this when Jill picks
   * the lead manually via the Big Story picker.
   */
  locked_big_story?: {
    ref_id: string
    ref_type: 'alert' | 'intel'
  } | null
  /**
   * Sweet Spot lock (Phase NL2a). When set, Sonnet must anchor the Sweet
   * Spot prose to this alert and not pick its own. Editor sets this via
   * the Sweet Spot picker.
   */
  locked_sweet_spot?: {
    ref_id: string
    ref_type: 'alert'
  } | null
}

interface SonnetSlotOutput {
  hero_kicker?: string | null
  big_story_ref_id?: string | null
  big_story_ref_type?: 'alert' | 'intel' | null
  big_story_html?: string | null
  sweet_spot?: NewsletterSweetSpot | null
  also_happening?: AlsoHappeningItem[]
  jills_take_html?: string | null
  subject_options?: string[]
}

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. You're writing THIS WEEK's newsletter for real subscribers.

${BRAND_VOICE}

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no fences)
═══════════════════════════════════════════════════════════

{
  "hero_kicker": "<optional eyebrow line above 'Week of …', under 30 chars, OR null. Default null.>",
  "big_story_ref_id": "<uuid of the alert (or intel) you chose, OR null if quiet week>",
  "big_story_ref_type": "alert" | "intel" | null,
  "big_story_html": "<HTML for The Big Story body. ~150 words. Plain <p> paragraphs and one <ul> bulleted list of 'What this means for you'. NO links, NO headings (h2 is added by the renderer). NO emojis. End with the punchiest sentence first.>",
  "sweet_spot": {
    "topic": "<short phrase, e.g. 'Capital One -> Qantas 20% transfer bonus' or 'Hyatt off-peak award nights'>",
    "mechanic_explainer": "<3-5 plain sentences explaining HOW the play works. Real numbers, real ratios, real dates. The reader should finish this paragraph understanding why the play is good.>",
    "best_uses": [
      { "name": "<specific property/route/award with numbers>", "why": "<1 sentence — why this is a great use of the play>" }
    ]
  },
  "also_happening": [
    {
      "category": "<short free-text label, e.g. 'Status Match', 'Bonus Transfer', 'Devaluation'>",
      "headline": "<sentence-case, ends with concrete number or date. Under 90 chars.>",
      "blurb": "<1–2 sentences. Sassy but factual. Repeat the deadline.>",
      "link_url": "/alerts/<slug-from-input>",
      "alert_id": "<uuid from input alerts list>"
    }
  ],
  "jills_take_html": "<1–2 sentences. <p> tags. Italic styling is added by the renderer — don't use <em>. The single insight, opinion, or wink.>",
  "subject_options": [
    "<hook 1 — curiosity question, ≤50 chars>",
    "<hook 2 — playful juxtaposition, ≤50 chars>",
    "<hook 3 — specific number or deadline, ≤50 chars>",
    "<hook 4 — rhetorical jab or sly take, ≤50 chars>",
    "<hook 5 — all-lowercase casual text feel, ≤50 chars>"
  ]
}

═══════════════════════════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════════════════════════

INPUT contains:
- alerts (status='published' last 7 days, ranked by impact_score desc, recency tiebreak)
- newsletter_ideas, blog_ideas (last 7 days)
- radar_signals (low/medium-confidence intel)
- jill_prompt (optional admin scratchpad steering Jill's Take topic)

big_story:
- If input includes \`locked_big_story\` (the editor has picked the lead manually), you MUST use that as the Big Story — set big_story_ref_id and big_story_ref_type to match exactly. Do NOT pick a different story.
- Otherwise, pick the SINGLE most-important alert OR a major industry-news item from radar_signals if it eclipses any alert (e.g. an airline shutdown).
- big_story_ref_id MUST be the alert's uuid (or intel uuid if from radar_signals).
- big_story_html: ~150 words, structured as:
    <p>Lead paragraph — what happened, in plain language, reader-payoff first.</p>
    <p><strong>What this means for you:</strong></p>
    <ul>
      <li><strong>Bullet 1.</strong> Concrete consequence.</li>
      <li><strong>Bullet 2.</strong> Concrete consequence.</li>
      <li><strong>Bullet 3.</strong> Concrete consequence.</li>
    </ul>
- DO NOT include links inside big_story_html. The reader stays in the email.

sweet_spot (THE STAR — value-add deep dive):
- If input includes \`locked_sweet_spot\` (the editor has picked the Sweet Spot anchor manually), you MUST anchor the Sweet Spot prose to that alert. The topic, mechanic_explainer, and best_uses should all be derived from / connected to that single locked alert. Do NOT pick a different play.
- Otherwise, pick ONE play with real depth. Best candidates: an active transfer bonus, a sweet-spot redemption mechanic, a peak/off-peak quirk, a quietly-good award chart line. Choose from input alerts (transfer_bonus / earn_rate_change / category_change types are likely), input ideas, or your general points/miles knowledge tied to a real input alert.
- The topic must connect to something concrete from the input — don't pick a play that has no reference in the data.
- mechanic_explainer: 3-5 sentences. Explain it like a friend who already knows the basics. Lead with the number that matters.
- best_uses: 3-4 items. Each name MUST be specific (a property, a route, a chart cell). Each why MUST cite a real number (points cost, value ratio, cabin class). Don't list "cool destinations" — list the math that wins.
- If no input alert / idea supports a real Sweet Spot for the week, set sweet_spot to null. Better empty than fabricated.

also_happening (3 items, no exceptions):
- Pick 3 alerts (NOT the big_story) from input alerts. Highest-actionability first.
- Use the alert's slug to build link_url: "/alerts/<slug>". If no slug, use empty string "".
- alert_id MUST be the alert's uuid.
- Each blurb must paraphrase the alert's why_this_matters in your voice. Don't restate the headline verbatim.

jills_take_html:
- If jill_prompt is non-empty, write Jill's Take steering toward that topic.
- Otherwise pick the through-line of the week's news (e.g. "ULCC shakeup creates status-match window").
- Lead with the insight; never recap the news.
- Plain text inside <p> tags. The renderer styles italic — don't use <em>.

subject_options (EXACTLY 5):
- ALL punchy or playful or curiosity-bait — NEVER "direct/service" energy
  (no "Here's what's new in points this week", no "Your weekly digest").
- Vary the angle across the five: one curiosity question, one playful
  juxtaposition, one specific number/deadline, one rhetorical jab,
  one ALL-lowercase casual-text feel.
- HARD CAP 50 chars each — Gmail mobile truncates beyond that. Count
  the characters yourself before returning. If any option is over 50
  chars, rewrite it shorter — DO NOT return it long.

═══════════════════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════════════════

- NEVER invent a deadline, price, transfer ratio, or program detail not present in the input.
- NEVER claim a story is "first/only/best/biggest" — comparative absolutes are off-limits.
- NEVER use the word "savvy", "insider", "hack", "game-changer", "must-know".
- NEVER assert recurring cadence ("daily", "every Tuesday") unless the input explicitly says so.
- If the input doesn't have 3 viable alerts for also_happening, return as many as exist. Better to ship a short newsletter than fabricate.
- If alerts is completely empty, set big_story_ref_id=null, big_story_html=null, and lean into honest quiet-week energy in jills_take_html.

═══════════════════════════════════════════════════════════
TRAPS THAT JUST BURNED US (2026-05-07) — DO NOT REPEAT
═══════════════════════════════════════════════════════════

1. ONE CARD = ONE ALERT ROW. Each also_happening item maps to a single alert from the input list, by uuid. NEVER promote a sub-claim from one alert's why_this_matters into its own card. Example of what NOT to do: an alert about "Chase UR → Flying Blue 20%" mentions Marriott bonuses inside its body — do NOT create a separate "Chase UR → Marriott" card.

2. LINK URLS USE REAL SLUGS ONLY. link_url MUST be "/alerts/<exact slug from the input alert>" — copy the slug field as-is. Never construct URLs from hand-picked English words like "/alerts/spirit-shutdown" — real slugs are opaque IDs like "intel-92a0ea34-1777716062110".

3. NO INVENTED METADATA. Don't add issue numbers, volume numbers, "Vol N", "Issue N", or any cadence claim ("Daily", "Weekly", "New every Tuesday") to hero_kicker or anywhere else unless the input data explicitly supplies it. When in doubt, leave hero_kicker null.

4. NO COPY THAT READS AS A GIVEAWAY. Avoid phrases that could be misread as "we're giving you a real flight/seat/upgrade" — "you get the seat you earn", "win this trip", "claim your reward". Game copy should describe a puzzle/score outcome, not an experience the reader receives.

5. PARAPHRASE IN VOICE — DON'T QUOTE. Card blurbs paraphrase the alert's why_this_matters in Jill voice. Don't paste why_this_matters verbatim. Don't extend it with claims that aren't in the source alert.`

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

function validateSweetSpot(s: unknown): NewsletterSweetSpot | null {
  if (!s || typeof s !== 'object') return null
  const ss = s as Partial<NewsletterSweetSpot>
  if (!ss.topic || typeof ss.topic !== 'string') return null
  const best = Array.isArray(ss.best_uses) ? ss.best_uses : []
  return {
    topic: ss.topic.slice(0, 200),
    mechanic_explainer: typeof ss.mechanic_explainer === 'string' ? ss.mechanic_explainer.slice(0, 1200) : '',
    best_uses: best
      .filter((u): u is { name: string; why: string } => !!u && typeof u === 'object' && typeof (u as { name?: unknown }).name === 'string')
      .map((u) => ({ name: String(u.name).slice(0, 200), why: String(u.why ?? '').slice(0, 400) }))
      .slice(0, 6),
  }
}

function validateSlots(raw: unknown): Omit<NewsletterSlots, 'subject' | 'game' | 'jill_prompt' | 'display_date' | 'big_story_ref_id' | 'big_story_ref_type'> & {
  big_story_ref_id: string | null
  big_story_ref_type: 'alert' | 'intel' | null
} {
  const r = (raw ?? {}) as SonnetSlotOutput
  if (!Array.isArray(r.subject_options) || r.subject_options.length === 0) {
    throw new Error('Missing subject_options')
  }
  // Server-side enforcement: 5 options, hard 50-char cap. Sonnet ignores
  // the prompt rule sometimes; drop any over-length options rather than
  // truncating mid-word (a chopped headline reads worse than 4 good ones).
  const SUBJECT_MAX_CHARS = 50
  const SUBJECT_TARGET_COUNT = 5
  const subject_options = r.subject_options
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .filter((s) => s.length <= SUBJECT_MAX_CHARS)
    .slice(0, SUBJECT_TARGET_COUNT)
  if (subject_options.length === 0) throw new Error('Empty subject_options (all exceeded 50-char cap)')

  const also = Array.isArray(r.also_happening) ? r.also_happening : []
  const also_happening: AlsoHappeningItem[] = also
    .filter((it): it is AlsoHappeningItem => !!it && typeof it === 'object')
    .map((it) => ({
      category: String(it.category ?? '').slice(0, 60),
      headline: String(it.headline ?? '').slice(0, 200),
      blurb: String(it.blurb ?? '').slice(0, 600),
      link_url: String(it.link_url ?? ''),
      alert_id: it.alert_id ?? null,
    }))
    .slice(0, 5)

  return {
    hero_kicker: r.hero_kicker ? String(r.hero_kicker).slice(0, 80) : null,
    big_story_ref_id: r.big_story_ref_id ?? null,
    big_story_ref_type: r.big_story_ref_type ?? null,
    big_story_title: null,
    big_story_html: r.big_story_html ?? null,
    sweet_spot: validateSweetSpot(r.sweet_spot),
    // Data-pulled sections (like active_offers / elevated_bonuses) — Sonnet
    // doesn't produce these; the editor pulls them from live data.
    top_experiences: null,
    top_sweepstakes: null,
    also_happening,
    active_offers: null,
    elevated_bonuses: null,
    jills_take_html: r.jills_take_html ?? null,
    subject_options,
  }
}

export async function buildNewsletterSlots(
  input: BuildSlotsInput,
): Promise<Omit<NewsletterSlots, 'subject' | 'game' | 'jill_prompt' | 'display_date'> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[buildNewsletterSlots] ANTHROPIC_API_KEY missing')
    return null
  }

  const userContent = JSON.stringify(
    {
      week_of: input.week_of,
      jill_prompt: input.jill_prompt ?? null,
      locked_big_story: input.locked_big_story ?? null,
      locked_sweet_spot: input.locked_sweet_spot ?? null,
      alerts: input.alerts.slice(0, 10),
      newsletter_ideas: input.newsletter_ideas.slice(0, 8),
      blog_ideas: input.blog_ideas.slice(0, 3),
      radar_signals: (input.radar_signals ?? []).slice(0, 5),
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'buildNewsletterSlots')

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[buildNewsletterSlots] Non-text block returned')
      return null
    }
    const parsed = JSON.parse(extractJson(block.text))
    return validateSlots(parsed)
  } catch (err) {
    console.error('[buildNewsletterSlots] Sonnet call or validation failed:', err)
    return null
  }
}
