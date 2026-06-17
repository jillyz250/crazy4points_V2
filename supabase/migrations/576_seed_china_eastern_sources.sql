insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('China Eastern Eastern Miles program', 'https://us.ceair.com/en/easternMiles/', 'official_partner', 1, true, true,
   'Eastern Miles program hub. JS-heavy -- tier detail did not render on scrape 2026-06-17; retry. SkyTeam member.', now(), now()),
  ('China Eastern SkyTeam member page', 'https://www.skyteam.com/en/about/china-eastern-airlines', 'official_partner', 2, true, true,
   'SkyTeam alliance benefits + tier mapping (Silver=Elite, Gold/Platinum=Elite Plus). Shanghai HQ.', now(), now()),
  ('UpgradedPoints Eastern Miles guide', 'https://upgradedpoints.com/travel/airlines/best-ways-to-earn-china-eastern-eastern-miles/', 'blog', 2, true, false,
   'Tier thresholds (Silver 20k/16seg, Gold 40k/32seg), bonuses (15/30/50%), expiry (36mo + 18mo activity), no US transfer partners, Marriott ended 2019.', now(), now())
on conflict do nothing;
