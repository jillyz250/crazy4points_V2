-- Experience Programs schema — cardholder-exclusive events / dining / access.
--
-- Captures the parallel ecosystem of "you have this card so you get access to
-- this portal" perks: Chase Experiences, Amex Experiences, Citi Entertainment,
-- Capital One Entertainment, United Card Events, Sapphire Reserved, By Invitation
-- Only, Resy Global Dining Access, etc. These didn't fit the credit_card_benefits
-- model because they're:
--   - reusable across many cards (every Chase card gets Chase Experiences)
--   - sometimes derived from issuer / currency_program / network rather than
--     explicitly attached to each card
--   - their own portals with their own URLs
--
-- Three access patterns this schema supports:
--   A. "issuer_wide"  — applies to ALL cards from an issuer (Chase Experiences,
--      Amex Experiences, Citi Entertainment, Capital One Entertainment, BoA).
--      Derived from credit_cards.issuer_id at query time. No junction needed.
--   B. "loyalty"      — applies to any card earning into a currency program
--      (Marriott Bonvoy Moments, Hyatt FIND, IHG Experiences, Hilton Experiences,
--      Alaska Mileage Plan Unlocked). Derived from credit_cards.currency_program_id.
--      No junction needed.
--   C. "card_specific" — only certain cards within an issuer (United Card Events,
--      Sapphire Reserved, Amex By Invitation Only, Resy, Cap One Dining/Lounges).
--      Requires the junction table.
--
-- Network-level programs (Visa Signature Experiences, Mastercard Priceless)
-- will be added in a follow-up when credit_cards.network is populated.

create table if not exists experience_programs (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,
  name                     text not null,
  official_url             text not null,
  description              text,
  category                 text not null check (category in (
                             'issuer_wide','loyalty','card_specific','network'
                           )),

  -- Anchor by access pattern:
  -- - issuer_wide: issuer_slug not null
  -- - loyalty: currency_program_slug not null (matches programs.slug)
  -- - card_specific: junction table is source of truth; these stay null
  -- - network: network not null (added later)
  issuer_slug              text,
  currency_program_slug    text,
  network                  text,

  requires_cardholder_auth boolean not null default true,
  status                   text not null default 'active' check (status in ('active','discontinued','beta')),
  notes                    text,
  last_verified            date,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table experience_programs is
  'Cardholder-exclusive events / dining / access portals. Programs apply to cards via 4 patterns: issuer_wide (derive from issuer), loyalty (derive from currency_program), card_specific (junction table), or network (derive from card.network). See migration header for details.';

create index if not exists experience_programs_issuer_idx
  on experience_programs (issuer_slug)
  where category = 'issuer_wide';

create index if not exists experience_programs_currency_idx
  on experience_programs (currency_program_slug)
  where category = 'loyalty';

create index if not exists experience_programs_category_idx
  on experience_programs (category);

-- ── Junction table for card_specific links ─────────────────────────────────

create table if not exists credit_card_experience_programs (
  card_id     uuid not null references credit_cards(id) on delete cascade,
  program_id  uuid not null references experience_programs(id) on delete cascade,
  access_tier text check (access_tier is null or access_tier in (
                'standard','premium','invite_only'
              )),
  notes       text,
  primary key (card_id, program_id)
);

comment on table credit_card_experience_programs is
  'Junction linking individual credit cards to card-specific experience programs (Pattern C). Only used for programs where access depends on the specific card within an issuer (e.g. United Card Events: only Chase United cobrands get it, not all Chase cards). Issuer-wide and loyalty programs do NOT use this junction.';

create index if not exists credit_card_experience_programs_card_idx
  on credit_card_experience_programs (card_id);
