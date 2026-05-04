-- Fix scrape_urls for united, oneworld, hyatt based on validation pass.
--
-- United: 3 of 5 URLs were 404 (program-rules.html, premier-overview.html,
-- awards/award-travel.html). Replaced with the actual paths united.com
-- maintains today.
--
-- Oneworld: 3 of 5 URLs were 404 (/news/explorer, /lounges, /benefits).
-- Replaced with the canonical alliance paths.
--
-- Hyatt: world.hyatt.com is bot-blocked (403/Akamai) on every page.
-- Falling back to maintained third-party sources for change-detection.
-- Not as authoritative as official, but better than nothing for the
-- monthly diff. Long-term fix = headless browser scraper for Hyatt only.

update programs set scrape_urls = jsonb_build_object(
  'partners', 'https://www.united.com/en/us/fly/mileageplus/earn-miles/airline-partners.html',
  'chart',    'https://www.united.com/en/us/fly/mileageplus/use-miles.html',
  'tiers',    'https://www.united.com/en/us/fly/mileageplus/premier/benefits.html',
  'tc',       'https://www.united.com/en/us/fly/mileageplus/rules.html',
  'lounge',   'https://www.united.com/en/us/fly/travel/airport/lounge-access.html'
) where slug = 'united';

update programs set scrape_urls = jsonb_build_object(
  'members',       'https://www.oneworld.com/members',
  'award_rules',   'https://www.oneworld.com/round-the-world',
  'lounge_access', 'https://www.oneworld.com/airport-lounges',
  'tier_mapping',  'https://www.oneworld.com/travel-benefits',
  'news',          'https://www.oneworld.com/news'
) where slug = 'oneworld';

update programs set scrape_urls = jsonb_build_object(
  'brands',           'https://en.wikipedia.org/wiki/List_of_Hyatt_brands_and_properties',
  'chart',            'https://frequentmiler.com/world-of-hyatt-award-chart/',
  'tiers',            'https://awardwallet.com/blog/world-of-hyatt-elite-status-guide/',
  'earning_partners', 'https://upgradedpoints.com/travel/hotels/world-of-hyatt-transfer-partners/'
) where slug = 'hyatt';
-- Hyatt 'tc' field omitted: no fetch-friendly source exists. Manual paste
-- only. Drop the key entirely so the scraper doesn't waste a credit.
