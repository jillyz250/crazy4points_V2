-- Seed sources for Stash Hotel Rewards so Claude Scout can monitor for program changes.
-- All primary data scraped via Firecrawl from official stashrewards.com pages.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Stash Hotel Rewards how-it-works', 'https://www.stashrewards.com/how-stash-works', 'official_partner', 1, true, true,
   'Program overview: earn 5 pts/$1, no blackout, no expiry, redeem at any partner hotel. Flat program, no tiers.', now(), now()),
  ('Stash Hotel Rewards FAQ', 'https://www.stashrewards.com/questions', 'official_partner', 1, true, true,
   'Authoritative: earn rate, eligible rates, redemption mechanic (dynamic, full points only), expiry (none), 2-room + 29-night caps, no third-party earning, no transfers/combine, book-for-others rule.', now(), now()),
  ('Stash Hotel Rewards terms', 'https://www.stashrewards.com/terms', 'official_partner', 1, true, true,
   'Full program terms: eligible-rate definitions, qualifying-rate exclusions, redemption rules. Monitor for earn-rate or rule changes.', now(), now()),
  ('Stash Hotel Rewards hotels list', 'https://www.stashrewards.com/hotels', 'official_partner', 2, true, true,
   'Current Stash Partner Hotel roster (independent hotels, US/Mexico/Canada/Caribbean). Source for hotel_properties seeding + network-size monitoring.', now(), now())
on conflict do nothing;
