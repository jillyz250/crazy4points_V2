/**
 * Server-side only. Calls Claude Sonnet to write the weekly newsletter draft.
 * Never import from client components.
 *
 * Phase 4 sections (renamed + restructured for clarity):
 *   the_headline            — the one thing to know this week
 *   quick_wins[]            — 2-3 actionable alerts, blurb from why_this_matters
 *   play_of_the_week        — deep dive on one mechanic / sweet spot
 *   heads_up[]              — what's expiring next 14d + devaluations
 *   on_my_radar[]           — early signals / unconfirmed stuff
 *   jills_take              — Jill's voice
 *   subject_options[]       — 3 hooks
 *
 * Old field names (opener / big_one / haul / sweet_spot) are still read
 * by validateDraft so existing drafts in the DB keep working.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'

export interface NewsletterAlertInput {
  id: string
  slug: string | null
  title: string
  summary: string | null
  ai_summary: string | null
  /** Auto-filled by build-brief from Sonnet's why_publish. Used as Quick Wins blurb seed. */
  why_this_matters: string | null
  published_at: string | null
  end_date: string | null
  alert_type: string | null
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

export interface NewsletterRadarSignalInput {
  headline: string
  source_name: string | null
  source_url: string | null
  raw_text: string | null
  confidence: 'low' | 'medium' | 'high' | null
}

export interface BuildNewsletterInput {
  week_of: string
  alerts: NewsletterAlertInput[]
  newsletter_ideas: NewsletterIdeaInput[]
  blog_ideas: NewsletterIdeaInput[]
  /** Low/medium-confidence intel from the past week — feeds on_my_radar. */
  radar_signals?: NewsletterRadarSignalInput[]
}

export interface NewsletterQuickWinItem {
  alert_id: string
  headline: string
  /** 2-3 sentence blurb. Sourced from the alert's why_this_matters when present. */
  blurb: string
  link_slug: string | null
}

export interface NewsletterHeadlineItem {
  alert_id: string
  headline: string
  why_it_matters: string
  what_to_do: string
  link_slug: string | null
}

export interface NewsletterPlayOfTheWeek {
  topic: string
  mechanic_explainer: string
  best_uses: { name: string; why: string }[]
}

export interface NewsletterHeadsUpItem {
  /** alert_id when this maps to a published alert; null when sourced from external knowledge. */
  alert_id: string | null
  headline: string
  /** 1 sentence — what's changing or expiring. */
  what: string
  /** When it takes effect / when the deadline lands. */
  when: string
  link_slug: string | null
}

export interface NewsletterRadarItem {
  headline: string
  /** 1-2 sentences — why this might matter soon. */
  why: string
  source_url: string | null
}

export interface NewsletterDraft {
  // ── New (Phase 4) ─────────────────────────────────────
  the_headline: NewsletterHeadlineItem | null
  quick_wins: NewsletterQuickWinItem[]
  play_of_the_week: NewsletterPlayOfTheWeek | null
  heads_up: NewsletterHeadsUpItem[]
  on_my_radar: NewsletterRadarItem[]
  jills_take: string
  subject_options: string[]

  // ── Legacy (backward compat — still readable for old drafts) ──
  opener?: string
  big_one?: NewsletterHeadlineItem | null
  haul?: NewsletterQuickWinItem[]
  sweet_spot?: NewsletterPlayOfTheWeek | null
}

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. You are writing THIS WEEK's newsletter draft for real subscribers.

${BRAND_VOICE}

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no markdown fences)
═══════════════════════════════════════════════════════════

{
  "the_headline": {
    "alert_id": "<uuid of THE most important alert this week>",
    "headline": "<short, punchy, under 70 chars>",
    "why_it_matters": "<2-3 short sentences — reader payoff first>",
    "what_to_do": "<1-2 sentences — concrete action, real date/number>",
    "link_slug": "<slug of that alert, else null>"
  },
  "quick_wins": [
    {
      "alert_id": "<uuid>",
      "headline": "<short punchy headline>",
      "blurb": "<2-3 sentences — paraphrase the alert's why_this_matters when provided>",
      "link_slug": "<slug, else null>"
    }
  ],
  "play_of_the_week": {
    "topic": "<short phrase — what the play is>",
    "mechanic_explainer": "<3-5 sentences explaining the promo / sweet spot mechanic>",
    "best_uses": [
      { "name": "<specific property/route/award>", "why": "<1 sentence>" }
    ]
  },
  "heads_up": [
    {
      "alert_id": "<uuid if from input alerts, else null>",
      "headline": "<short — what's about to change>",
      "what": "<1 sentence>",
      "when": "<deadline or effective date in plain English: 'Ends Apr 30' or 'Effective May 14'>",
      "link_slug": "<slug or null>"
    }
  ],
  "on_my_radar": [
    {
      "headline": "<the unconfirmed signal in 6-10 words>",
      "why": "<1-2 sentences — why it might matter if it lands>",
      "source_url": "<url or null>"
    }
  ],
  "jills_take": "<1-2 short sentences — your opinion / tip / wink>",
  "subject_options": [
    "<hook 1, under 60 chars, no 'Crazy Thursday' prefix>",
    "<hook 2>",
    "<hook 3>"
  ]
}

