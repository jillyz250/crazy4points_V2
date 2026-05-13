-- Add 'other' as a catch-all benefit_type + a few missing status types.
--
-- Surfaced by Sapphire Reserve pilot — Sonnet returned benefit_type='other'
-- for IHG One Rewards Platinum/Diamond Elite Status and Southwest A-List
-- status (none of those status types exist in the enum yet). CHECK constraint
-- rejected the insert.
--
-- Two fixes here:
--   1. Add 'other' as the catch-all benefit_type (mirrors the catch-all
--      already in the category enum)
--   2. Add status types for IHG, Southwest, Alaska so common co-brand
--      benefits get specific values instead of falling through to 'other'
--
-- Postgres CHECK constraints aren't append-able — drop and re-add with the
-- complete updated list. All existing values preserved.

alter table credit_card_benefits drop constraint if exists credit_card_benefits_benefit_type_check;

alter table credit_card_benefits add constraint credit_card_benefits_benefit_type_check
  check (benefit_type in (
    -- Lounge access
    'lounge_priority_pass','lounge_centurion','lounge_admirals_club',
    'lounge_skyclub','lounge_united_club','lounge_polaris','lounge_other',
    -- Insurance
    'trip_delay_insurance','trip_cancellation_insurance','trip_interruption_insurance',
    'baggage_delay_insurance','lost_luggage_insurance',
    'rental_car_cdw_primary','rental_car_cdw_secondary',
    'travel_accident_insurance','emergency_evacuation_insurance',
    -- Statement / travel credits
    'travel_credit_annual','doordash_credit','dining_credit',
    'streaming_credit','wireless_credit','walmart_credit','saks_credit',
    'global_entry_credit','tsa_precheck_credit','clear_credit',
    'hotel_credit','airline_credit','flight_credit',
    'lyft_credit','uber_credit','equinox_credit','peloton_credit',
    -- Hotel-specific
    'free_night_award','free_night_after_spend',
    -- Status conferred (existing)
    'status_hyatt_discoverist','status_hyatt_explorist','status_hyatt_globalist',
    'status_marriott_silver','status_marriott_gold','status_marriott_platinum',
    'status_hilton_silver','status_hilton_gold','status_hilton_diamond',
    'status_hertz_gold','status_avis_preferred','status_national_emerald',
    -- NEW: Status conferred — IHG, Southwest, Alaska
    'status_ihg_silver','status_ihg_gold','status_ihg_platinum','status_ihg_diamond',
    'status_southwest_a_list','status_southwest_a_list_preferred',
    'status_southwest_companion_pass',
    'status_alaska_mvp','status_alaska_mvp_gold','status_alaska_mvp_gold_75k',
    -- NEW: Status — generic catch-all (for partner statuses we have not
    -- enumerated yet; editor can promote to a specific value later)
    'status_other',
    -- Protections
    'purchase_protection','extended_warranty','return_protection',
    'cellphone_protection',
    -- Travel perks
    'companion_pass','free_checked_bag','priority_boarding',
    'concierge','prepaid_extra_value',
    'transfer_partner_access','portal_redemption_bonus','spend_unlock_perk',
    -- NEW: catch-all
    'other'
  ));

comment on column credit_card_benefits.benefit_type is
  'Precise subtype that drives the frontend renderer + metadata shape. CHECK constraint enforces consistency. Use ''other'' (or category-prefixed _other variants like status_other, lounge_other) as fallback when Sonnet sees a benefit that does not cleanly map to an enumerated value — editor can promote to a specific value later.';
