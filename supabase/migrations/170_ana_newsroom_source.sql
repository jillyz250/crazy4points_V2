-- Step 7.5 - add ANA Group news to Scout sources.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'ANA Group News',
  'https://www.ana.co.jp/group/en/news/',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'ANA corporate news (HTML; some ana.co.jp pages can be Firecrawl-blocked, retry pattern). Watch for award chart updates, fuel surcharge changes, new partner additions, status program changes. Programs: ana'
)
on conflict do nothing;
