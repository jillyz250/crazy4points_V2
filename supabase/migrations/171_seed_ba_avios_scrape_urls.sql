-- Rename underscore slugs to kebab + reclassify ba-avios as loyalty_program.
-- Seed scrape_urls for The British Airways Club (rebranded from Executive
-- Club in December 2024).

update programs set slug = 'ba-avios' where slug = 'ba_avios';
update programs set slug = 'british-airways' where slug = 'british_airways';

update programs
set refresh_tier = 1,
    type = 'loyalty_program',
    scrape_urls = jsonb_build_object(
      'tc',       'https://britishairways.com/en-us/executive-club/terms-and-conditions/conditions-of-use',
      'earn',     'https://www.britishairways.com/content/en/us/executive-club/avios/collecting-avios/flights',
      'tiers',    'https://www.britishairways.com/content/the-british-airways-club/about-the-club/tiers-and-benefits',
      'redeem',   'https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/flights',
      'partners', 'https://www.britishairways.com/content/en/us/the-british-airways-club/avios/collecting-avios/lifestyle',
      'news',     'https://mediacentre.britishairways.com/'
    )
where slug = 'ba-avios';
