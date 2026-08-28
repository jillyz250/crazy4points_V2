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

/**
 * One card in the "Money Can't Buy: New Experiences" section. Auto-filled from
 * experience_listings (points-redeemable Moments only — card-network concert
 * presales are excluded by the gather query). See getTopExperiences().
 */
export interface TopExperienceItem {
  /** Cleaned listing title, e.g. "Ariana Grande from the Marriott Bonvoy Luxury Suite at The O2". */
  title: string
  /** Source platform label, e.g. "Marriott Bonvoy Moments". */
  program_label: string
  /** 'redeem' = fixed points price; 'bid' = points auction (you can be outbid). */
  format: 'redeem' | 'bid'
  /** Human points label, e.g. "57,500 points" or "Current bid 52,500 points". Null = unpriced. */
  points_label: string | null
  /** Human deadline, e.g. "Closes Aug 3". Null = none known. */
  deadline: string | null
  /** Human event label, e.g. "Aug 20". Null = none/unparseable. */
  event_label: string | null
  /** External booking/detail URL. */
  link_url: string
  /** True for auctions — renders the "bid with points, can be outbid, final sale" caveat. */
  is_auction: boolean
  /** Optional one-sentence editorial hook shown under the meta line. Lets a
   *  hand-picked experience carry compelling framing the compact card can't.
   *  Empty/null = no line. */
  blurb?: string | null
  /** Optional ribbon/tag pill on the card, e.g. "Marriott Bonvoy cardmembers"
   *  — flags an eligibility restriction visually. Empty/null = no tag. */
  tag?: string | null
  /** Optional secondary CTA (e.g. "New to Bonvoy? Get the card") linking to
   *  our own card page, for readers who don't hold the required card. */
  secondary_link?: { label: string; url: string } | null
  /** Optional hero image for the card (listing image or a custom creative).
   *  Renders full-width at the top of the card. Empty/null = no image. */
  image_url?: string | null
}

/**
 * One card in the "Top Sweepstakes to Enter" section. Auto-filled from the
 * `sweepstakes` table: only sweeps Jill has posted to social (posted_social)
 * and that are still running. See getTopSweepstakes().
 */
export interface TopSweepstakesItem {
  /** Program running it, e.g. "Wyndham Rewards" or "Cowboys Perks (AAdvantage)". */
  program: string
  /** Sweepstakes name. */
  title: string
  /** What you can win, e.g. "100,000 AAdvantage miles". Null = omit. */
  prize: string | null
  /** Human deadline, e.g. "Ends Aug 9". Null = none known. */
  deadline: string | null
  /** Where the card links — the sweep's entry page (falls back to our page). */
  link_url: string
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

  // ── Money Can't Buy: New Experiences (auto-filled from data) ───
  /** Null = not pulled yet; [] = pulled, none qualified this week. */
  top_experiences: TopExperienceItem[] | null

  // ── Top Sweepstakes to Enter (auto-filled: posted + still running) ─
  /** Null = not pulled yet; [] = pulled, none qualified. */
  top_sweepstakes: TopSweepstakesItem[] | null

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
  top_experiences: null,
  top_sweepstakes: null,
  also_happening: [],
  active_offers: null,
  elevated_bonuses: null,
  jills_take_html: null,
  jill_prompt: null,
  subject: '',
  subject_options: [],
}
