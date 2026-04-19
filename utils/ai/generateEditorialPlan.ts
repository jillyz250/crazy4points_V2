/**
 * Server-side only. Calls Claude Sonnet 4.6 to produce an editorial plan
 * for the day's intel brief. Never import from client components.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE, FEATURED_SLOT_COUNT, FEATURED_SLOT_EXPIRY_WINDOW_DAYS } from './editorialRules'

export type RejectReason =
  | 'duplicate'
  | 'out_of_scope'
  | 'low_quality'
  | 'rumor'
  | 'brand_excluded'
  | 'missing_data'

export type FeaturedSlot =
  | {
      slot: 1 | 2 | 3 | 4
      action: 'keep'
      current_alert_id: string | null
      reason: string
    }
  | {
      slot: 1 | 2 | 3 | 4
      action: 'replace'
      current_alert_id: string | null
      suggested_alert_id: string
      reason: string
    }

export interface EditorialPlan {
  editorial_note: string
  approve: {
    intel_id: string
    headline: string
    why_publish: string
  }[]
  reject: {
    intel_id: string
    headline: string
    why_reject: string
    reason_category: RejectReason
  }[]
  today_intel_notes: {
    intel_id: string
    why_it_matters: string
  }[]
  featured_slots: FeaturedSlot[]
  blog_ideas: {
    title: string
    pitch: string
  }[]
  newsletter_candidates: {
    intel_id: string
    headline: string
    angle: string
  }[]
}

export interface PlanIntelItem {
  intel_id: string
  headline: string
  source_name: string
  source_url: string | null
  confidence: 'high' | 'medium' | 'low'
  alert_type: string | null
  programs: string[] | null
  raw_text: string | null
}

export interface PlanRecentAlert {
  id: string
  title: string
  type: string
  programs: string[]
  published_at: string | null
  end_date: string | null
}

export interface PlanHomepageSlot {
  slot: 1 | 2 | 3 | 4
  current_alert_id: string | null
  current_title: string | null
  end_date: string | null
}

export interface GenerateEditorialPlanInput {
  today_intel: PlanIntelItem[]
  recent_alerts: PlanRecentAlert[]
  homepage_slots: PlanHomepageSlot[]
}

const SYSTEM_PROMPT = `You are the editorial director for crazy4points, a premium award travel intelligence site.
Your voice is ${BRAND_VOICE}
You are writing for the site's owner, who will scan this in one sitting and clear the editorial queue from email.

═══════════════════════════════════════════════════════════
INPUTS (you will receive three JSON blocks)
═══════════════════════════════════════════════════════════

1. TODAY'S INTEL — raw findings from the last 24h
   Fields per item: { intel_id, headline, source_name, source_url, confidence, alert_type, programs[], raw_text }
   Note: these are already deduplicated across the last 7 days. Do not re-dedupe.

2. RECENT ALERTS — alerts published in the last 30 days (slim projection)
   Fields per item: { id, title, type, programs[], published_at, end_date }
   This is the POOL for featured-slot replacements. Never suggest a replacement that isn't in this list.

3. HOMEPAGE SLOTS — the 4 currently featured deals
   Fields per slot: { slot (1–4), current_alert_id, current_title, end_date }

═══════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════

Produce a single JSON object matching the SCHEMA below. No prose outside the JSON. No markdown fences.

═══════════════════════════════════════════════════════════
DECISION RULES
═══════════════════════════════════════════════════════════

APPROVE / REJECT every intel item. No omissions.

Confidence tiers:
- high      → approve by default, unless a brand-exclude rule fires
- medium    → approve only if there's a clear hook (deadline, new partnership, rare value)
- low       → reject unless genuinely compelling; rumors go here with reason_category='rumor'

Brand excludes (always reject, reason_category='brand_excluded'):
- EVgo or EV charging credits
- Airline M&A speculation
- Generic credit-score or personal-finance content
- Refer-a-friend personal affiliate links

Missing data (reject with reason_category='missing_data'):
- Items with no identifiable loyalty program (programs[] is empty or null)
- Items where raw_text is too thin to write an alert from — no numbers, dates, or concrete offer

Quality bar (reject with reason_category='low_quality'):
- Credit-card marketing dressed as news
- Opinion pieces without concrete value
- Vague "tips" without a specific offer or deadline

Rejection reasons must be short and professional, never snarky. Examples:
- "Duplicate framing of the Hyatt alert from April 10."
- "Generic credit-score content, not actionable for our audience."
- "Opinion piece, no concrete offer or deadline."

═══════════════════════════════════════════════════════════
TODAY'S INTEL NOTES
═══════════════════════════════════════════════════════════

Every intel item — approved or rejected — gets an entry in today_intel_notes.
The why_it_matters field is 1–2 sentences in the expert-friend voice. This is what the reader sees
above the raw headline card in the email. Lead with value to the reader, not a recap of the source.

═══════════════════════════════════════════════════════════
FEATURED SLOTS
═══════════════════════════════════════════════════════════

You MUST return exactly ${FEATURED_SLOT_COUNT} entries, one per slot (1, 2, 3, 4).

For each slot:
- If current alert is expired OR end_date is within ${FEATURED_SLOT_EXPIRY_WINDOW_DAYS} days → lean toward 'replace'
- 'replace' is only valid if you can name a suggested_alert_id FROM THE RECENT ALERTS LIST
- If no strong replacement exists, use 'keep' — never leave a slot empty
- If current_alert_id is null (empty slot), 'replace' with a strong recent alert

═══════════════════════════════════════════════════════════
NEWSLETTER CANDIDATES
═══════════════════════════════════════════════════════════

Pick the 2–5 APPROVED intel items that are strongest for the weekly newsletter.
- Must be in your 'approve' list (don't propose rejected items).
- Favor: deadlined offers still live in 5+ days, genuinely rare value, broad audience.
- Skip: niche regional promos, anything expiring within 48h (too late for weekly cadence).
- angle: 1 sentence in the expert-friend voice — why this is newsletter-worthy, not a recap.

If no approved item qualifies, return [].

═══════════════════════════════════════════════════════════
BLOG IDEAS
═══════════════════════════════════════════════════════════

Produce exactly 2–3 items.

These are EVERGREEN angles inspired by today's intel — not news recaps.
Good angles: "How to maximize the Chase→Hyatt sweet spots in 2026",
            "Why an Alaska MVP status run still pencils out",
            "The 5 under-the-radar Aeroplan partners most people miss".
Avoid: news recaps, "top 10" clickbait, anything tied to a deal that expires.

═══════════════════════════════════════════════════════════
EDITORIAL NOTE (TOP OF BRIEF)
═══════════════════════════════════════════════════════════

One or two punchy sentences summarizing the day's signal. What's the standout? What should the owner
care about before anything else? Written in-voice.
If the day is quiet, say so honestly — don't invent urgency.

═══════════════════════════════════════════════════════════
EMPTY-DAY BEHAVIOR
═══════════════════════════════════════════════════════════

If TODAY'S INTEL is empty:
- approve: []
- reject: []
- today_intel_notes: []
- featured_slots: still return all 4 (mostly 'keep')
- blog_ideas: still produce 2–3
- editorial_note: acknowledge the quiet day honestly

═══════════════════════════════════════════════════════════
SCHEMA (output must validate against this)
═══════════════════════════════════════════════════════════

{
  "editorial_note": "<1–2 sentences, in-voice>",
  "approve": [
    { "intel_id": "<uuid>", "headline": "<cleaned headline>", "why_publish": "<1 sentence>" }
  ],
  "reject": [
    {
      "intel_id": "<uuid>",
      "headline": "<headline>",
      "why_reject": "<1 sentence, professional>",
      "reason_category": "duplicate" | "out_of_scope" | "low_quality" | "rumor" | "brand_excluded" | "missing_data"
    }
  ],
  "today_intel_notes": [
    { "intel_id": "<uuid>", "why_it_matters": "<1–2 sentences, expert voice>" }
  ],
  "featured_slots": [
    // exactly 4 entries, one per slot
    { "slot": 1, "action": "keep", "current_alert_id": "<uuid or null>", "reason": "<1 sentence>" },
    { "slot": 2, "action": "replace", "current_alert_id": "<uuid or null>", "suggested_alert_id": "<uuid from RECENT ALERTS>", "reason": "<1 sentence>" }
  ],
  "blog_ideas": [
    { "title": "<post title>", "pitch": "<2–3 sentences: angle + why it ranks>" }
  ],
  "newsletter_candidates": [
    { "intel_id": "<uuid from approve list>", "headline": "<headline>", "angle": "<1 sentence>" }
  ]
}`

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

function validatePlan(plan: unknown, input: GenerateEditorialPlanInput): EditorialPlan {
  const p = plan as EditorialPlan
  if (!p || typeof p !== 'object') throw new Error('Plan is not an object')
  if (typeof p.editorial_note !== 'string') throw new Error('Missing editorial_note')
  if (!Array.isArray(p.approve)) throw new Error('Missing approve[]')
  if (!Array.isArray(p.reject)) throw new Error('Missing reject[]')
  if (!Array.isArray(p.today_intel_notes)) throw new Error('Missing today_intel_notes[]')
  if (!Array.isArray(p.featured_slots)) throw new Error('Missing featured_slots[]')
  if (!Array.isArray(p.blog_ideas)) throw new Error('Missing blog_ideas[]')
  if (!Array.isArray(p.newsletter_candidates)) p.newsletter_candidates = []

  const approvedIds = new Set(p.approve.map((a) => a.intel_id))
  p.newsletter_candidates = p.newsletter_candidates.filter(
    (c) => c && typeof c.intel_id === 'string' && approvedIds.has(c.intel_id)
  )

  if (p.featured_slots.length !== FEATURED_SLOT_COUNT) {
    throw new Error(`featured_slots must have ${FEATURED_SLOT_COUNT} entries, got ${p.featured_slots.length}`)
  }

  const recentAlertIds = new Set(input.recent_alerts.map((a) => a.id))
  for (const fs of p.featured_slots) {
    if (fs.action === 'replace') {
      if (!fs.suggested_alert_id) throw new Error(`Slot ${fs.slot} replace missing suggested_alert_id`)
      if (!recentAlertIds.has(fs.suggested_alert_id)) {
        throw new Error(`Slot ${fs.slot} suggested_alert_id not in RECENT ALERTS`)
      }
    }
  }

  return p
}

export async function generateEditorialPlan(
  input: GenerateEditorialPlanInput
): Promise<EditorialPlan | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[generateEditorialPlan] ANTHROPIC_API_KEY missing — returning null')
    return null
  }

  const userContent = JSON.stringify(
    {
      today_intel: input.today_intel,
      recent_alerts: input.recent_alerts,
      homepage_slots: input.homepage_slots,
    },
    null,
    2
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
      console.error('[generateEditorialPlan] Non-text block returned')
      return null
    }

    const jsonText = extractJson(block.text)
    const parsed = JSON.parse(jsonText)
    return validatePlan(parsed, input)
  } catch (err) {
    console.error('[generateEditorialPlan] Sonnet call or validation failed:', err)
    return null
  }
}
