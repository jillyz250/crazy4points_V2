-- Add a "Good to know before applying" callout block to every card.
-- Renders as a structured box on /cards/[slug] between hero and intro.
-- Captures the 3-7 things readers most often miss before they apply -
-- 5/24 rule, free-night exclusions, mechanic gotchas, etc.
--
-- Stored as plain text with newline-separated bullets (each line starts
-- with "- "). Page-level renderer parses lines into <li> elements.
-- Chose plain text over JSONB for editorial simplicity; can structure
-- later if comparison tool needs queryable bullets.

alter table credit_cards
  add column if not exists good_to_know text;

comment on column credit_cards.good_to_know is
  '3-7 newline-separated bullets of "before you apply" callouts. Each line starts with "- ". Rendered as a callout box at the top of the card detail page.';

-- ── Backfill: Chase World of Hyatt Personal ──────────────────────────────

update credit_cards
set good_to_know = '- Subject to Chase''s 5/24 rule (no approval if you''ve opened 5+ personal cards across any issuer in the last 24 months).
- Earns Hyatt points DIRECTLY (no Chase Ultimate Rewards detour) - so the points are stuck in Hyatt''s ecosystem.
- Anniversary free night is Cat 1-4 STANDARD rooms only - not valid at Miraval, Hyatt Zilara/Ziva, or for all-inclusive packages.
- $15K-spend bonus night is per CALENDAR year (Jan 1 - Dec 31), not your cardmember anniversary year.
- The 5 elite-qualifying nights per year + 2 more per $5K spend (uncapped) is what makes this card useful for chasing Hyatt status.
- Auto rental coverage in the US is SECONDARY (your personal auto insurance pays first).'
where slug = 'chase-world-of-hyatt';

-- ── Backfill: Chase World of Hyatt Business ──────────────────────────────

update credit_cards
set good_to_know = '- Subject to Chase''s 5/24 rule (Chase business cards do not show on personal credit, but you still need to be UNDER 5/24 for approval).
- Chase auto-selects your top 3 of 8 eligible business categories each quarter based on your actual spend - no enrollment needed, just spend normally.
- NO anniversary free night certificate (the personal card has one - this card does not).
- NO $15K-spend bonus night either (also a personal-card-only perk).
- The $50 Hyatt credit only fires when you spend $50+ at a Hyatt property - up to 2 times per cardmember anniversary year ($100/year max).
- The 10% redemption rebate after $50K spend is capped at 200,000 points back per year - kicks in fast on big award trips.
- 5 elite-qualifying nights per $10K spend is uncapped - this is the status-manufacturing path.
- Auto rental coverage is PRIMARY for business rentals in the US (different from the personal card).'
where slug = 'chase-world-of-hyatt-business';