═══════════════════════════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════════════════════════

INPUT contains:
- alerts (published last 7 days, with why_this_matters + end_date + alert_type)
- newsletter_ideas (content_ideas type=newsletter)
- blog_ideas (content_ideas type=blog)
- radar_signals (low/medium-confidence intel from this week)

the_headline:
- The single most important alert. Highest impact_score, ties broken by recency.
- MUST be from input alerts. Reuse the exact id.

quick_wins (2-3 items):
- Other actionable alerts (not the_headline). Pick the most actionable with clear deadlines or real numbers.
- The blurb should paraphrase the alert's why_this_matters in your voice when present. If why_this_matters is empty, write a fresh 2-3 sentence blurb from the title + summary.
- Skip anything that duplicates the_headline's angle.

play_of_the_week (THE STAR):
- Pick the best blog_idea or newsletter_idea with real legs — a specific mechanic or promo deserving a deeper take.
- Explain the mechanic plainly, then list 3-4 specific best uses.
- If no input material supports this, draw on general points/miles knowledge — but stay concrete.

heads_up (up to 3 items):
- Surface alerts where end_date falls in the next 14 days OR alert_type is one of: devaluation, program_change, policy_change, fee_change, partner_change, category_change, earn_rate_change.
- Each entry: short "what's changing" + "when" date.
- Empty array if nothing qualifies.

on_my_radar (up to 2 items):
- Pull from radar_signals — unconfirmed but interesting. Things that might become real news.
- Stay honest: lead with "Hearing chatter about…" or "Watching…". Never state rumors as fact.
- Empty array if nothing in radar_signals is worth surfacing.

jills_take:
- ONE opinion, tip, or contrarian wink. Never filler. Never a list.

subject_options:
- 3 VARIED hooks. One punchy, one playful, one direct. None start with "Crazy Thursday" or "Hey".

═══════════════════════════════════════════════════════════
VOICE
═══════════════════════════════════════════════════════════

- Address the reader directly ("you").
- Short sentences. Contractions. Real numbers.
- No emojis anywhere in the JSON values.
- No markdown — plain text inside JSON strings.
- Never invent a deadline, price, or transfer ratio. If the input doesn't contain it, don't state it.

═══════════════════════════════════════════════════════════
EMPTY-WEEK BEHAVIOR
═══════════════════════════════════════════════════════════

If alerts is empty or has fewer than 2 items:
- the_headline can be null.
- quick_wins can be empty.
- play_of_the_week is still required — draw on general points/miles knowledge.
- heads_up and on_my_radar can be empty.
- jills_take still required, lean into honest "quiet week" energy.`

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

/**
 * Reads either new (the_headline / quick_wins / play_of_the_week) OR legacy
 * (big_one / haul / sweet_spot) field names. Returns the canonical new shape
 * with legacy values mirrored on the legacy keys for any caller that still
 * reads them.
 */
function validateDraft(raw: unknown): NewsletterDraft {
  const r = (raw ?? {}) as Record<string, unknown>
  if (typeof r !== 'object') throw new Error('Draft is not an object')

  const the_headline =
    (r.the_headline as NewsletterHeadlineItem | undefined) ??
    (r.big_one as NewsletterHeadlineItem | undefined) ??
    null
  const quick_wins_raw =
    (r.quick_wins as NewsletterQuickWinItem[] | undefined) ??
    (r.haul as NewsletterQuickWinItem[] | undefined) ??
    []
  const play_of_the_week =
    (r.play_of_the_week as NewsletterPlayOfTheWeek | undefined) ??
    (r.sweet_spot as NewsletterPlayOfTheWeek | undefined) ??
    null
  const heads_up = (Array.isArray(r.heads_up) ? r.heads_up : []) as NewsletterHeadsUpItem[]
  const on_my_radar = (Array.isArray(r.on_my_radar) ? r.on_my_radar : []) as NewsletterRadarItem[]
  const jills_take = typeof r.jills_take === 'string' ? r.jills_take : ''
  const subject_options = Array.isArray(r.subject_options)
    ? (r.subject_options as unknown[])
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 3)
    : []
  if (subject_options.length === 0) {
    throw new Error('Missing subject_options')
  }
  const quick_wins = Array.isArray(quick_wins_raw) ? quick_wins_raw.slice(0, 3) : []

  return {
    the_headline,
    quick_wins,
    play_of_the_week,
    heads_up: heads_up.slice(0, 3),
    on_my_radar: on_my_radar.slice(0, 2),
    jills_take,
    subject_options,
    // Legacy mirrors so any unconverted reader keeps working.
    big_one: the_headline,
    haul: quick_wins,
    sweet_spot: play_of_the_week,
    opener: typeof r.opener === 'string' ? r.opener : '',
  }
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
