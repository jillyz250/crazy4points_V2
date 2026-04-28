-- Phase 1 of the admin refresh queue (plans/admin-refresh-queue.md).
--
-- This migration:
--   1. Adds `last_verified` to credit_card_welcome_bonuses (the only entity
--      tracked by the queue that's missing it; SUBs change fastest of all
--      card data and warrant their own freshness timestamp).
--   2. Creates the `admin_refresh_queue` view that unions all stale-content
--      entities into a single sortable list. Cadences encoded inline; if
--      they need to change, edit this view in a follow-up migration.
--
-- The TS-side `REFRESH_CADENCE_DAYS` const in lib/admin/refresh-cadences.ts
-- mirrors these cadences for the admin nav badge count + UI labels. Keep
-- the two in sync; future improvement is to generate the view from the
-- const at migration time.

-- ── Schema addition: last_verified on welcome bonuses ────────────────────

alter table credit_card_welcome_bonuses
  add column if not exists last_verified date;

-- Backfill all existing rows with current_date so they don't show up
-- immediately as overdue. New cards get last_verified set on insert.
update credit_card_welcome_bonuses
  set last_verified = current_date
  where last_verified is null;

-- ── View: admin_refresh_queue ────────────────────────────────────────────
--
-- One row per stale entity. Always reflects current state - drop and
-- recreate on every cadence-policy change.

drop view if exists admin_refresh_queue;

create view admin_refresh_queue as
  -- Credit cards (90 days)
  select
    'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified::date as last_verified,
    90 as cadence_days,
    (current_date - coalesce(c.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/cards/' || c.id || '/edit')::text as edit_url
  from credit_cards c
  where c.is_active = true
    and (c.last_verified is null or c.last_verified::date < current_date - 90)

  union all

  -- Credit card welcome bonuses (30 days - SUBs change fast)
  select
    'credit_card_welcome_bonus'::text,
    b.id,
    c.slug,
    (c.name || ' - current SUB')::text,
    b.last_verified::date,
    30,
    (current_date - coalesce(b.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/cards/' || c.id || '/edit')::text
  from credit_card_welcome_bonuses b
  join credit_cards c on c.id = b.card_id
  where c.is_active = true
    and b.is_current = true
    and (b.last_verified is null or b.last_verified::date < current_date - 30)

  union all

  -- Issuers (365 days - bank-level facts change rarely)
  select
    'issuer'::text,
    i.id,
    i.slug,
    i.name,
    i.last_verified::date,
    365,
    (current_date - coalesce(i.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/issuers/' || i.id || '/edit')::text
  from issuers i
  where (i.last_verified is null or i.last_verified::date < current_date - 365)

  union all

  -- Programs (180 days)
  select
    ('program_' || p.type)::text,
    p.id,
    p.slug,
    p.name,
    p.last_verified::date,
    180,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/programs/' || p.slug || '/edit')::text
  from programs p
  where p.is_active = true
    and (p.last_verified is null or p.last_verified::date < current_date - 180)

  union all

  -- Hotel properties (365 days - categories shift annually).
  -- Aggregated to the program level rather than per-property; per-property
  -- would flood the queue with thousands of rows for Hyatt alone.
  select
    'hotel_properties_program'::text as entity_type,
    p.id,
    p.slug,
    (p.name || ' - properties')::text,
    min(hp.last_verified::date) as last_verified,
    365 as cadence_days,
    (current_date - coalesce(min(hp.last_verified::date), '1970-01-01'::date))::integer as age_days,
    ('/admin/programs/' || p.slug || '/properties')::text as edit_url
  from hotel_properties hp
  join programs p on p.id = hp.program_id
  where p.is_active = true
  group by p.id, p.slug, p.name
  having min(hp.last_verified::date) is null or min(hp.last_verified::date) < current_date - 365;

comment on view admin_refresh_queue is
  'Aggregated view of editable entities with stale last_verified timestamps. Each row is one "needs attention" item for the admin refresh queue UI. Cadences encoded inline; mirror in lib/admin/refresh-cadences.ts.';

-- ── Public read policy on the view ───────────────────────────────────────
-- Views inherit the underlying tables' RLS. The component tables already
-- allow public select (anon + authenticated). For admin-only access in the
-- future, build the wrapper SELECT into createAdminClient calls rather than
-- restricting at the view layer.
