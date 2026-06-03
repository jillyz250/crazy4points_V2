-- ============================================================================
-- 359 - Benefit taxonomy: availability_type column + deterministic backfill
--
-- Powers the card-finder's faceted filters. Two parts:
--   (1) SCHEMA (additive): add credit_card_benefits.availability_type; extend
--       credit_cards.transfer_eligibility CHECK with 'restricted'.
--   (2) DETERMINISTIC BACKFILL of the ~386 cleanly-typed benefits into the
--       frozen benefit_family enum + provider + availability_type +
--       benefit_source, per the taxonomy locked 2026-06-03 (3 AI review passes,
--       all 7 boundary calls confirmed). Plus Amex cards' network (certain).
--
-- DELIBERATELY NOT TOUCHED here (separate reviewed steps):
--   * benefit_type 'other' (235) + 'spend_unlock_perk' (26): family left NULL,
--     classified later via a reviewed AI pass. (availability_type IS set for
--     them - it's independent of family.)
--   * non-Amex `network` (Visa vs MC varies per card) + `transfer_eligibility`
--     (needs the pool-to-unlock curation) - a curated per-card pass.
--
-- Reversible: every target column was NULL pre-migration; a re-null reverts.
-- Apply: supabase db query --linked --file supabase/migrations/359_benefit_taxonomy_backfill.sql
-- ============================================================================
begin;

-- ---------------------------------------------------------------------------
-- (1) SCHEMA
-- ---------------------------------------------------------------------------
alter table credit_card_benefits
  add column if not exists availability_type text;

alter table credit_card_benefits drop constraint if exists ccb_availability_type_check;
alter table credit_card_benefits add constraint ccb_availability_type_check
  check (availability_type is null or availability_type in
    ('always_on','spend_unlock','activation_required','requires_enrollment','targeted','limited_time'));
comment on column credit_card_benefits.availability_type is
  'How the benefit is obtained: always_on | spend_unlock (gated by annual spend) | activation_required (rotating) | requires_enrollment (must opt in) | targeted | limited_time. Independent of benefit_family.';

alter table credit_cards drop constraint if exists cc_transfer_eligibility_check;
alter table credit_cards add constraint cc_transfer_eligibility_check
  check (transfer_eligibility is null or transfer_eligibility in ('direct','pool_to_unlock','restricted','none'));

-- ---------------------------------------------------------------------------
-- (2a) benefit_family + provider + benefit_source for cleanly-typed rows.
--      Only fills NULLs (never clobbers a manually-set value). `other` and
--      `spend_unlock_perk` are intentionally excluded -> stay NULL.
-- ---------------------------------------------------------------------------
update credit_card_benefits b set
  benefit_family = case
    when benefit_type like 'lounge\_%' then 'lounge'
    when benefit_type like 'status\_%' then 'status'
    when benefit_type in ('lost_luggage_insurance','baggage_delay_insurance','travel_emergency_assistance',
        'trip_cancellation_insurance','trip_delay_insurance','travel_accident_insurance',
        'rental_car_cdw_secondary','rental_car_cdw_primary','emergency_medical_dental_insurance',
        'emergency_evacuation_insurance','trip_interruption_insurance') then 'insurance'
    when benefit_type in ('purchase_protection','extended_warranty','return_protection','cellphone_protection') then 'protection'
    when benefit_type in ('doordash_credit','hotel_credit','global_entry_credit','travel_credit_annual',
        'airline_credit','uber_credit','entertainment_credit','dining_credit','lyft_credit','walmart_credit',
        'peloton_credit','equinox_credit','streaming_credit','clear_credit','flight_credit') then 'credit'
    when benefit_type in ('free_night_award','free_night_after_spend') then 'hotel'
    when benefit_type in ('free_checked_bag','priority_boarding','companion_pass') then 'airline'
    when benefit_type in ('transfer_partner_access','portal_redemption_bonus') then 'earning'
    when benefit_type in ('concierge','roadside_assistance') then 'perk'
    else null end,
  provider = coalesce(provider, case
    when benefit_type = 'doordash_credit' then 'DoorDash'
    when benefit_type = 'uber_credit' then 'Uber'
    when benefit_type = 'lyft_credit' then 'Lyft'
    when benefit_type = 'walmart_credit' then 'Walmart+'
    when benefit_type = 'peloton_credit' then 'Peloton'
    when benefit_type = 'equinox_credit' then 'Equinox'
    when benefit_type = 'clear_credit' then 'CLEAR'
    when benefit_type = 'global_entry_credit' then 'Global Entry / TSA PreCheck'
    when benefit_type = 'lounge_priority_pass' then 'Priority Pass'
    when benefit_type = 'lounge_united_club' then 'United Club'
    when benefit_type = 'lounge_skyclub' then 'Delta Sky Club'
    when benefit_type = 'lounge_centurion' then 'Centurion'
    when benefit_type like 'status_marriott\_%' then 'Marriott Bonvoy'
    when benefit_type like 'status_ihg\_%' then 'IHG One Rewards'
    when benefit_type like 'status_hilton\_%' then 'Hilton Honors'
    when benefit_type like 'status_hyatt\_%' then 'World of Hyatt'
    when benefit_type like 'status_southwest\_%' then 'Southwest Rapid Rewards'
    else null end),
  benefit_source = coalesce(benefit_source, 'issuer_primary')
where b.benefit_family is null
  and b.benefit_type not in ('other','spend_unlock_perk');

-- ---------------------------------------------------------------------------
-- (2b) availability_type for ALL rows (independent of family). spend-gated ->
--      spend_unlock; everything else -> always_on. Global Entry / CLEAR are
--      always_on (you use the credit; you don't enroll to receive it).
-- ---------------------------------------------------------------------------
update credit_card_benefits set
  availability_type = case when spend_threshold_usd is not null then 'spend_unlock' else 'always_on' end
where availability_type is null;

-- ---------------------------------------------------------------------------
-- (2c) Amex cards' network (certain - all Amex-issued cards run the Amex
--      network). Non-Amex networks vary per card -> left for a curated pass.
-- ---------------------------------------------------------------------------
update credit_cards c set network = 'amex'
from issuers i
where c.issuer_id = i.id and i.name = 'American Express' and c.network is null;

-- ---------------------------------------------------------------------------
-- (3) LINT VIEW - soft guard (non-blocking). Lists any row whose benefit_type
--     implies a different family than is set, so misclassification drift is
--     visible (run ad-hoc or from a cron). Does NOT block inserts, so new
--     benefit_types remain free to slot in.
-- ---------------------------------------------------------------------------
create or replace view benefit_family_lint as
select b.id, b.card_id, b.benefit_type, b.benefit_family as set_family,
  case
    when benefit_type like 'lounge\_%' then 'lounge'
    when benefit_type like 'status\_%' then 'status'
    when benefit_type in ('lost_luggage_insurance','baggage_delay_insurance','travel_emergency_assistance',
        'trip_cancellation_insurance','trip_delay_insurance','travel_accident_insurance',
        'rental_car_cdw_secondary','rental_car_cdw_primary','emergency_medical_dental_insurance',
        'emergency_evacuation_insurance','trip_interruption_insurance') then 'insurance'
    when benefit_type in ('purchase_protection','extended_warranty','return_protection','cellphone_protection') then 'protection'
    when benefit_type in ('doordash_credit','hotel_credit','global_entry_credit','travel_credit_annual',
        'airline_credit','uber_credit','entertainment_credit','dining_credit','lyft_credit','walmart_credit',
        'peloton_credit','equinox_credit','streaming_credit','clear_credit','flight_credit') then 'credit'
    when benefit_type in ('free_night_award','free_night_after_spend') then 'hotel'
    when benefit_type in ('free_checked_bag','priority_boarding','companion_pass') then 'airline'
    when benefit_type in ('transfer_partner_access','portal_redemption_bonus') then 'earning'
    when benefit_type in ('concierge','roadside_assistance') then 'perk'
    else null end as expected_family
from credit_card_benefits b;
comment on view benefit_family_lint is
  'Drift guard: rows where set benefit_family <> expected (by benefit_type). Query: select * from benefit_family_lint where set_family is distinct from expected_family and expected_family is not null;';

commit;
