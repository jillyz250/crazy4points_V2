-- Step 7.5 - add Singapore Airlines KrisFlyer programme updates page to Scout.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Singapore Airlines KrisFlyer Programme Updates',
  'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/KFupdates2025/',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Singapore Airlines KrisFlyer programme changes and enhancements page (HTML; Firecrawl-blocked on most singaporeair.com pages but worth trying daily). Watch for award chart updates, Access award rate changes, transfer-bonus promos, Spontaneous Escapes refreshes. Programs: krisflyer'
)
on conflict do nothing;
