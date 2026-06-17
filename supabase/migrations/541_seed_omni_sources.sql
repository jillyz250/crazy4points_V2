-- Seed sources for Omni Select Guest so Claude Scout can monitor for program changes.
-- All primary data scraped successfully via Firecrawl from official omnihotels.com pages.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Omni Select Guest main loyalty page', 'https://www.omnihotels.com/loyalty', 'official_partner', 1, true, true,
   'Main Select Guest program page. Firecrawl-scrapable. Program overview, free night value prop.', now(), now()),
  ('Omni Select Guest member tiers', 'https://www.omnihotels.com/loyalty/member-tiers', 'official_partner', 1, true, true,
   'Authoritative tier thresholds (Member/Insider/Champion/Icon), earn rates per night and per $100, and per-tier benefit lists.', now(), now()),
  ('Omni Select Guest member benefits matrix', 'https://www.omnihotels.com/loyalty/member-benefits', 'official_partner', 1, true, true,
   'Full benefits grid (Wi-Fi tier, water, beverages, pressing, welcome amenity, check-in/out, room upgrades). Revised January 2024. Has PDF link (sg-benefits-grid.pdf).', now(), now()),
  ('Omni Select Guest FAQ', 'https://www.omnihotels.com/loyalty/faq', 'official_partner', 1, true, true,
   'Tier Dollar definition + qualifying charges, Omni Credit earning rules, 100-credit Free Night redemption, 36-month credit expiry, fee waivers, 2024 relaunch + legacy conversion. Most data-dense page.', now(), now()),
  ('Omni Select Guest terms and conditions', 'https://www.omnihotels.com/loyalty/terms-and-conditions', 'official_partner', 2, true, true,
   'Full program T&C. Monitor for changes to redemption rules, expiry, qualifying-rate exclusions.', now(), now()),
  ('Omni Select Guest blackout dates', 'https://www.omnihotels.com/loyalty/blackout-dates', 'official_partner', 2, true, true,
   'Free Night and guaranteed-room-availability blackout dates. Monitor seasonally.', now(), now())
on conflict do nothing;
