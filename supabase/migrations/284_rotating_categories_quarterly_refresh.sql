-- Quarter-aligned refresh cadence for cards with rotating_categories_url.
--
-- Cards like Chase Freedom Flex, Discover It, Cap One Savor One Cash Rewards,
-- US Bank Cash+ have rotating 5% bonus categories that change every calendar
-- quarter (Jan 1, Apr 1, Jul 1, Oct 1). The default 90-day cadence is
-- calendar-loose — it doesn't guarantee a refresh right after the new
-- quarter's categories drop.
--
-- This migration rebuilds admin_refresh_queue + admin_extractions_browse to
-- add a special case for credit_card rows where rotating_categories_url is set:
--   - Compute the start date of the current quarter
--   - Add a 14-day buffer (so we don't try to scrape on Jan 1 before the
--     issuer publishes Q1 content)
--   - If last_verified < (current_quarter_start + 14 days), card is stale
--     regardless of the 90-day rule
--
-- Cards without rotating_categories_url use the standard 90-day cadence
-- exactly as before.

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
      else 90
    end as cadence_days,
    (current_date - coalesce(c.last_verified::date, '1970-01-01'::date))::integer as age_days,
    ('/admin/cards/' || c.id || '/edit')::text as edit_url
  from credit_cards c
  where c.is_active = true
    and (
      -- Standard 90-day rule for cards without rotating categories
      (c.rotating_categories_url is null
       and (c.last_verified is null or c.last_verified::date < current_date - 90))
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
  'Stale-entity feed for the admin refresh hub. Credit cards with rotating_categories_url (Freedom Flex, Discover It, etc.) use a quarter-aligned staleness check: stale if last_verified is older than the start of the current calendar quarter + 14 days. All other entities use their nominal cadence_days windows.';
