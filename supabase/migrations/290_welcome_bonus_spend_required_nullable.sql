-- Allow credit_card_welcome_bonuses.spend_required_usd to be NULL.
--
-- Original schema (migration 044) required spend_required_usd >= 0, which
-- works for traditional spend-based welcome bonuses ("$X cash back after
-- $Y spend") but blocks autopay-triggered bonuses like Chase Freedom Rise's
-- "$25 statement credit after enrolling in autopay during the first 3
-- months" — there's no spend requirement at all.
--
-- Without this fix, the apply-to-card-row flow silently drops these
-- welcome bonus rows on cards that have non-traditional triggers.

alter table credit_card_welcome_bonuses
  alter column spend_required_usd drop not null;

-- Keep the >= 0 check, but only when the value is non-null
alter table credit_card_welcome_bonuses
  drop constraint if exists credit_card_welcome_bonuses_spend_required_usd_check;
alter table credit_card_welcome_bonuses
  add constraint credit_card_welcome_bonuses_spend_required_usd_check
  check (spend_required_usd is null or spend_required_usd >= 0);

comment on column credit_card_welcome_bonuses.spend_required_usd is
  'Minimum spend required to earn the welcome bonus in USD. NULL for non-spend-based bonuses (e.g. Chase Freedom Rise''s $25 autopay enrollment credit — bonus posts after the cardholder sets up autopay, no purchase threshold). When NULL, the public card page renders the bonus with the trigger condition from the extras field instead of a spend requirement.';
