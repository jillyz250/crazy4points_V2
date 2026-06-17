-- Seed sources for Virgin Red so Claude Scout can monitor for program changes.
-- Primary data scraped via Firecrawl from official virgin.com/virgin-red + Virgin Red member support.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Virgin Red main page', 'https://www.virgin.com/virgin-red', 'official_partner', 1, true, true,
   'Program overview: what Virgin Red is, earn/spend ecosystem, Flying Club linking, points-do-not-expire, free to join (UK/US 18+).', now(), now()),
  ('Virgin Red member support -- points expiry', 'https://membersupport.red.virgin.com/hc/en-gb/articles/360013901058-How-long-before-my-Virgin-Points-expire', 'official_partner', 1, true, true,
   'AUTHORITATIVE on expiry: "your Virgin Points will never expire." Resolves conflicting secondary claims of a 36-month rolling policy.', now(), now()),
  ('Virgin Red member support -- Virgin Points section', 'https://membersupport.red.virgin.com/hc/en-gb/sections/360004037917-Virgin-Points', 'official_partner', 2, true, true,
   'Virgin Points FAQ hub: buy points, gift/transfer rules, Flying Club linking, value. Monitor for transfer-out and gifting policy changes.', now(), now()),
  ('Virgin Red earn page', 'https://www.virgin.com/virgin-red/earn', 'official_partner', 2, true, true,
   'Ways to earn (150+ partners). JS-rendered -- thin via static scrape; monitor partner roster.', now(), now()),
  ('Virgin Red spend page', 'https://www.virgin.com/virgin-red/spend', 'official_partner', 2, true, true,
   'Lifestyle reward catalog (200+ offers). JS-rendered -- thin via static scrape.', now(), now())
on conflict do nothing;
