-- Add travel_emergency_assistance benefit_type.
--
-- Surfaced by Sapphire Reserve audit — the product page lists "legal and
-- medical referrals and access to other travel and emergency assistance
-- services" as a benefit, but Sonnet missed it because no enum value
-- existed AND because the prompt didn't force it to look for fine-print
-- coordination services.
--
-- This is a coordination/hotline service — NOT reimbursement. Distinct from:
--   emergency_medical_dental_insurance ($2,500 reimbursement)
--   emergency_evacuation_insurance     ($100,000 reimbursement)
--
-- Most Visa Signature/Visa Infinite/Mastercard World cards include some
-- version. Universal coverage matters for the comparison tool.

alter table credit_card_benefits drop constraint if exists credit_card_benefits_benefit_type_check;

alter table credit_card_benefits add constraint credit_card_benefits_benefit_type_check
  check (benefit_type in (
    -- Lounge access
    'lounge_priority_pass','lounge_centurion','lounge_admirals_club',
    'lounge_skyclub','lounge_united_club','lounge_polaris','lounge_other',
    -- Insurance + coordination
    'trip_delay_insurance','trip_cancellation_insurance','trip_interruption_insurance',
    'baggage_delay_insurance','lost_luggage_insurance',
    'rental_car_cdw_primary','rental_car_cdw_secondary',
    'travel_accident_insurance','emergency_evacuation_insurance',
    'roadside_assistance','emergency_medical_dental_insurance',
    'travel_emergency_assistance',  -- NEW: hotline/referral service, not reimbursement
    -- Statement / travel credits
    'travel_credit_annual','doordash_credit','dining_credit',
    'streaming_credit','wireless_credit','walmart_credit','saks_credit',
    'global_entry_credit','tsa_precheck_credit','clear_credit',
    'hotel_credit','airline_credit','flight_credit',
    'lyft_credit','uber_credit','equinox_credit','peloton_credit',
    'entertainment_credit',
    -- Hotel
    'free_night_award','free_night_after_spend',
    -- Status conferred
    'status_hyatt_discoverist','status_hyatt_explorist','status_hyatt_globalist',
    'status_marriott_silver','status_marriott_gold','status_marriott_platinum',
    'status_hilton_silver','status_hilton_gold','status_hilton_diamond',
    'status_hertz_gold','status_avis_preferred','status_national_emerald',
    'status_ihg_silver','status_ihg_gold','status_ihg_platinum','status_ihg_diamond',
    'status_southwest_a_list','status_southwest_a_list_preferred',
    'status_southwest_companion_pass',
    'status_alaska_mvp','status_alaska_mvp_gold','status_alaska_mvp_gold_75k',
    'status_other',
    -- Protections
    'purchase_protection','extended_warranty','return_protection',
    'cellphone_protection',
    -- Travel perks + catch-alls
    'companion_pass','free_checked_bag','priority_boarding',
    'concierge','prepaid_extra_value',
    'transfer_partner_access','portal_redemption_bonus','spend_unlock_perk',
    'other'
  ));
