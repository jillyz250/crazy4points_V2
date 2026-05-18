-- Content system rehaul — PR 1 of 5 (schema only).
-- See plans/content-system-rehaul.md for the full design.
--
-- topics = the unit of editorial work. One verified piece of points/miles
-- news (a promo, devaluation, sweet spot, etc.) that we can then fan out
-- into many format-specific variants (alert, blog, newsletter, social) via
-- the content_variants table (migration 298).
--
-- A topic carries:
--   • the raw verified source markdown + URLs we scraped/pasted
--   • a structured fact_ledger jsonb so every downstream claim is sourced
--   • a fact_check_status gate so unverified topics never produce variants
--   • program + card tags for filtering and "related topics" surfaces
--
-- Topics are admin-only — no public /topics/<slug> route. Variants are the
-- thing that ships to readers.

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),

  -- Uniqueness on slug is enforced by topics_slug_idx in migration 299.
  slug text not null,
  title text not null,
  summary text,

  -- Raw verified content (issuer page text, T&C excerpts, press release body)
  -- that variants are written against. Single source of truth — variants
  -- should never invent facts not present here or in fact_ledger.
  source_markdown text,

  -- Issuer-domain canonical URLs that source_markdown was scraped from.
  source_urls text[] not null default '{}',

  -- Structured fact ledger. Shape per entry:
  --   {
  --     claim: string,
  --     category: string | null,
  --     source_url: string,
  --     source_quote: string,
  --     confidence: 'high' | 'medium' | 'low',
  --     verified_at: timestamptz,
  --     verified_by: string | null
  --   }
  -- Populated by the Haiku fact-extractor (PR 2). Every claim that appears
  -- in any variant must trace back to an entry here.
  fact_ledger jsonb not null default '[]'::jsonb,

  fact_check_status text not null default 'pending'
    check (fact_check_status in (
      'pending',
      'verified',
      'partially_verified',
      'failed'
    )),
  verified_at timestamptz,
  verified_by text,

  -- Program + card tags. Match programs.slug and credit_cards.slug.
  programs text[] not null default '{}',
  cards text[] not null default '{}',

  topic_type text not null
    check (topic_type in (
      'promo',
      'devaluation',
      'sweet_spot',
      'program_change',
      'partner_change',
      'category_change',
      'earn_rate_change',
      'status_change',
      'policy_change',
      'industry_news',
      'signup_bonus',
      'referral_bonus',
      'retention_offer',
      'shopping_portal_bonus',
      'award_sale',
      'companion_pass',
      'dining_bonus',
      'fee_change',
      'card_refresh',
      'milestone_bonus',
      'card_credit',
      'limited_time_offer',
      'award_availability',
      'status_promo',
      'glitch',
      'transfer_bonus',
      'other'
    )),

  -- When the underlying offer / promo ends. Used to auto-expire variants
  -- and to filter "still live" topic lists. Nullable for evergreen topics.
  end_date timestamptz,

  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),

  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes are added in migration 299.

-- Updated-at trigger
create or replace function topics_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists topics_updated_at on topics;
create trigger topics_updated_at
  before update on topics
  for each row execute function topics_set_updated_at();

-- RLS — topics are admin-only (no public /topics route). Keep RLS enabled
-- with no public read policy; admin server actions use the service-role
-- client which bypasses RLS.
alter table topics enable row level security;

comment on table topics is
  'Editorial topics — verified points/miles news items that fan out into format-specific variants (alert, blog, newsletter, social) via content_variants. Admin-only; no public route. See plans/content-system-rehaul.md.';

comment on column topics.fact_ledger is
  'Structured fact ledger populated by the Haiku fact-extractor (PR 2). Array of {claim, category, source_url, source_quote, confidence, verified_at, verified_by}. Every claim in any variant must trace back to an entry here.';

comment on column topics.fact_check_status is
  'Gate on variant generation. Variants should only be generated for verified or partially_verified topics.';

comment on column topics.end_date is
  'When the underlying offer / promo ends. Null for evergreen topics. Drives auto-expiry of variants and "still live" filters.';
