-- Experiences directory: programs that let you REDEEM points/miles for experiences
-- or give cardholder PRESALE/ACCESS. Separate table (experiences are features of
-- programs, not programs); cross-links to programs via parent_program_slug.
-- See plans/experiences-build-plan.md.

create table if not exists experiences (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  parent_program_slug   text,                       -- FK-ish to programs.slug; NULL for networks (Mastercard/Visa)
  parent_program_label  text not null,
  parent_type           text not null,              -- hotel | airline | bank_currency | card_network
  mode                  text not null,              -- redeem | access | both
  currency              text not null,
  region                text not null,

  -- Editorial content (markdown)
  intro                 text,
  what_you_get          text,
  how_it_works          text,
  how_to_access         text,
  standout_examples     text,
  good_to_know          text,
  value_take            text,

  -- Structured / filterable
  experience_types      text[] not null default '{}',
  pricing_models        text[] not null default '{}',
  inventory_style       text,
  min_points            integer,
  entry_point_label     text,
  booking_partner       text,
  refundable            text,
  requires_card         text[] not null default '{}',
  country_restrictions  text[] not null default '{}',
  featured_events       jsonb not null default '[]'::jsonb,

  -- Provenance / ops
  official_url          text,
  source_urls           text[] not null default '{}',
  last_verified         date,
  sort_weight           integer not null default 0,
  status                text not null default 'draft',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists experiences_parent_slug_idx on experiences (parent_program_slug);
create index if not exists experiences_status_idx on experiences (status);
create index if not exists experiences_types_gin on experiences using gin (experience_types);
create index if not exists experiences_pricing_gin on experiences using gin (pricing_models);
