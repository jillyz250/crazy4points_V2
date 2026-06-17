-- Seed press-room and signal sources for Melia Rewards.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Melia Rewards Program Overview', 'https://www.melia.com/en/meliarewards', 'official_partner', 1, true, true,
   'Main MeliáRewards landing page. Watch for tier structure changes, new benefit additions, or partner announcements.', now(), now()),
  ('Melia Rewards Terms & Conditions', 'https://www.melia.com/en/meliarewards/terms-conditions', 'official_partner', 1, true, true,
   'Authoritative source for tier thresholds, earn rates, expiry rules, benefit conditions, transfer limits, excluded hotels. Updated December 2025.', now(), now()),
  ('Air Europa SUMA - Melia Partner Page', 'https://www.aireuropa.com/us/en/aea/suma/our-program/our-partners/hotels/melia.html', 'official_partner', 2, true, true,
   'Confirms Air Europa SUMA <-> Melia bidirectional transfer (3 Melia = 1 SUMA; 5 SUMA = 4 Melia). Watch for ratio changes.', now(), now()),
  ('Melia Rewards News', 'https://www.melia.com/en/meliarewards/news', 'official_partner', 1, true, true,
   'Official Melia Rewards news feed. Monitor for new airline partners, tier changes, promotional point sales, and program updates.', now(), now())
on conflict do nothing;
