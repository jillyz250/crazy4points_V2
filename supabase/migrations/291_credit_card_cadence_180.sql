-- Relax credit card refresh cadence from 90 days to 180 days.
--
-- The static parts of a credit card (annual fee, FX fee, earn structure,
-- benefit suite) rarely change. The frequently-changing piece is the
-- welcome bonus (elevated offers come and go) — that stays on 30-day
-- cadence. Bumping the card-level cadence to 180 days reduces the
-- stale-queue volume from ~80 cards/quarter to ~80 cards/half-year while
-- still surfacing meaningful drift before it gets stale.
--
-- Keep the TS-side REFRESH_CADENCE_DAYS const in lib/admin/refresh-cadences.ts
-- in sync (committed alongside this migration).

drop view if exists admin_refresh_queue;

create view admin_refresh_queue as
  -- Credit cards (180 days — relaxed from 90 in migration 291)
  select
    'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    null::text as entity_subtype,
    180 as cadence_days,
    c.last_verified as last_verified_at,
    extract(day from current_date - c.last_verified::date)::int as age_days
  from credit_cards c
  where c.is_active = true
    and (c.last_verified is null or c.last_verified::date < current_date - 180)

  union all

  -- Credit card welcome bonuses (30 days — unchanged)
  select
    'credit_card_welcome_bonus'::text as entity_type,
    wb.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    null::text as entity_subtype,
    30 as cadence_days,
    wb.last_verified::timestamptz as last_verified_at,
    extract(day from current_date - wb.last_verified)::int as age_days
  from credit_card_welcome_bonuses wb
  join credit_cards c on c.id = wb.card_id
  where c.is_active = true
    and wb.is_current = true
    and (wb.last_verified is null or wb.last_verified < current_date - 30)

  union all

  -- Issuers (365 days)
  select
    'issuer'::text as entity_type,
    i.id as entity_id,
    i.slug as entity_slug,
    i.name as entity_name,
    null::text as entity_subtype,
    365 as cadence_days,
    i.last_verified::timestamptz as last_verified_at,
    extract(day from current_date - i.last_verified)::int as age_days
  from issuers i
  where i.last_verified is null or i.last_verified < current_date - 365

  union all

  -- Programs (cadence varies by type)
  select
    case
      when p.type = 'airline' then 'program_airline'
      when p.type = 'hotel' then 'program_hotel'
      when p.type = 'credit_card' then 'program_credit_card'
      when p.type = 'car_rental' then 'program_car_rental'
      when p.type = 'cruise' then 'program_cruise'
      when p.type = 'shopping_portal' then 'program_shopping_portal'
      when p.type = 'travel_portal' then 'program_travel_portal'
      when p.type = 'lounge_network' then 'program_lounge_network'
      when p.type = 'ota' then 'program_ota'
      else 'program_' || p.type
    end::text as entity_type,
    p.id as entity_id,
    p.slug as entity_slug,
    p.name as entity_name,
    p.type as entity_subtype,
    case
      when p.type in ('airline','hotel','credit_card','shopping_portal','travel_portal') then 180
      else 365
    end as cadence_days,
    p.last_verified::timestamptz as last_verified_at,
    extract(day from current_date - p.last_verified)::int as age_days
  from programs p
  where (p.last_verified is null) or (
    case
      when p.type in ('airline','hotel','credit_card','shopping_portal','travel_portal')
        then p.last_verified < current_date - 180
      else p.last_verified < current_date - 365
    end
  );
