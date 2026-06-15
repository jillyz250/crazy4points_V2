-- Welcome-bonus monitor (data-accuracy plan). A daily cron scrapes each active
-- card's welcome-bonus source_url, Haiku-extracts the CURRENT sign-up bonus, and
-- flags any card whose live offer differs from what we have stored. Flag-for-
-- review only - never auto-edits. Dedup by content_hash (card + detected values)
-- so an unchanged discrepancy doesn't re-flag daily; last_seen_at bumps instead.
create table if not exists card_bonus_signals (
  id uuid primary key default gen_random_uuid(),
  content_hash text unique not null,
  card_id uuid not null references credit_cards(id) on delete cascade,
  card_slug text not null,
  card_name text not null,
  source_url text not null,
  bonus_currency text,
  stored_amount integer,
  stored_spend integer,
  detected_amount integer,
  detected_spend integer,
  summary text not null,
  confidence text not null default 'med',   -- high | med | low
  status text not null default 'new',        -- new | applied | dismissed
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists card_bonus_signals_status_idx on card_bonus_signals(status, last_seen_at desc);
create index if not exists card_bonus_signals_card_idx on card_bonus_signals(card_id);
select 'card_bonus_signals created' as ok;
