-- Add a 90-day refresh cadence for currency program transfer partners.
--
-- WHY: Currency rosters (Chase UR -> United, Amex MR -> Hilton, etc.)
-- drift faster than the rest of program metadata. Issuers add and drop
-- partners and change ratios several times a year. The 180-day
-- program_credit_card cadence is too loose; partner-roster staleness
-- needs its own 90-day cycle.
--
-- This adds:
--   - programs.transfer_partners_verified_at column (nullable)
--   - A new UNION block in admin_refresh_queue that surfaces any program
--     with non-empty transfer_partners_outbound whose verified_at is null
--     or older than 90 days
--
-- Entity_type = 'transfer_partners' so the admin Refresh Hub can show
-- a distinct label. Keep lib/admin/refresh-cadences.ts in sync (the
-- TypeScript change is shipped in the same PR as this migration).

alter table programs
  add column if not exists transfer_partners_verified_at timestamptz;

comment on column programs.transfer_partners_verified_at is
  'Last time the transfer_partners_outbound JSONB was verified against the issuer''s logged-in portal. Drives the admin_refresh_queue ''transfer_partners'' entity_type at a 90-day cadence. Set when an editor confirms the canonical list from the issuer''s authenticated transfer page.';

drop view if exists admin_refresh_queue;

create view admin_refresh_queue as
  select
    'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified::date as last_verified,
    case when c.rotating_categories_url is not null then 90 else 90 end as cadence_days,
    (current_date - coalesce(c.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/cards/' || c.id || '/edit')::text as edit_url
  from credit_cards c
  where c.is_active = true
    and (
      (c.rotating_categories_url is null
       and (c.last_verified is null or c.last_verified::date < current_date - 90))
      or
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
    b.id, c.slug, (c.name || ' - current SUB')::text,
    b.last_verified::date, 30,
    (current_date - coalesce(b.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/cards/' || c.id || '/edit')::text
  from credit_card_welcome_bonuses b
  join credit_cards c on c.id = b.card_id
  where c.is_active = true and b.is_current = true
    and (b.last_verified is null or b.last_verified::date < current_date - 30)

  union all

  select
    'issuer'::text,
    i.id, i.slug, i.name, i.last_verified::date, 365,
    (current_date - coalesce(i.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/issuers/' || i.id || '/edit')::text
  from issuers i
  where (i.last_verified is null or i.last_verified::date < current_date - 365)

  union all

  select
    'program_'::text || p.type as entity_type,
    p.id, p.slug, p.name, p.last_verified::date, 180,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date))::integer,
    ('/admin/programs/' || p.slug || '/edit')::text
  from programs p
  where p.is_active = true and p.is_reference_stub = false
    and (p.last_verified is null or p.last_verified::date < current_date - 180)

  union all

  -- NEW: 90-day cadence for transfer-partner rosters on any program
  -- with structured outbound transfer data.
  select
    'transfer_partners'::text as entity_type,
    p.id as entity_id,
    p.slug as entity_slug,
    (p.name || ' - transfer partners')::text as entity_name,
    p.transfer_partners_verified_at::date as last_verified,
    90 as cadence_days,
    (current_date - coalesce(p.transfer_partners_verified_at::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/programs/' || p.slug || '/edit')::text as edit_url
  from programs p
  where p.is_active = true
    and jsonb_array_length(coalesce(p.transfer_partners_outbound, '[]'::jsonb)) > 0
    and (
      p.transfer_partners_verified_at is null
      or p.transfer_partners_verified_at::date < current_date - 90
    )

  union all

  select
    'hotel_properties_program'::text,
    p.id, p.slug, (p.name || ' - properties')::text, null::date, 180, 20580,
    ('/admin/programs/' || p.slug || '/properties')::text
  from programs p
  where p.is_active = true and p.type = 'hotel'
    and not exists (select 1 from hotel_properties hp where hp.program_id = p.id);

comment on view admin_refresh_queue is
  'Stale-entity feed for the admin Refresh Hub. Adds a 90-day cadence for the ''transfer_partners'' entity_type (any program with non-empty transfer_partners_outbound JSONB).';
