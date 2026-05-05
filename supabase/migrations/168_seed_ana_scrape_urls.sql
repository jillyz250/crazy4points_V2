-- Seed ANA Mileage Club scrape_urls + reclassify as loyalty_program.
-- Star Alliance member; hubs HND + NRT.

update programs
set refresh_tier = 1,
    type = 'loyalty_program',
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.ana.co.jp/en/us/amc/terms-and-conditions/',
      'redeem',   'https://www.ana.co.jp/en/us/amc/international-flight-awards/',
      'partners', 'https://www.ana.co.jp/en/us/amc/partner-flight-awards/',
      'tiers',    'https://www.ana.co.jp/en/us/amc/premium-members/',
      'earn',     'https://www.ana.co.jp/en/us/amc/premium-members/premium-points/',
      'news',     'https://www.ana.co.jp/group/en/news/'
    )
where slug = 'ana';
