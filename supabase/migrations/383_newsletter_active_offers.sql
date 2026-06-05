-- ============================================================================
-- 383 - Newsletter "Live Offers" section: schema.
-- Adds the active_offers jsonb slot to newsletters (3 buckets: transfer bonuses,
-- earning promos, purchase bonuses) + a new 'purchase_bonus' value to the
-- alert_type enum (buy-points alerts). The retype of existing alerts to the new
-- value lives in 384 - a new enum value can't be USED in the same transaction
-- it's added in.
-- ============================================================================
alter type alert_type add value if not exists 'purchase_bonus';
alter table newsletters add column if not exists active_offers jsonb;
