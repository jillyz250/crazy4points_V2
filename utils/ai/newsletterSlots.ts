/**
 * Newsletter V2 slot types — the redesigned shape that maps directly onto
 * the slot-based admin editor and the new email renderer.
 *
 * See plans/handoff-2026-05-07-newsletter.md for the full design context.
 *
 * V2 lives alongside V1 (NewsletterDraft in buildNewsletter.ts) — old sent
 * newsletters render from V1; new drafts produced after migration 222 use V2.
 */

export interface AlsoHappeningItem {
  /** Free-text label, e.g. "Status Match", "Bonus Transfer", "Devaluation". */
  category: string
  headline: string
  /** 1–2 sentences. Plain text, on-voice. */
  blurb: string
  /** Absolute or relative URL. Empty string = no link rendered. */
  link_url: string
  /** Optional — alert_id when the card maps to a published alert. */
  alert_id?: string | null
}

export interface NewsletterGameSlot {
  /** Game route slug, e.g. "middle-seat". When null, the game card is hidden. */
  slug: string | null
  /** Display title for the card, e.g. "Middle Seat — new this week". */
  title: string | null
  /** Body copy under the title — short and concrete. Empty = no copy. */
  clue_text: string | null
}

export interface NewsletterSlots {
  // ── Hero ─────────────────────────────────────────────────────
  /** Optional eyebrow above "Week of …" line. Empty = none. */
  hero_kicker: string | null

  // ── Game ─────────────────────────────────────────────────────
  game: NewsletterGameSlot

  // ── Big Story ─────────────────────────────────────────────────
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  /** Pre-rendered HTML for the body (paragraphs + ul). The renderer wraps it in section chrome. */
  big_story_html: string | null

  // ── Also Happening ────────────────────────────────────────────
  also_happening: AlsoHappeningItem[]

  // ── Jill's Take ───────────────────────────────────────────────
  jills_take_html: string | null

  // ── Steering ──────────────────────────────────────────────────
  /** Admin scratchpad — informs the generator's Jill's Take output. Persists across regens. */
  jill_prompt: string | null

  // ── Subject ───────────────────────────────────────────────────
  subject: string
  subject_options: string[]
}

/**
 * Empty-row default. Used when a newsletter row exists but has no slots
 * filled yet (e.g. legacy row migrated forward).
 */
export const EMPTY_SLOTS: NewsletterSlots = {
  hero_kicker: null,
  game: { slug: null, title: null, clue_text: null },
  big_story_ref_type: null,
  big_story_ref_id: null,
  big_story_html: null,
  also_happening: [],
  jills_take_html: null,
  jill_prompt: null,
  subject: '',
  subject_options: [],
}
