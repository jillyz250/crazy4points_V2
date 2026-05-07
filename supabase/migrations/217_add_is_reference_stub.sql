-- Add is_reference_stub flag to programs.
--
-- Reference stubs are program rows that exist solely as FK targets in
-- partner_redemptions (operating_carrier_id) so partner-award rows have
-- an airline name to render. We do NOT intend to author full pages for
-- them - they show up to FK queries but should not appear in:
--   - the admin refresh queue (perm exclusion, not just 180-day window)
--   - the page-completeness "no content yet" warning UI
-- and should be visually badged as "Reference stub" in the admin programs
-- table so a future admin understands why the row is empty.
--
-- Currently 19 type='airline' active rows match this profile (sas, lufthansa-
-- group siblings already authored mostly, hainan_airlines, gulf-air, kenya-
-- airways, plus small US regionals like cape_air, kenmore_air, etc.).

alter table programs
  add column if not exists is_reference_stub boolean not null default false;

comment on column programs.is_reference_stub is
  'Marks rows that exist only as FK targets (operating_carrier_id in partner_redemptions). Excluded from refresh queue and admin completeness warnings. Set to false on any row you intend to author.';

-- Mark the 19 currently-empty active airline rows as reference stubs.
update programs
set is_reference_stub = true,
    updated_at = now()
where type = 'airline'
  and is_active = true
  and length(coalesce(intro, '')) < 100;

-- Recreate admin_refresh_queue view to exclude reference stubs from the
-- programs section. Other sections (credit_card, issuer, etc.) unchanged.
drop view if exists admin_refresh_queue;

create view admin_refresh_queue as
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

  -- Programs: exclude reference stubs from the refresh queue
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

  -- Hotel-properties row count (180-day cadence per program)
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
