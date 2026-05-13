-- Expand credit_card_benefits.frequency enum.
--
-- Surfaced by Amex Platinum extraction — Sonnet returned frequency='per_use'
-- for the Global Entry credit (correctly observing it triggers per application
-- fee charge). Old enum: per_trip, annual, anniversary, monthly, lifetime,
-- one_time, quarterly. Missing values we now want:
--
--   per_use     — Global Entry, TSA PreCheck application fee credits (one
--                 statement credit per qualifying purchase, not periodic)
--   biannual    — Jan-Jun + Jul-Dec split credits (Sapphire Reserve dining,
--                 StubHub, Sapphire Exclusive Tables — currently fudged as
--                 'annual' losing the structure)
--   semiannual  — alias for biannual; both valid
--
-- The save layer will also normalize unknown frequency values to the closest
-- valid one (per_use → per_trip if undeclared, biannual → quarterly fallback).

alter table credit_card_benefits drop constraint if exists credit_card_benefits_frequency_check;

alter table credit_card_benefits add constraint credit_card_benefits_frequency_check
  check (frequency is null or frequency in (
    'per_trip',
    'per_use',     -- NEW
    'annual',
    'biannual',    -- NEW (Jan-Jun + Jul-Dec pattern)
    'semiannual',  -- NEW (alias for biannual)
    'quarterly',
    'monthly',
    'anniversary',
    'one_time',
    'lifetime'
  ));

comment on column credit_card_benefits.frequency is
  'How often the benefit pays out. per_use = per qualifying transaction (Global Entry, application fee credits); biannual/semiannual = Jan-Jun + Jul-Dec split credits; lifetime = once per cardholder lifetime; one_time = one-time-only single bonus. Used for comparison-tool rankings and "annual value" calculations.';
