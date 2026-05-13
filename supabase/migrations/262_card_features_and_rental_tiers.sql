-- Surfaced by Amex Platinum extraction audit (Copilot review):
--
--   1. Premium charge cards (Amex Plat, Amex Business Plat) have No Preset
--      Spending Limit. Discrete card-level boolean — not a "benefit" row.
--   2. Metal cards are physically distinctive — relevant for product
--      comparison ("Looking for metal card under $400 AF").
--   3. Amex Platinum's car rental elite tiers (Avis Preferred Plus, Hertz
--      President's Circle, National Executive Elite) don't match our
--      existing status_avis_preferred / status_hertz_gold / status_national_emerald
--      enum values, which describe lower tiers. Sonnet was forced to use
--      status_other.
--
-- This migration adds:
--   - credit_cards.no_preset_spending_limit boolean
--   - credit_cards.is_metal_card boolean
--   - Three elite car rental status enum values to credit_card_benefits.benefit_type

alter table credit_cards
  add column if not exists no_preset_spending_limit boolean not null default false;

alter table credit_cards
  add column if not exists is_metal_card boolean not null default false;

comment on column credit_cards.no_preset_spending_limit is
  'TRUE for charge cards / premium credit cards that adjust spending capacity dynamically (Amex Platinum, Amex Business Platinum, Amex Gold are NPSL). FALSE for cards with a fixed credit limit. Drives comparison-tool filters like "show me NPSL cards."';

comment on column credit_cards.is_metal_card is
  'TRUE when the card is constructed of metal (Amex Platinum, CSR, Venture X, Bilt). FALSE for plastic. Cosmetic but a real comparison-tool differentiator.';

-- ── Add elite car rental tiers to benefit_type enum ──────────────────────

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
    'travel_emergency_assistance',
    -- Statement / travel credits
    'travel_credit_annual','doordash_credit','dining_credit',
    'streaming_credit','wireless_credit','walmart_credit','saks_credit',
    'global_entry_credit','tsa_precheck_credit','clear_credit',
    'hotel_credit','airline_credit','flight_credit',
    'lyft_credit','uber_credit','equinox_credit','peloton_credit',
    'entertainment_credit',
    -- Hotel
    'free_night_award','free_night_after_spend',
    -- Status conferred — Hyatt / Marriott / Hilton
    'status_hyatt_discoverist','status_hyatt_explorist','status_hyatt_globalist',
    'status_marriott_silver','status_marriott_gold','status_marriott_platinum',
    'status_hilton_silver','status_hilton_gold','status_hilton_diamond',
    -- Status conferred — IHG / Southwest / Alaska
    'status_ihg_silver','status_ihg_gold','status_ihg_platinum','status_ihg_diamond',
    'status_southwest_a_list','status_southwest_a_list_preferred',
    'status_southwest_companion_pass',
    'status_alaska_mvp','status_alaska_mvp_gold','status_alaska_mvp_gold_75k',
    -- Status conferred — Car rental
    'status_hertz_gold','status_avis_preferred','status_national_emerald',
    -- NEW: Premium card elite car rental tiers (Amex Plat lineup)
    'status_hertz_presidents_circle','status_avis_preferred_plus','status_national_executive_elite',
    -- Status conferred — generic fallback
    'status_other',
    -- Protections
    'purchase_protection','extended_warranty','return_protection','cellphone_protection',
    -- Travel perks + catch-alls
    'companion_pass','free_checked_bag','priority_boarding',
    'concierge','prepaid_extra_value',
    'transfer_partner_access','portal_redemption_bonus','spend_unlock_perk',
    'other'
  ));

comment on column credit_card_benefits.benefit_type is
  'Precise subtype. Includes elite-tier car rental status values for premium charge cards (status_hertz_presidents_circle, status_avis_preferred_plus, status_national_executive_elite) which differ from the entry-level tiers (status_hertz_gold, etc.).';
