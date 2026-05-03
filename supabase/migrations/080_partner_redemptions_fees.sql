-- 080_partner_redemptions_fees.sql
-- Schema add: cash fees per redemption row.
--
-- Why: miles cost alone is misleading. A 4,500 Atmos Y on AA looks dirt-cheap
-- until you discover Atmos charges a $12.50 partner-award fee + the $5.60 US
-- 9/11 security tax = ~$18 cash on top. Equally, AAdvantage J to Europe via
-- BA-operated metal looks like a bargain at 57.5k AA miles until BA hands you
-- a $700 fuel-surcharge invoice.
--
-- Three columns: low / high (USD integer dollars, simple) + a free-form note
-- for the breakdown. Tool ranks by miles + cash composite once populated.

alter table partner_redemptions
  add column if not exists cash_fee_low integer
    check (cash_fee_low is null or cash_fee_low >= 0),
  add column if not exists cash_fee_high integer
    check (cash_fee_high is null or cash_fee_high >= 0),
  add column if not exists fees_note text,
  add constraint partner_redemptions_fee_range_chk check (
    cash_fee_low is null
    or cash_fee_high is null
    or cash_fee_high >= cash_fee_low
  );

comment on column partner_redemptions.cash_fee_low is
  'Lower bound of expected cash co-pay in USD (taxes + surcharges + program fees). NULL = unverified.';
comment on column partner_redemptions.cash_fee_high is
  'Upper bound of expected cash co-pay in USD. NULL = single value (use cash_fee_low) or unverified.';
comment on column partner_redemptions.fees_note is
  'One-line breakdown of what makes up the cash fee. Surfaced under the row.';
