-- Seed scrape_urls for Virgin Red so research-program.mjs can pull official pages.
-- Virgin Red = the Virgin rewards club; currency is Virgin Points, SHARED with Virgin Atlantic
-- Flying Club (link accounts to pool). Fed by 8 US bank transfer partners (mostly 1:1).

update programs set
  scrape_urls = '{
    "main": "https://www.virgin.com/virgin-red",
    "expiry": "https://membersupport.red.virgin.com/hc/en-gb/articles/360013901058-How-long-before-my-Virgin-Points-expire",
    "earn": "https://www.virgin.com/virgin-red/earn",
    "spend": "https://www.virgin.com/virgin-red/spend"
  }'::jsonb,
  updated_at = now()
where slug = 'virgin-red';
