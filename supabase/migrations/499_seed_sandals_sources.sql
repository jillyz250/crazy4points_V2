-- Seed sources for sandals so Claude Scout can monitor for program changes.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Island Insiders Club program overview', 'https://www.sandals.com/about/rewards-program/', 'official_partner', 1, true, true,
   'Authoritative source for tier thresholds, earn rates, bonus points, discount %s, and benefit table. Program rebranded from Sandals Select Rewards July 1, 2026.', now(), now()),
  ('Island Insiders Club T&C', 'https://www.sandals.com/my-account/terms', 'official_partner', 1, true, true,
   'Full program terms and conditions. Watch for changes to points expiry, redemption caps, tier qualification rules, and benefit eligibility.', now(), now()),
  ('Sandals program news', 'https://news.sandals.com/article/1870/', 'official_partner', 2, true, true,
   'Official announcement of Island Insiders Club rebrand (June 2026). Monitor for new tiers, benefits, or co-brand card changes.', now(), now()),
  ('Sandals and Beaches credit card page', 'https://www.sandals.com/sandalscard/', 'official_partner', 2, true, true,
   'Bank of America co-brand Visa. Monitor for earn rate changes, annual fee changes, or sign-up bonus updates.', now(), now())
on conflict do nothing;
