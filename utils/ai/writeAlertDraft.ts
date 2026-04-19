/**
 * Server-side only. Calls Claude Sonnet 4.6 to produce a polished alert draft
 * (title, summary, description, dates, programs, action_type) from a raw
 * intel_item. Output is stored on the pending_review alert so the admin
 * review page is pre-filled in the site's voice.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'
import type { AlertType, AlertActionType } from '@/utils/supabase/queries'

export interface WriteDraftIntel {
  intel_id: string
  headline: string
  raw_text: string | null
  source_name: string
  source_url: string | null
  alert_type: AlertType | null
  programs: string[] | null // slugs from Scout
}

export interface WriteDraftProgram {
  id: string
  slug: string
  name: string
  type: string // credit_card | airline | hotel | ...
}

export interface WriteDraftRecentAlertSample {
  title: string
  summary: string
}

export interface AlertDraft {
  title: string
  summary: string
  description: string | null
  action_type: AlertActionType
  primary_program_slug: string | null
  secondary_program_slugs: string[]
  start_date: string | null // ISO or null
  end_date: string | null   // ISO or null
}

const SYSTEM_PROMPT = `You are the staff writer for crazy4points, a premium award travel intelligence site.
Your voice is ${BRAND_VOICE}

You turn a single raw intel finding into a clean, publish-ready alert draft. A human editor will review
and publish it. Write like the final product — no hedging, no "according to sources," no filler.

═══════════════════════════════════════════════════════════
WHAT YOU PRODUCE
═══════════════════════════════════════════════════════════

A single JSON object matching the SCHEMA. No prose outside the JSON. No markdown fences.

═══════════════════════════════════════════════════════════
TITLE
═══════════════════════════════════════════════════════════

- Lead with the program and the offer.
- Include the number (%, points, dollar amount) when known.
- Include the deadline when known ("— ends April 30").
- 60–90 characters ideally; hard cap 110.
- Title-case. No emoji. No clickbait.

Good: "Chase → Hyatt 30% Transfer Bonus — Ends April 30"
Bad:  "HUGE Chase Hyatt Bonus You Need to Know About!"

═══════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════

- 2–3 sentences. This is the meta description AND the card preview.
- Sentence 1: state the offer concretely (programs, amount, deadline).
- Sentence 2: why it matters / who should care / a concrete redemption angle.
- Sentence 3 (optional): the specific action to take.
- Never start with "This alert" or "crazy4points reports." Just write it.

═══════════════════════════════════════════════════════════
DESCRIPTION (optional, longer)
═══════════════════════════════════════════════════════════

- Only fill if the raw_text contains meaningful detail beyond what fits in summary.
- 2–4 short paragraphs max. Otherwise null.

═══════════════════════════════════════════════════════════
ACTION TYPE
═══════════════════════════════════════════════════════════

One of: "book" | "transfer" | "apply" | "monitor" | "learn"
- book: award availability, hotel/flight deals
- transfer: transfer bonuses, point conversions
- apply: credit card signup bonuses, status challenges
- monitor: devaluations, rumors, watchlist items
- learn: sweet spots, analysis, evergreen education

═══════════════════════════════════════════════════════════
PROGRAMS
═══════════════════════════════════════════════════════════

You will receive a PROGRAM LIST with { slug, name, type }.
You MUST pick slugs from this list — never invent slugs.

primary_program_slug:
- The program whose currency/miles are the main subject.
- For transfer bonuses: the DESTINATION program (e.g., Chase→Hyatt bonus → primary = hyatt).
- For award availability: the airline or hotel program (e.g., Hilton Waldorf awards → primary = hilton-honors).
- For credit card signup bonuses on a co-branded card: the CARD ISSUER (e.g., AA/Citi card → primary = citi; airline goes in secondary).
- For generic credit card promos not tied to a travel program: the issuer.

secondary_program_slugs:
- Any other program materially involved.
- For co-branded airline/hotel cards: always include both the issuer AND the airline/hotel (e.g., AA/Citi Aviator → primary=citi, secondary=[aa-aadvantage]).
- For transfer bonuses: include the SOURCE program (e.g., Chase→Hyatt bonus → primary=hyatt, secondary=[chase-ur]).
- For shopping portals and sub-partnerships: include the operating partner.
- Deduplicate. Do not include the primary here.

If truly no program applies, set primary_program_slug to null and leave secondary empty.
If a slug you want isn't in the PROGRAM LIST, omit it rather than guessing.

═══════════════════════════════════════════════════════════
DATES
═══════════════════════════════════════════════════════════

start_date / end_date:
- Extract only if explicitly stated in the raw_text or headline.
- Format: full ISO 8601 (e.g., "2026-04-30T23:59:59.000Z").
- If a date is given without a year, assume the current or upcoming year that makes sense given today.
- null when unknown. Do not guess.

═══════════════════════════════════════════════════════════
SCHEMA
═══════════════════════════════════════════════════════════

{
  "title": "<string>",
  "summary": "<string, 2-3 sentences>",
  "description": "<string or null>",
  "action_type": "book" | "transfer" | "apply" | "monitor" | "learn",
  "primary_program_slug": "<slug from PROGRAM LIST, or null>",
  "secondary_program_slugs": ["<slug>", ...],
  "start_date": "<ISO 8601 or null>",
  "end_date": "<ISO 8601 or null>"
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

function validate(draft: unknown, programs: WriteDraftProgram[]): AlertDraft {
  const d = draft as AlertDraft
  if (!d || typeof d !== 'object') throw new Error('Draft not an object')
  if (typeof d.title !== 'string' || !d.title.trim()) throw new Error('Missing title')
  if (typeof d.summary !== 'string' || !d.summary.trim()) throw new Error('Missing summary')
  if (!['book', 'transfer', 'apply', 'monitor', 'learn'].includes(d.action_type)) {
    throw new Error(`Invalid action_type: ${d.action_type}`)
  }

  const slugSet = new Set(programs.map((p) => p.slug))
  if (d.primary_program_slug && !slugSet.has(d.primary_program_slug)) {
    throw new Error(`primary_program_slug '${d.primary_program_slug}' not in program list`)
  }
  if (!Array.isArray(d.secondary_program_slugs)) d.secondary_program_slugs = []
  d.secondary_program_slugs = d.secondary_program_slugs.filter(
    (s) => typeof s === 'string' && slugSet.has(s) && s !== d.primary_program_slug
  )

  if (d.description === undefined) d.description = null
  if (d.start_date === undefined) d.start_date = null
  if (d.end_date === undefined) d.end_date = null

  return d
}

export async function writeAlertDraft(args: {
  intel: WriteDraftIntel
  programs: WriteDraftProgram[]
  recent_samples?: WriteDraftRecentAlertSample[]
}): Promise<AlertDraft | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[writeAlertDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const programList = args.programs.map((p) => ({ slug: p.slug, name: p.name, type: p.type }))

  const userContent = JSON.stringify(
    {
      intel: args.intel,
      program_list: programList,
      voice_samples: (args.recent_samples ?? []).slice(0, 3),
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return null

    const parsed = JSON.parse(extractJson(block.text))
    return validate(parsed, args.programs)
  } catch (err) {
    console.error('[writeAlertDraft] Sonnet call or validation failed:', err)
    return null
  }
}
