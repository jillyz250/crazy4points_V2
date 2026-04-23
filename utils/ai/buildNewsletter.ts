/**
 * Server-side only. Calls Claude Sonnet to write the weekly newsletter draft.
 * Never import from client components.
 *
 * Produces 6 structured sections (opener, big_one, haul[], sweet_spot,
 * jills_take) plus 3 rotating subject line options. The admin UI lets Jill
 * pick/edit before sending.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'

export interface NewsletterAlertInput {
  id: string
  slug: string | null
  title: string
  summary: string | null
  ai_summary: string | null
  published_at: string | null
  impact_score: number | null
}

export interface NewsletterIdeaInput {
  id: string
  title: string
  pitch: string | null
  type: 'newsletter' | 'blog'
  priority: string | null
  slug: string | null
}

export interface BuildNewsletterInput {
  week_of: string
  alerts: NewsletterAlertInput[]
  newsletter_ideas: NewsletterIdeaInput[]
  blog_ideas: NewsletterIdeaInput[]
}

export interface NewsletterHaulItem {
  alert_id: string
  headline: string
  blurb: string
  link_slug: string | null
}

export interface NewsletterBigOne {
  alert_id: string
  headline: string
  why_it_matters: string
  what_to_do: string
  link_slug: string | null
}

export interface NewsletterSweetSpot {
  topic: string
  mechanic_explainer: string
  best_uses: { name: string; why: string }[]
}

export interface NewsletterDraft {
  opener: string
  big_one: NewsletterBigOne | null
  haul: NewsletterHaulItem[]
  sweet_spot: NewsletterSweetSpot | null
  jills_take: string
  subject_options: string[]
}

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. You are writing THIS WEEK's newsletter draft to send to real subscribers (not the internal daily brief).

${BRAND_VOICE}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════

You MUST return a single JSON object matching this schema, and nothing else. No prose before/after, no markdown fences.

{
  "opener": "<2-3 sassy sentences setting this week's vibe. Direct, warm, on-voice. No 'Friend,' no 'Hiya'.>",
  "big_one": {
    "alert_id": "<uuid of the single most important alert from the input>",
    "headline": "<short punchy headline, under 70 chars>",
    "why_it_matters": "<2-3 short sentences — reader payoff first>",
    "what_to_do": "<1-2 sentences — concrete action with real date/number if available>",
    "link_slug": "<slug if provided for that alert, else null>"
  },
  "haul": [
    {
      "alert_id": "<uuid>",
      "headline": "<short punchy headline>",
      "blurb": "<40-60 words. Sassy, scannable, ends on a hook>",
      "link_slug": "<slug if provided, else null>"
    }
  ],
  "sweet_spot": {
    "topic": "<what the play is, short phrase>",
    "mechanic_explainer": "<3-5 sentences explaining the promo/mechanic so a reader gets WHY it's good>",
    "best_uses": [
      { "name": "<specific property/route/award>", "why": "<1 sentence — why this is a great use>" }
    ]
  },
  "jills_take": "<1-2 short sentences — Penny's opinion/tip. A little wink welcome.>",
  "subject_options": [
    "<subject option 1 — hook only, under 60 chars, no 'Crazy Thursday' prefix>",
    "<subject option 2>",
    "<subject option 3>"
  ]
}

═══════════════════════════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════════════════════════

- INPUT contains: alerts (published last 7 days), newsletter_ideas (content_ideas type=newsletter last 7 days), blog_ideas (content_ideas type=blog last 7 days).
- big_one: pick the single most-important alert of the week. Highest impact_score ties broken by recency. MUST be an alert from the input. Reuse its exact id.
- haul: 2 or 3 alerts (not the big_one). Pick the most actionable ones with clear deadlines or real numbers. Skip anything that duplicates the big_one's angle.
- sweet_spot: the STAR of the newsletter. Pick the best blog_idea or the best newsletter_idea with real legs — a specific mechanic or promo that deserves a deeper take. Explain the mechanic plainly, then list 3-4 specific best uses (real properties, routes, or awards). If no input material supports this, use your general knowledge of points/miles to write a strong sweet-spot play tied loosely to the week's theme — but keep it concrete.
- jills_take: one opinion, tip, or contrarian wink. Never filler.
- subject_options: 3 VARIED hooks. One punchy, one playful, one direct. None start with "Crazy Thursday" or "Hey".

═══════════════════════════════════════════════════════════
VOICE
═══════════════════════════════════════════════════════════

- Address the reader directly ("you" — these are subscribers, not the author).
- Short sentences. Contractions. Real numbers.
- No emojis anywhere in the JSON string values.
- No markdown (no **bold**, no _italics_, no links). Plain text only inside the JSON.
- Never invent a deadline, price, or transfer ratio. If the input doesn't contain it, don't state it as fact.

═══════════════════════════════════════════════════════════
EMPTY-WEEK BEHAVIOR
═══════════════════════════════════════════════════════════

If alerts is empty or has fewer than 2 items, still produce a newsletter:
- Lean the opener into honest "quiet week" energy.
- big_one can be null if nothing qualifies.
- haul can be 1 item or empty.
- sweet_spot is still required — draw on general points/miles knowledge.
- jills_take still required.`

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

function validateDraft(raw: unknown): NewsletterDraft {
  const d = raw as NewsletterDraft
  if (!d || typeof d !== 'object') throw new Error('Draft is not an object')
  if (typeof d.opener !== 'string' || !d.opener.trim()) {
    throw new Error('Missing opener')
  }
  if (typeof d.jills_take !== 'string') d.jills_take = ''
  if (!Array.isArray(d.haul)) d.haul = []
  d.haul = d.haul.slice(0, 3)
  if (!Array.isArray(d.subject_options) || d.subject_options.length < 1) {
    throw new Error('Missing subject_options')
  }
  d.subject_options = d.subject_options
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 3)
  if (d.big_one && typeof d.big_one !== 'object') d.big_one = null
  if (d.sweet_spot && typeof d.sweet_spot !== 'object') d.sweet_spot = null
  return d
}

export async function buildNewsletter(
  input: BuildNewsletterInput,
): Promise<NewsletterDraft | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[buildNewsletter] ANTHROPIC_API_KEY missing — returning null')
    return null
  }

  const userContent = JSON.stringify(
    {
      week_of: input.week_of,
      alerts: input.alerts.slice(0, 10),
      newsletter_ideas: input.newsletter_ideas.slice(0, 8),
      blog_ideas: input.blog_ideas.slice(0, 3),
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

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[buildNewsletter] Non-text block returned')
      return null
    }

    const parsed = JSON.parse(extractJson(block.text))
    return validateDraft(parsed)
  } catch (err) {
    console.error('[buildNewsletter] Sonnet call or validation failed:', err)
    return null
  }
}
