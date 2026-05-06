-- Seed scrape_urls for the remaining 8 Batch A international long-haul programs.
--
-- Programs covered (in authoring order):
--   iberia          — Iberia Plus / Avios (oneworld)
--   cathay          — Cathay Pacific Asia Miles (oneworld)
--   jal             — JAL Mileage Bank (oneworld)
--   qantas          — Qantas Frequent Flyer (oneworld)
--   qatar           — Qatar Privilege Club (oneworld; uses Avios since 2023 rebrand)
--   virgin-atlantic — Virgin Atlantic Flying Club (SkyTeam)
--   turkish         — Turkish Miles&Smiles (Star Alliance)
--   miles-and-more  — Lufthansa Miles & More (Star Alliance)
--
-- Also renames underscore slugs to kebab convention + reclassifies as
-- loyalty_program where appropriate. Member-program JSON references are
-- updated to the new slugs.

-- ============================================================
-- 1. Slug renames (kebab convention)
-- ============================================================
update programs set slug = 'cathay-pacific'   where slug = 'cathay_pacific';
update programs set slug = 'qatar-airways'    where slug = 'qatar_airways';
update programs set slug = 'virgin-atlantic'  where slug = 'virgin_atlantic';
update programs set slug = 'miles-and-more'   where slug = 'miles_and_more';

-- Update any member_programs JSONB references to the new kebab slugs
update programs set member_programs = replace(replace(replace(replace(member_programs::text,
    '"cathay_pacific"',  '"cathay-pacific"'),
    '"qatar_airways"',   '"qatar-airways"'),
    '"virgin_atlantic"', '"virgin-atlantic"'),
    '"miles_and_more"',  '"miles-and-more"')::jsonb
where member_programs::text ~ 'cathay_pacific|qatar_airways|virgin_atlantic|miles_and_more';

-- ============================================================
-- 2. Reclassify loyalty programs (where the row is the program, not the carrier)
-- ============================================================
update programs set type = 'loyalty_program' where slug in ('iberia','cathay','jal','qantas','qatar','virgin-atlantic','turkish','miles-and-more');

-- ============================================================
-- 3. Seed scrape_urls for each program
-- ============================================================

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.iberia.com/us/iberia-plus/iberia-plus-conditions/',
  'earn',     'https://www.iberia.com/us/iberia-plus/earn-avios/',
  'tiers',    'https://www.iberia.com/us/iberia-plus/levels-and-benefits/',
  'redeem',   'https://www.iberia.com/us/iberia-plus/spend-avios/',
  'partners', 'https://www.iberia.com/us/iberia-plus/airlines-partners/',
  'news',     'https://grupo.iberia.com/en/press-room/'
) where slug = 'iberia';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.cathaypacific.com/cx/en_US/about-us/legal-disclaimer/asia-miles-program-rules.html',
  'earn',     'https://www.asiamiles.com/en/earn-redeem/earn.html',
  'tiers',    'https://www.cathaypacific.com/cx/en_US/membership/cathay-membership/become-a-member.html',
  'redeem',   'https://www.asiamiles.com/en/earn-redeem/redeem.html',
  'partners', 'https://www.asiamiles.com/en/earn-redeem/airline-partners.html',
  'news',     'https://news.cathaypacific.com/'
) where slug = 'cathay';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.jal.co.jp/jalmile/rules.html',
  'earn',     'https://www.us.jal.co.jp/us/en/jalmile/earning/',
  'tiers',    'https://www.us.jal.co.jp/us/en/jmb/status/',
  'redeem',   'https://www.us.jal.co.jp/us/en/jalmile/use/',
  'partners', 'https://www.us.jal.co.jp/us/en/jalmile/partner/airline/',
  'news',     'https://press.jal.co.jp/en/'
) where slug = 'jal';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.qantas.com/us/en/frequent-flyer/discover-and-join/membership-conditions.html',
  'earn',     'https://www.qantas.com/us/en/frequent-flyer/earn-points.html',
  'tiers',    'https://www.qantas.com/us/en/frequent-flyer/your-status.html',
  'redeem',   'https://www.qantas.com/us/en/frequent-flyer/use-points.html',
  'partners', 'https://www.qantas.com/us/en/frequent-flyer/use-points/use-points-for-flights/partner-airlines.html',
  'news',     'https://www.qantasnewsroom.com.au/'
) where slug = 'qantas';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.qatarairways.com/en/privilege-club/legal/program-rules.html',
  'earn',     'https://www.qatarairways.com/en/privilege-club/earn-avios.html',
  'tiers',    'https://www.qatarairways.com/en/privilege-club/tier.html',
  'redeem',   'https://www.qatarairways.com/en/privilege-club/spend-avios.html',
  'partners', 'https://www.qatarairways.com/en/privilege-club/airline-partners.html',
  'news',     'https://www.qatarairways.com/en/press-releases/'
) where slug = 'qatar';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.virginatlantic.com/us/en/flying-club/terms-and-conditions.html',
  'earn',     'https://www.virginatlantic.com/us/en/flying-club/earning-miles/with-virgin-atlantic.html',
  'tiers',    'https://www.virginatlantic.com/us/en/flying-club/tiers.html',
  'redeem',   'https://www.virginatlantic.com/us/en/flying-club/spend-miles.html',
  'partners', 'https://www.virginatlantic.com/us/en/flying-club/earning-miles/our-partners.html',
  'news',     'https://corporate.virginatlantic.com/gb/en/media.html'
) where slug = 'virgin-atlantic';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.turkishairlines.com/en-us/miles-and-smiles/program-rules/',
  'earn',     'https://www.turkishairlines.com/en-us/miles-and-smiles/earn-miles/',
  'tiers',    'https://www.turkishairlines.com/en-us/miles-and-smiles/elite-program/',
  'redeem',   'https://www.turkishairlines.com/en-us/miles-and-smiles/use-miles/',
  'partners', 'https://www.turkishairlines.com/en-us/miles-and-smiles/airline-partners/',
  'news',     'https://press.turkishairlines.com/en/'
) where slug = 'turkish';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'tc',       'https://www.miles-and-more.com/us/en/general/legal-information.html',
  'earn',     'https://www.miles-and-more.com/us/en/earn/airlines.html',
  'tiers',    'https://www.miles-and-more.com/us/en/status/become-a-status-customer.html',
  'redeem',   'https://www.miles-and-more.com/us/en/spend/flights.html',
  'partners', 'https://www.miles-and-more.com/us/en/earn/airlines/partner-airlines.html',
  'news',     'https://newsroom.lufthansagroup.com/en/'
) where slug = 'miles-and-more';
