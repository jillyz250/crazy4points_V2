-- Three small fixes to the World of Hyatt Business card (post-launch):
--   1. Fix the broken Chase apply URL (412 returned a 404)
--   2. Surface the limited-time SUB more prominently (set window_end +
--      rewrite notes to lead with the deadline)
--   3. Strip markdown asterisks from the intro - they were rendering as
--      literal `**` instead of bold (the page renders intro as plain text,
--      not markdown)

-- ── 1. Fix the apply URL ─────────────────────────────────────────────────
-- Verified working URL 2026-04-29 (jill confirmed from Chase site).
-- The iCELL=61GD parameter is Chase's offer/cell tracking code; preserving
-- it because that is the URL that actually serves the application form.
-- Future re-verification cadence: check this URL at the same time we
-- re-verify the welcome bonus (Chase rotates cells when offers change).

update credit_cards
set official_url = 'https://creditcards.chase.com/business-credit-cards/world-of-hyatt/hyatt-business-card?iCELL=61GD'
where slug = 'chase-world-of-hyatt-business';

-- ── 2. Mark the 80K SUB as a limited-time offer ──────────────────────────
-- TPG reported "offer ends April 30, 2026" - capturing that as window_end
-- so the schema represents reality. notes rewritten to lead with the
-- deadline so the card detail page surfaces it prominently.

update credit_card_welcome_bonuses
set
  window_end    = '2026-04-30'::date,
  notes         = 'LIMITED-TIME OFFER ending April 30, 2026 per TPG. Standard offer historically ranges 60-75K; this 80K is elevated. Confirm the current offer at Chase''s apply page if applying after the deadline.',
  last_verified = current_date
where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt-business')
  and is_current = true;

-- ── 3. Strip markdown bold from the intro ────────────────────────────────
-- The card detail page renders intro as plain text via <p>{intro}</p>, so
-- the **asterisks** were showing literally. Rewriting the warning sentence
-- to be plainly worded but still emphatic.

update credit_cards
set intro = 'The business sibling of the personal World of Hyatt card. $199 a year buys business owners and 1099 earners a faster path to Hyatt elite status (5 tier-qualifying nights per $10K spend, uncapped) plus up to $100 a year in Hyatt credits ($50 twice per anniversary year, when you spend $50+ at Hyatt). The earn structure is unusual: 4x at Hyatt, 2x on whichever 3 of 8 eligible business categories you spend most on each quarter (Chase auto-picks your top 3), 2x fitness, 1x everything else. Heads up: this card does NOT include the anniversary Cat 1-4 free night that the personal card gives, and there is no $15K-spend bonus night either. What it does have instead: the 10% points-back rebate after $50K spend (real perk for high spenders), and auto rental coverage that is PRIMARY for business rentals (vs secondary on the personal card). Subject to Chase 5/24.'
where slug = 'chase-world-of-hyatt-business';
