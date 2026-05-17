-- Add rotating_categories_url to credit_cards.
--
-- Some cards (Chase Freedom Flex, Discover It, Cap One Savor One Cash Rewards,
-- US Bank Cash+, etc.) have rotating 5x quarterly bonus categories. Those
-- categories change every quarter and live on a dedicated page like
-- chase.com/.../freedom/freedomfive.
--
-- This URL is FUNDAMENTALLY different from official_url / guide_to_benefits_url
-- / pricing_terms_url because it's TIME-SENSITIVE — the content changes
-- quarterly even though the URL doesn't move. Cards with this populated should
-- be refreshed on Jan 1, Apr 1, Jul 1, Oct 1 to capture each new quarter's
-- categories.
--
-- For now: extraction pipeline includes it as a secondary URL alongside guide
-- and pricing. Per-card quarterly cadence handling is a separate change (will
-- update lib/admin/refresh-cadences.ts and the refresh queue).
--
-- For cards without rotating categories: leave null. The vast majority of
-- cards (Sapphire Preferred / Reserve / Platinum / etc.) won't use this column.

alter table credit_cards
  add column if not exists rotating_categories_url text;

comment on column credit_cards.rotating_categories_url is
  'URL of the page listing the current quarter''s rotating 5x bonus categories. Only set for cards with rotating-category structures (Freedom Flex, Discover It, Cap One Savor One Cash Rewards, US Bank Cash+, etc.). Refresh QUARTERLY (Jan/Apr/Jul/Oct 1) to capture each new quarter. Pipeline includes it in the multi-URL scrape during extraction.';
