-- Phase 3 — structured T1 schema for credit_cards earning rules.
--
-- Up to now card-level earning info ("4x at Hyatt, 2x dining, 1x else")
-- lives in the free-text intro/good_to_know fields. The fact-checker reads
-- those as source text and grounds claims like "card earns 4x at dining"
-- against the prose — fine when the prose is complete, brittle when it's
-- partial (the Hyatt Business article was the canonical case: source said
-- "3 of 8 eligible categories" without enumerating which 8, so the writer
-- filled the gap with a confident-but-wrong "no dining bonus").
--
-- This migration adds three new nullable columns so cards can declare
-- their earning structure as MACHINE-CHECKABLE data instead of prose:
--
--   eligible_categories text[]        — flat list of category keys the
--                                       card can earn on. e.g. for Hyatt
--                                       Business: ['dining', 'shipping',
--                                       'advertising', 'gas', ...]
--
--   earning_rules jsonb               — array of structured rules
--                                       describing what earns what
--                                       multiplier under what conditions.
--                                       Schema documented in
--                                       utils/ai/cardEarningRules.ts.
--
--   categories_exhaustive boolean     — when TRUE, the eligible_categories
--                                       list is complete. The writer can
--                                       safely say "ONLY these categories"
--                                       (with positive evidence of absence
--                                       for anything not in the list).
--                                       When FALSE/NULL, the list is
--                                       partial — writer must NOT make
--                                       absence claims about omitted
--                                       categories (Phase 1 negative-
--                                       claims rule).
--
-- All three are nullable so cards opt in incrementally. cardSourceText.ts
-- only renders these sections when populated, so old card records keep
-- working unchanged.

alter table credit_cards
  add column if not exists eligible_categories text[],
  add column if not exists earning_rules jsonb,
  add column if not exists categories_exhaustive boolean;

comment on column credit_cards.eligible_categories is
  'Flat list of category keys this card can earn on (e.g. dining, shipping, transit_commuting). Used by the fact-checker to ground negative claims. NULL = no list yet.';

comment on column credit_cards.earning_rules is
  'Structured array of EarningRule objects describing earn multipliers. See utils/ai/cardEarningRules.ts for schema. NULL = no structured data yet.';

comment on column credit_cards.categories_exhaustive is
  'TRUE = eligible_categories is the COMPLETE list (writer can say "only these"). FALSE/NULL = partial list (no absence claims allowed).';


-- ── Seed: Chase World of Hyatt Personal ─────────────────────────────────
--
-- 2x categories per the personal card's published earning structure.
-- "fitness_clubs" includes gym memberships per Chase's category definition.

update credit_cards
set
  eligible_categories = array[
    'dining',
    'airline_tickets_direct',
    'transit_commuting',
    'fitness_clubs'
  ],
  categories_exhaustive = true,
  earning_rules = '[
    { "label": "4x at Hyatt",
      "multiplier": 4,
      "applies_to": "specific_categories",
      "category_keys": ["hyatt_stays"],
      "conditions": "Stays booked directly with Hyatt." },
    { "label": "2x on bonus categories",
      "multiplier": 2,
      "applies_to": "specific_categories",
      "category_keys": ["dining", "airline_tickets_direct", "transit_commuting", "fitness_clubs"],
      "conditions": "Uncapped." },
    { "label": "1x on everything else",
      "multiplier": 1,
      "applies_to": "all_purchases" }
  ]'::jsonb
where slug = 'chase-world-of-hyatt';


-- ── Seed: Chase World of Hyatt Business ─────────────────────────────────
--
-- The 8 eligible categories Chase auto-selects from each quarter. This is
-- THE canonical Phase-3 case — the existing intro/good_to_know mention
-- "3 of 8" but never enumerate the 8. The fact-checker needed this list
-- to ground the dining claim that motivated this whole project.
--
-- Per Chase's published business-card category list (transit/commuting
-- includes rideshare; advertising covers social-media + search engine
-- platforms; airline_tickets_direct = booked directly with the airline).

update credit_cards
set
  eligible_categories = array[
    'dining',
    'airline_tickets_direct',
    'car_rental',
    'transit_commuting',
    'gas',
    'internet_cable_phone',
    'social_media_search_ads',
    'shipping'
  ],
  categories_exhaustive = true,
  earning_rules = '[
    { "label": "4x at Hyatt",
      "multiplier": 4,
      "applies_to": "specific_categories",
      "category_keys": ["hyatt_stays"],
      "conditions": "Stays booked directly with Hyatt." },
    { "label": "2x on top 3 of 8 quarterly business categories",
      "multiplier": 2,
      "applies_to": "top_n_categories_periodic",
      "top_n": 3,
      "period": "quarterly",
      "category_keys": [
        "dining", "airline_tickets_direct", "car_rental",
        "transit_commuting", "gas", "internet_cable_phone",
        "social_media_search_ads", "shipping"
      ],
      "conditions": "Chase auto-selects the top 3 categories you spent most on each quarter. No enrollment required." },
    { "label": "2x at fitness clubs and gym memberships",
      "multiplier": 2,
      "applies_to": "specific_categories",
      "category_keys": ["fitness_clubs"],
      "conditions": "Uncapped." },
    { "label": "1x on everything else",
      "multiplier": 1,
      "applies_to": "all_purchases" }
  ]'::jsonb
where slug = 'chase-world-of-hyatt-business';
