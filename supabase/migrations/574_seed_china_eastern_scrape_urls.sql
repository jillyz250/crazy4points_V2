update programs set
  scrape_urls = '{
    "main": "https://www.skyteam.com/en/about/china-eastern-airlines",
    "program": "https://us.ceair.com/en/easternMiles/",
    "tiers": "https://us.ceair.com/en/easternMiles/memberLevel/"
  }'::jsonb,
  updated_at = now()
where slug = 'china-eastern';
