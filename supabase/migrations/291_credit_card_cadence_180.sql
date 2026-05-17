-- Relax credit card refresh cadence from 90 days to 180 days.
--
-- The static parts of a credit card (annual fee, FX fee, earn structure,
-- benefit suite) rarely change. The frequently-changing piece is the
-- welcome bonus (elevated offers come and go) — that stays on 30-day
-- cadence. Bumping the card-level cadence to 180 days reduces the
-- stale-queue volume from ~80 cards/quarter to ~80 cards/half-year while
-- still surfacing meaningful drift before it gets stale.
--
-- Rotating-category cards (Freedom Flex, Discover It, etc.) keep their
-- quarter-aligned staleness check — that's tied to issuer category rotations,
-- not the general refresh cadence. Unchanged.
--
-- Keep lib/admin/refresh-cadences.ts in sync with this view.
--
-- Based on migration 284 (the prior canonical rebuild); only the standard
-- credit-card threshold changes from 90 to 180.

drop view if exists admin_refresh_queue;

create view admin_refresh_queue as
  select
    'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified::date as last_verified,
    case
      when c.rotating_categories_url is not null then 90  -- nominal label; quarter logic in stale check
      else 180
    end as cadence_days,
    (current_date - coalesce(c.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/cards/' || c.id || '/edit')::text as edit_url
  from credit_cards c
  where c.is_active = true
    and (
      -- Standard 180-day rule for cards without rotating categories
      (c.rotating_categories_url is null
       and (c.last_verified is null or c.last_verified::date < current_date - 180))
      or
      -- Quarter-shift rule for rotating-category cards: stale if last_verified
      -- is before the start of the current quarter + 14-day buffer.
      (c.rotating_categories_url is not null
       and (
         c.last_verified is null
         or c.last_verified::date <
           (date_trunc('quarter', current_date)::date + interval '14 days')::date
       ))
    )

  union all

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

  select
    'program_'::text || p.type as entity_type,
    p.id as entity_id,
    p.slug as entity_slug,
    p.name as entity_name,
    p.last_verified::date as last_verified,
    180 as cadence_days,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/programs/' || p.slug || '/edit')::text as edit_url
  from programs p
  where p.is_active = true
    and p.is_reference_stub = false
    and (p.last_verified is null or p.last_verified::date < current_date - 180)

  union all

  select
    'hotel_properties_program'::text as entity_type,
    p.id as entity_id,
    p.slug as entity_slug,
    (p.name || ' - properties')::text as entity_name,
    null::date as last_verified,
    180 as cadence_days,
    20580 as age_days,
    ('/admin/programs/' || p.slug || '/properties')::text as edit_url
  from programs p
  where p.is_active = true
    and p.type = 'hotel'
    and not exists (
      select 1 from hotel_properties hp where hp.program_id = p.id
    );

comment on view admin_refresh_queue is
  'Stale-entity feed for the admin refresh hub. Credit cards: 180-day cadence (rotating-category cards use quarter-aligned check). Welcome bonuses: 30-day cadence. Programs: 180-day. Issuers: 365-day. Updated 2026-05-17 (migration 291).';
