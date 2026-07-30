-- Newsletter "Money Can't Buy: New Experiences" section.
--
-- Adds a data-driven slot to the weekly newsletter, mirroring how
-- active_offers / elevated_bonuses work: an auto-filled jsonb column the
-- editor pulls from live data (experience_listings) and can trim before send.
--
-- The section surfaces genuinely on-brand points redemptions (Marriott Bonvoy
-- Moments, Hilton, United MileagePlus Exclusives, etc.) and deliberately
-- excludes card-network concert presales (Citi/Amex/Chase Entertainment),
-- which carry no points angle. Curation lives in getTopExperiences().
--
-- Shape (TopExperienceItem[] in utils/ai/newsletterSlots.ts):
--   [{ title, program_label, format: 'redeem'|'bid', points_label, deadline,
--      event_label, link_url, is_auction }]
--
-- Nullable: NULL = not pulled yet; [] = pulled, nothing qualified this week.

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS top_experiences jsonb;

COMMENT ON COLUMN newsletters.top_experiences IS
  'Newsletter "Money Can''t Buy: New Experiences" section. Array of curated points-redeemable experience listings, auto-filled from experience_listings and editor-trimmed. NULL = not pulled; [] = pulled, none qualified.';
