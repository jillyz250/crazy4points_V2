-- Add a first-class 'experience' alert type.
--
-- WHY: We regularly publish alerts about points-redeemable experiences (Hilton /
-- Marriott / Delta / etc. auctions and Moments — the daily-ritual has a whole
-- phase for them). Until now they were shoehorned into 'limited_time_offer',
-- which is imprecise and un-filterable. This makes 'experience' a real type so
-- readers can browse them and we can badge them distinctly.
--
-- Two schema touch-points:
--   1. alerts.type is the Postgres enum `alert_type` -> ADD VALUE.
--   2. topics.topic_type is text + CHECK -> widen the CHECK.
-- The topics->alerts sync trigger casts metadata.original_alert_type::alert_type,
-- so the enum MUST carry 'experience' or an experience alert would fail to sync.
--
-- PG15 allows ALTER TYPE ADD VALUE inside a transaction as long as the new value
-- is not USED before commit (we don't use it here), so this is safe as one file.

ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'experience';

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_topic_type_check;
ALTER TABLE topics ADD CONSTRAINT topics_topic_type_check CHECK (topic_type IN (
  'promo',
  'devaluation',
  'sweet_spot',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'policy_change',
  'industry_news',
  'signup_bonus',
  'referral_bonus',
  'retention_offer',
  'shopping_portal_bonus',
  'award_sale',
  'companion_pass',
  'dining_bonus',
  'fee_change',
  'card_refresh',
  'milestone_bonus',
  'card_credit',
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'glitch',
  'transfer_bonus',
  'experience',
  'other'
));
