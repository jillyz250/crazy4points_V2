-- Lightweight rate-limiting log.
--
-- Each row records one attempted action (subscribe, login, etc.) keyed by
-- "what" (anonymised client identifier — IP hash, email hash, etc.) and
-- "kind" (action name). Rate-limit checks count recent rows for the same
-- key + kind within a window.
--
-- Why a table instead of Vercel KV / Redis: we don't have one provisioned
-- and don't want to take on a new vendor for a feature this small. A
-- Postgres table indexed on (kind, key, ts) is plenty fast for the scale
-- we're at (hundreds of writes/day, single-digit reads per check).
--
-- Cleanup: a future migration / cron can DELETE WHERE ts < now() - 7 days.
-- Not urgent until table grows past ~100k rows.

create table if not exists rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  -- Hash of the client identifier (IP, email, etc.) — never store raw IPs
  -- so a future leak of this table doesn't expose subscriber IPs.
  key text not null,
  -- Action name: 'subscribe' | 'login' | 'unsubscribe' | etc.
  kind text not null,
  ts timestamptz not null default now()
);

-- Compound index for "how many rows for this kind+key in the last N minutes"
create index if not exists rate_limit_events_kind_key_ts_idx
  on rate_limit_events (kind, key, ts desc);

-- Service-role only — no anon/authenticated access.
grant select, insert, delete on public.rate_limit_events to service_role;
revoke all on public.rate_limit_events from anon, authenticated;

alter table rate_limit_events enable row level security;

comment on table rate_limit_events is
  'Lightweight rate-limit attempts log. Hashed key + action kind, queried by counting recent rows. Service-role only.';
