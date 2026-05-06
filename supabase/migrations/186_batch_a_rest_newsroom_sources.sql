-- Step 7.5 - add press-room sources to Scout for the 8 Batch-A-rest programs.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes) values
  ('Iberia Press Room', 'https://grupo.iberia.com/en/press-room/', 'official_partner', 1, true, true, 'daily', 'Iberia press releases. Watch for award chart updates, route changes, status program updates. Programs: iberia'),
  ('Qatar Airways Press Releases', 'https://www.qatarairways.com/en/press-releases/', 'official_partner', 1, true, true, 'daily', 'Qatar press releases. Watch for Privilege Club program changes, Q Suite product updates, transfer-bonus promos. Programs: qatar'),
  ('Cathay Pacific Newsroom', 'https://news.cathaypacific.com/', 'official_partner', 1, true, true, 'daily', 'Cathay press releases. Watch for Asia Miles devaluations, status program changes, Aria Suites rollout. Programs: cathay'),
  ('JAL Press Room', 'https://press.jal.co.jp/en/', 'official_partner', 1, true, true, 'daily', 'JAL English press room. Watch for chart devaluations, transfer partner additions, JGC program updates. Programs: jal'),
  ('Lufthansa Group Newsroom', 'https://newsroom.lufthansagroup.com/en/', 'official_partner', 1, true, true, 'daily', 'Lufthansa Group news. Watch for Miles & More chart updates, dynamic pricing changes, Allegris rollout. Programs: miles-and-more'),
  ('Qantas Newsroom', 'https://www.qantasnewsroom.com.au/', 'official_partner', 1, true, true, 'daily', 'Qantas press releases. Watch for Classic Reward chart changes, status program updates, Project Sunrise. Programs: qantas'),
  ('Turkish Airlines Press Room', 'https://press.turkishairlines.com/en/', 'official_partner', 1, true, true, 'daily', 'Turkish press releases. Watch for Miles&Smiles devaluations, partner changes (e.g. ITA April 2026), new routes. Programs: turkish'),
  ('Virgin Atlantic Media', 'https://corporate.virginatlantic.com/gb/en/media.html', 'official_partner', 1, true, true, 'daily', 'Virgin Atlantic media room. Watch for Flying Club changes, ANA partnership updates, Delta JV news, fleet rollout. Programs: virgin-atlantic')
on conflict do nothing;
