-- SECURITY FIX: two public views were flagged as SECURITY DEFINER by Supabase's
-- security advisor. SECURITY DEFINER views run queries with the privileges of the
-- view owner (service role), which means RLS policies are bypassed. Recreating both
-- with security_invoker=on forces the view to run with the caller's privileges so
-- RLS applies correctly. These are read-only admin-dashboard views with no
-- sensitive data, but the fix is still required practice.

-- 1) admin_refresh_queue
drop view if exists public.admin_refresh_queue;
create or replace view public.admin_refresh_queue
  with (security_invoker = on)
as
  select 'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified,
    90 as cadence_days,
    (current_date - coalesce(c.last_verified, '1970-01-01'::date)) as age_days,
    ('/admin/cards/' || c.id || '/edit') as edit_url
  from credit_cards c
  where c.is_active = true
    and c.status is distinct from 'defunct'
    and c.intro is not null
    and (
      (c.rotating_categories_url is null
        and (c.last_verified is null or c.last_verified < (current_date - 90)))
      or
      (c.rotating_categories_url is not null
        and (c.last_verified is null or c.last_verified < (date_trunc('quarter', current_date::timestamptz)::date + interval '14 days')::date))
    )
union all
  select 'credit_card_welcome_bonus'::text,
    b.id,
    c.slug,
    c.name || ' - current SUB',
    b.last_verified,
    30,
    (current_date - coalesce(b.last_verified, '1970-01-01'::date)),
    '/admin/cards/' || c.id || '/edit'
  from credit_card_welcome_bonuses b
  join credit_cards c on c.id = b.card_id
  where c.is_active = true
    and c.status is distinct from 'defunct'
    and c.intro is not null
    and b.is_current = true
    and (b.last_verified is null or b.last_verified < (current_date - 30))
union all
  select 'issuer'::text,
    i.id,
    i.slug,
    i.name,
    i.last_verified,
    365,
    (current_date - coalesce(i.last_verified, '1970-01-01'::date)),
    '/admin/issuers/' || i.id || '/edit'
  from issuers i
  where i.last_verified is null or i.last_verified < (current_date - 365)
union all
  select ('program_' || p.type)::text,
    p.id,
    p.slug,
    p.name,
    p.last_verified::date,
    180,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date)),
    '/admin/programs/' || p.slug || '/edit'
  from programs p
  where p.is_active = true
    and p.is_reference_stub = false
    and p.intro is not null
    and (p.last_verified is null or p.last_verified::date < (current_date - 180))
union all
  select 'transfer_partners'::text,
    p.id,
    p.slug,
    p.name || ' - transfer partners',
    p.transfer_partners_verified_at::date,
    90,
    (current_date - coalesce(p.transfer_partners_verified_at::date, '1970-01-01'::date)),
    '/admin/programs/' || p.slug || '/edit'
  from programs p
  where p.is_active = true
    and p.intro is not null
    and jsonb_array_length(coalesce(p.transfer_partners_outbound, '[]'::jsonb)) > 0
    and (p.transfer_partners_verified_at is null or p.transfer_partners_verified_at::date < (current_date - 90));

-- 2) benefit_family_lint
drop view if exists public.benefit_family_lint;
create or replace view public.benefit_family_lint
  with (security_invoker = on)
as
  select
    id,
    card_id,
    benefit_type,
    benefit_family as set_family,
    case
      when benefit_type like 'lounge_%' then 'lounge'
      when benefit_type like 'status_%' then 'status'
      when benefit_type = any(array[
        'lost_luggage_insurance','baggage_delay_insurance','travel_emergency_assistance',
        'trip_cancellation_insurance','trip_delay_insurance','travel_accident_insurance',
        'rental_car_cdw_secondary','rental_car_cdw_primary',
        'emergency_medical_dental_insurance','emergency_evacuation_insurance',
        'trip_interruption_insurance'
      ]) then 'insurance'
      when benefit_type = any(array[
        'purchase_protection','extended_warranty','return_protection','cellphone_protection'
      ]) then 'protection'
      when benefit_type = any(array[
        'doordash_credit','hotel_credit','global_entry_credit','travel_credit_annual',
        'airline_credit','uber_credit','entertainment_credit','dining_credit','lyft_credit',
        'walmart_credit','peloton_credit','equinox_credit','streaming_credit',
        'clear_credit','flight_credit'
      ]) then 'credit'
      when benefit_type = any(array['free_night_award','free_night_after_spend']) then 'hotel'
      when benefit_type = any(array['free_checked_bag','priority_boarding','companion_pass']) then 'airline'
      when benefit_type = any(array['transfer_partner_access','portal_redemption_bonus']) then 'earning'
      when benefit_type = any(array['concierge','roadside_assistance']) then 'perk'
      else null
    end as expected_family
  from credit_card_benefits b;
