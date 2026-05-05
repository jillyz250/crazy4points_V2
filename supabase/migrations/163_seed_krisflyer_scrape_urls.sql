-- Seed KrisFlyer scrape_urls + reclassify as loyalty_program.
-- Singapore Airlines (singapore_airlines slug) is the operating-carrier row;
-- KrisFlyer (krisflyer slug) is the loyalty program.

update programs
set refresh_tier = 1,
    type = 'loyalty_program',
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/termsconditions-kf/',
      'earn',     'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/',
      'tiers',    'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/ppsclub/ppsclub-qualification/',
      'redeem',   'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/redeem-miles/',
      'partners', 'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/redeem-miles/award-tickets-on-partner-airlines/',
      'news',     'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/KFupdates2025/'
    )
where slug = 'krisflyer';
