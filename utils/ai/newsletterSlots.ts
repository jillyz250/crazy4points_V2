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

/** One offer card in the "Live Offers" section. */
export interface OfferItem {
  headline: string
  /** 1 sentence, plain. */
  blurb: string
  /** Relative path (e.g. "/alerts/slug") or absolute URL. */
  link_url: string
  /** Human-readable deadline, e.g. "Ends July 7". Empty/null = none. */
  deadline?: string | null
  alert_id?: string | null
}

/** "Live Offers" roundup — three buckets, auto-filled from active alerts. */
export interface ActiveOffers {
  transfer_bonuses: OfferItem[]
  earning_promos: OfferItem[]
  purchase_bonuses: OfferItem[]
}

/** One card in the "Elevated Welcome Bonuses" section (auto-filled from data). */
export interface ElevatedBonusItem {
  card_name: string
  /** The normal, non-promo bonus (baseline_bonus_amount). */
  baseline_amount: number
  /** The current elevated bonus TOTAL (the "up to" headline for tiered cards). */
  current_amount: number
  /** True when current_amount is a multi-tier "up to" total (renders an "Up to" prefix). */
  is_tiered: boolean
  /** Currency label, e.g. "Membership Rewards points", "BreezePoints". */
  currency: string
  /** Minimum spend to earn the headline, e.g. 8000. Null = none/unknown. */
  spend_required_usd: number | null
  /** Human spend window, e.g. "6 months". Empty/null = none. */
  spend_window_label: string | null
  /** Relative path to the card page, e.g. "/cards/amex-gold". */
  link_url: string
  /** Human-readable expiry, e.g. "Ends June 30". Null = no known end. */
  deadline: string | null
}

export interface SweetSpotBestUse {
  /** Specific property/route/award/redemption — concrete, with numbers when possible. */
  name: string
  /** 1 sentence — why this is a great use of the bonus/mechanic. */
  why: string
}

export interface NewsletterSweetSpot {
  /** Short phrase — what the play is, e.g. "Capital One -> Qantas 20% transfer bonus". */
  topic: string
  /** 3-5 sentences explaining the mechanic plainly. */
  mechanic_explainer: string
  /** 3-4 specific best uses. */
  best_uses: SweetSpotBestUse[]
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

  /**
   * Editor-set display date (YYYY-MM-DD). When null, the renderer falls
   * back to sent_at (if sent) → today. Use this to set the date the
   * newsletter is going out so subscribers see the right header date.
   */
  display_date: string | null

  // ── Game ─────────────────────────────────────────────────────
  game: NewsletterGameSlot

  // ── Big Story ─────────────────────────────────────────────────
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  /** Article headline, independent of the email subject line. When null the
   *  renderer falls back to the subject so existing drafts keep working. */
  big_story_title: string | null
  /** Pre-rendered HTML for the body (paragraphs + ul). The renderer wraps it in section chrome. */
  big_story_html: string | null

  // ── Sweet Spot ────────────────────────────────────────────────
  /** Deep-dive value-add card. Null hides the section. */
  sweet_spot: NewsletterSweetSpot | null

  // ── Also Happening ────────────────────────────────────────────
  also_happening: AlsoHappeningItem[]

  // ── Live Offers (auto-filled from active alerts) ──────────────
  active_offers: ActiveOffers | null

  // ── Elevated Welcome Bonuses (auto-filled from card data) ─────
  /** Null = not pulled yet; [] = pulled, none qualified. */
  elevated_bonuses: ElevatedBonusItem[] | null

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
  display_date: null,
  game: { slug: null, title: null, clue_text: null },
  big_story_ref_type: null,
  big_story_ref_id: null,
  big_story_title: null,
  big_story_html: null,
  sweet_spot: null,
  also_happening: [],
  active_offers: null,
  elevated_bonuses: null,
  jills_take_html: null,
  jill_prompt: null,
  subject: '',
  subject_options: [],
}
