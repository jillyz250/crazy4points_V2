-- Unified Extractions Hub — admin_extractions_browse view.
--
-- Unlike admin_refresh_queue (which surfaces ONLY stale rows), this view
-- lists every extractable entity in the system: cards, programs, issuers,
-- welcome bonuses, hotel-property rollups. The /admin/extractions page
-- filters this server-side by type + stale toggle, then client-side by
-- name search.
--
-- Rows include both edit_url and extract_url. extract_url is null for
-- entities that have no extract pipeline (welcome bonuses, issuers,
-- hotel-properties rollup) — UI shows "Mark verified" only for those.
--
-- The legacy admin_refresh_queue view stays in place so the nav badge
-- (getRefreshQueueCount) keeps working. Replacing both would mean
-- rewiring the badge — separate change.

drop view if exists admin_extractions_browse;

create view admin_extractions_browse as
  -- All active credit cards
  select
    'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified::date as last_verified,
    90 as cadence_days,
    (current_date - coalesce(c.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/cards/' || c.id || '/edit')::text as edit_url,
    ('/admin/cards/' || c.slug || '/extract')::text as extract_url
  from credit_cards c
  where c.is_active = true

  union all

  -- Welcome bonuses (30-day cadence; no extract action — mark verified only)
  select
    'credit_card_welcome_bonus'::text,
    b.id,
    c.slug,
    (c.name || ' - current SUB')::text,
    b.last_verified::date,
    30,
    (current_date - coalesce(b.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/cards/' || c.id || '/edit')::text,
    null::text
  from credit_card_welcome_bonuses b
  join credit_cards c on c.id = b.card_id
  where c.is_active = true and b.is_current = true

  union all

  -- Issuers (365-day cadence; no extract action)
  select
    'issuer'::text,
    i.id,
    i.slug,
    i.name,
    i.last_verified::date,
    365,
    (current_date - coalesce(i.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/issuers/' || i.id || '/edit')::text,
    null::text
  from issuers i

  union all

  -- All active programs (skip reference stubs)
  select
    'program_'::text || p.type as entity_type,
    p.id as entity_id,
    p.slug as entity_slug,
    p.name as entity_name,
    p.last_verified::date as last_verified,
    180 as cadence_days,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/programs/' || p.slug || '/edit')::text as edit_url,
    ('/admin/programs/' || p.slug || '/extract')::text as extract_url
  from programs p
  where p.is_active = true and p.is_reference_stub = false

  union all

  -- Hotel-properties rollup (one row per hotel program with zero properties)
  select
    'hotel_properties_program'::text,
    p.id,
    p.slug,
    (p.name || ' - properties')::text,
    null::date,
    180,
    20580,
    ('/admin/programs/' || p.slug || '/properties')::text,
    null::text
  from programs p
  where p.is_active = true and p.type = 'hotel'
    and not exists (select 1 from hotel_properties hp where hp.program_id = p.id);

comment on view admin_extractions_browse is
  'Unified browse view for /admin/extractions. Lists every extractable entity (active cards + active programs + issuers + current welcome bonuses + hotel-property rollups). UI filters by type and stale-only toggle.';
