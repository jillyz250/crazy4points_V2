-- Credit Cards architecture — Phase 1 schema.
--
-- Creates 6 new tables:
--   1. issuers                       — banks (Chase, Amex, Citi, Cap One, Bilt, etc.)
--   2. credit_cards                  — one row per card
--   3. credit_card_earn_rates        — earn category multipliers (one row per category per card)
--   4. credit_card_benefits          — perks/credits/insurance (one row per benefit, with type-specific JSONB metadata)
--   5. credit_card_welcome_bonuses   — SUB history; one is_current=true per card
--   6. program_transfers             — normalized transfer partners (replaces programs.transfer_partners JSONB long-term)
--
-- Plan: plans/credit-cards-architecture.md (Round 3, 2026-04-27)
-- All tables are additive. No existing data is touched.
-- RLS: public read; service-role writes (matches existing programs/alerts pattern).

-- ── 1. issuers ───────────────────────────────────────────────────────────

create table if not exists issuers (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  intro         text,
  website_url   text,
  notes         text,
  last_verified date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function issuers_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists issuers_updated_at on issuers;
create trigger issuers_updated_at before update on issuers
  for each row execute function issuers_set_updated_at();

alter table issuers enable row level security;
drop policy if exists "issuers are publicly readable" on issuers;
create policy "issuers are publicly readable" on issuers for select to anon, authenticated using (true);

comment on table issuers is 'Card-issuing banks. Has its own /issuers/[slug] page; aggregates the issuer''s cards plus links to the currency program if any.';

-- ── 2. credit_cards ──────────────────────────────────────────────────────

create table if not exists credit_cards (
  id                          uuid primary key default gen_random_uuid(),
  slug                        text unique not null,
  issuer_id                   uuid not null references issuers(id) on delete restrict,

  name                        text not null,
  image_url                   text,
  intro                       text,

  official_url                text,
  affiliate_url               text,
  affiliate_network           text check (affiliate_network is null or affiliate_network in ('cj','rakuten','impact','issuer_direct','other')),
  affiliate_id                text,
  deep_link_template          text,

  annual_fee_usd              integer check (annual_fee_usd is null or annual_fee_usd >= 0),
  card_type                   text not null check (card_type in ('personal','business')),
  card_tier                   text check (card_tier is null or card_tier in ('premium','mid','starter','hotel_cobrand','airline_cobrand','business','secured','charge')),

  currency_program_id         uuid references programs(id) on delete set null,
  co_brand_program_id         uuid references programs(id) on delete set null,

  foreign_transaction_fee_pct numeric(4,2) check (foreign_transaction_fee_pct is null or foreign_transaction_fee_pct >= 0),
  chase_5_24_subject          boolean default false,
  credit_score_recommended    text check (credit_score_recommended is null or credit_score_recommended in ('fair','good','excellent')),

  tags                        text[] not null default '{}',
  intended_user               text[] not null default '{}',

  is_active                   boolean not null default true,
  notes                       text,
  last_verified               date,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists credit_cards_issuer_idx           on credit_cards (issuer_id);
create index if not exists credit_cards_currency_program_idx on credit_cards (currency_program_id);
create index if not exists credit_cards_co_brand_idx         on credit_cards (co_brand_program_id) where co_brand_program_id is not null;
create index if not exists credit_cards_tags_gin             on credit_cards using gin (tags);
create index if not exists credit_cards_intended_user_gin    on credit_cards using gin (intended_user);
create index if not exists credit_cards_active_idx           on credit_cards (is_active) where is_active = true;

create or replace function credit_cards_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists credit_cards_updated_at on credit_cards;
create trigger credit_cards_updated_at before update on credit_cards
  for each row execute function credit_cards_set_updated_at();

alter table credit_cards enable row level security;
drop policy if exists "credit_cards are publicly readable" on credit_cards;
create policy "credit_cards are publicly readable" on credit_cards for select to anon, authenticated using (true);

comment on table credit_cards is 'One row per card. Cross-references programs (currency + co-brand) and issuers. affiliate_url NULL until partnership active.';
comment on column credit_cards.tags is 'Editorial flags (flagship, best-dining-2026, etc.). Validated by KNOWN_TAGS in admin layer.';
comment on column credit_cards.intended_user is 'Audience targeting (beginner, frequent-traveler, business-owner). Powers landing pages + future recommendation prep.';
comment on column credit_cards.affiliate_network is 'Set when affiliate_url uses dynamic generation (CJ, Rakuten, etc.). issuer_direct for static issuer links.';

-- ── 3. credit_card_earn_rates ────────────────────────────────────────────

create table if not exists credit_card_earn_rates (
  id              uuid primary key default gen_random_uuid(),
  card_id         uuid not null references credit_cards(id) on delete cascade,
  category        text not null,
  multiplier      numeric(5,2) not null check (multiplier >= 0),
  cap_amount_usd  integer check (cap_amount_usd is null or cap_amount_usd >= 0),
  cap_period      text check (cap_period is null or cap_period in ('quarterly','annual','monthly','lifetime')),
  rotating        boolean not null default false,
  booking_channel text not null default 'any' check (booking_channel in ('direct','portal','any')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists credit_card_earn_rates_card_idx     on credit_card_earn_rates (card_id);
create index if not exists credit_card_earn_rates_category_idx on credit_card_earn_rates (category);

create or replace function credit_card_earn_rates_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists credit_card_earn_rates_updated_at on credit_card_earn_rates;
create trigger credit_card_earn_rates_updated_at before update on credit_card_earn_rates
  for each row execute function credit_card_earn_rates_set_updated_at();

alter table credit_card_earn_rates enable row level security;
drop policy if exists "credit_card_earn_rates are publicly readable" on credit_card_earn_rates;
create policy "credit_card_earn_rates are publicly readable" on credit_card_earn_rates for select to anon, authenticated using (true);

comment on column credit_card_earn_rates.booking_channel is 'Distinguishes "5x flights via portal" from "3x flights direct" without splitting categories into _through_portal variants.';

-- ── 4. credit_card_benefits ──────────────────────────────────────────────

create table if not exists credit_card_benefits (
  id                  uuid primary key default gen_random_uuid(),
  card_id             uuid not null references credit_cards(id) on delete cascade,

  category            text not null check (category in (
                        'statement_credit','travel_credit','lounge_access','insurance',
                        'free_night','status_conferred','protection','spend_unlock',
                        'portal_redemption','transfer_partner_unlock','other'
                      )),
  benefit_type        text not null check (benefit_type in (
                        -- Lounge access
                        'lounge_priority_pass','lounge_centurion','lounge_admirals_club',
                        'lounge_skyclub','lounge_united_club','lounge_polaris','lounge_other',
                        -- Insurance
                        'trip_delay_insurance','trip_cancellation_insurance','trip_interruption_insurance',
                        'baggage_delay_insurance','lost_luggage_insurance',
                        'rental_car_cdw_primary','rental_car_cdw_secondary',
                        'travel_accident_insurance','emergency_evacuation_insurance',
                        -- Statement / travel credits
                        'travel_credit_annual','doordash_credit','dining_credit',
                        'streaming_credit','wireless_credit','walmart_credit','saks_credit',
                        'global_entry_credit','tsa_precheck_credit','clear_credit',
                        'hotel_credit','airline_credit','flight_credit',
                        'lyft_credit','uber_credit','equinox_credit','peloton_credit',
                        -- Hotel-specific
                        'free_night_award','free_night_after_spend',
                        -- Status conferred
                        'status_hyatt_discoverist','status_hyatt_explorist','status_hyatt_globalist',
                        'status_marriott_silver','status_marriott_gold','status_marriott_platinum',
                        'status_hilton_silver','status_hilton_gold','status_hilton_diamond',
                        'status_hertz_gold','status_avis_preferred','status_national_emerald',
                        -- Protections
                        'purchase_protection','extended_warranty','return_protection',
                        'cellphone_protection',
                        -- Other
                        'concierge','prepaid_extra_value',
                        'transfer_partner_access','portal_redemption_bonus','spend_unlock_perk',
                        'companion_pass','free_checked_bag','priority_boarding'
                      )),

  name                text not null,
  value_amount        numeric(10,2),
  value_unit          text check (value_unit is null or value_unit in ('USD','nights','pct','points','miles','points_per_dollar')),
  coverage_amount     numeric(10,2),
  frequency           text check (frequency is null or frequency in ('per_trip','annual','anniversary','monthly','lifetime','one_time','quarterly')),
  spend_threshold_usd numeric(10,2),
  description         text,
  sort_order          integer not null default 0,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists credit_card_benefits_card_idx         on credit_card_benefits (card_id);
create index if not exists credit_card_benefits_category_idx     on credit_card_benefits (card_id, category);
create index if not exists credit_card_benefits_type_idx         on credit_card_benefits (benefit_type);
create index if not exists credit_card_benefits_metadata_gin     on credit_card_benefits using gin (metadata);

create or replace function credit_card_benefits_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists credit_card_benefits_updated_at on credit_card_benefits;
create trigger credit_card_benefits_updated_at before update on credit_card_benefits
  for each row execute function credit_card_benefits_set_updated_at();

alter table credit_card_benefits enable row level security;
drop policy if exists "credit_card_benefits are publicly readable" on credit_card_benefits;
create policy "credit_card_benefits are publicly readable" on credit_card_benefits for select to anon, authenticated using (true);

comment on column credit_card_benefits.benefit_type is 'Precise subtype that drives the frontend renderer + metadata shape. CHECK constraint enforces consistency.';
comment on column credit_card_benefits.metadata is 'Type-specific fields (lounge guest rules, insurance limits, statement-credit merchant rules, free-night caps). Shape varies by benefit_type.';

-- ── 5. credit_card_welcome_bonuses ───────────────────────────────────────

create table if not exists credit_card_welcome_bonuses (
  id                  uuid primary key default gen_random_uuid(),
  card_id             uuid not null references credit_cards(id) on delete cascade,
  bonus_amount        integer not null check (bonus_amount >= 0),
  bonus_currency      text not null,
  spend_required_usd  integer not null check (spend_required_usd >= 0),
  spend_window_months integer not null check (spend_window_months > 0),
  extras              text,
  estimated_value_usd numeric(10,2) check (estimated_value_usd is null or estimated_value_usd >= 0),
  window_start        date,
  window_end          date,
  is_current          boolean not null default false,
  source_url          text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists credit_card_welcome_bonuses_card_idx on credit_card_welcome_bonuses (card_id);
create unique index if not exists credit_card_welcome_bonuses_one_current_per_card
  on credit_card_welcome_bonuses (card_id) where is_current = true;

create or replace function credit_card_welcome_bonuses_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists credit_card_welcome_bonuses_updated_at on credit_card_welcome_bonuses;
create trigger credit_card_welcome_bonuses_updated_at before update on credit_card_welcome_bonuses
  for each row execute function credit_card_welcome_bonuses_set_updated_at();

alter table credit_card_welcome_bonuses enable row level security;
drop policy if exists "credit_card_welcome_bonuses are publicly readable" on credit_card_welcome_bonuses;
create policy "credit_card_welcome_bonuses are publicly readable" on credit_card_welcome_bonuses for select to anon, authenticated using (true);

comment on column credit_card_welcome_bonuses.estimated_value_usd is 'Editorial-controlled valuation. 60K UR ≈ $1,200; 100K Hilton ≈ $500; $750 cash = $750. Enables sort-by-SUB-value.';

-- ── 6. program_transfers ─────────────────────────────────────────────────
-- Created empty in this migration. Backfill from programs.transfer_partners JSONB
-- happens in a follow-up migration once read paths in components/programs/
-- TransferPartnersTable.tsx + utils/ai/programReferenceData.ts are ready to query
-- this table instead of the JSONB column.

create table if not exists program_transfers (
  id              uuid primary key default gen_random_uuid(),
  from_program_id uuid not null references programs(id) on delete cascade,
  to_program_id   uuid not null references programs(id) on delete cascade,
  ratio           text not null,
  bonus_active    boolean not null default false,
  bonus_pct       integer check (bonus_pct is null or bonus_pct > 0),
  bonus_starts    date,
  bonus_ends      date,
  notes           text,
  last_verified   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (from_program_id, to_program_id),
  check (from_program_id <> to_program_id)
);

create index if not exists program_transfers_to_idx   on program_transfers (to_program_id);
create index if not exists program_transfers_from_idx on program_transfers (from_program_id);
create index if not exists program_transfers_bonus_idx on program_transfers (bonus_active) where bonus_active = true;

create or replace function program_transfers_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;
drop trigger if exists program_transfers_updated_at on program_transfers;
create trigger program_transfers_updated_at before update on program_transfers
  for each row execute function program_transfers_set_updated_at();

alter table program_transfers enable row level security;
drop policy if exists "program_transfers are publicly readable" on program_transfers;
create policy "program_transfers are publicly readable" on program_transfers for select to anon, authenticated using (true);

comment on table program_transfers is 'Normalized transfer-partner relationships. Replaces programs.transfer_partners JSONB long-term. Phase 7 (Cards that earn into me) reads from this table only.';
