-- Add 'semi_annual' to the credit_card_benefits.frequency check constraint.
--
-- Needed for benefits like Amex Platinum's StubHub / Vivid Seats credit:
-- $150 in H1 (Jan-Jun) + $150 in H2 (Jul-Dec). Annual and quarterly don't
-- capture this pattern correctly. Wallet feature renders these as a 6-month
-- pool with running balance.

alter table credit_card_benefits
  drop constraint if exists credit_card_benefits_frequency_check;

alter table credit_card_benefits
  add constraint credit_card_benefits_frequency_check
  check (frequency is null or frequency in (
    'per_trip',
    'annual',
    'anniversary',
    'monthly',
    'lifetime',
    'one_time',
    'quarterly',
    'semi_annual'
  ));
