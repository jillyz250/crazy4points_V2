-- Round 2 scrape_urls fixes after Tier 2 validation pass.
--
-- Findings:
-- - flyingblue.com is fully SPA — fetch returns 616-char shell. The same
--   content is mirrored on wwws.airfrance.us (note the trailing s) which
--   is server-rendered. Routing Flying Blue topics there.
-- - jetblue.com has consolidated TrueBlue content into a few SPA hubs;
--   only /help/earning-points is server-rendered with real content.
--   Dropping chart + partners (no scrapable canonical), replacing tc with
--   points.com hosted T&Cs, adding `earning` key.
-- - air_france + klm: revenue-based / dynamic pricing — no award chart
--   exists. Dropping chart key for both.
-- - skyteam round-the-world-planner has been retired; replaced with the
--   /frequent-flyers/ hub.
-- - hyatt tiers: AwardWallet URL was 404; replaced with upgradedpoints.com
--   which is server-rendered + maintained.

update programs set scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'chart',    'https://www.flyingblue.com/en/spend/airline',
  'tiers',    'https://wwws.airfrance.us/information/flyingblue/statuts-flying-blue',
  'tc',       'https://wwws.airfrance.us/information/legal/edito-cg-flying-blue',
  'lounge',   'https://wwws.airfrance.us/information/flyingblue/avantages-flying-blue-platinum'
) where slug = 'flying_blue';

update programs set scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'tc',       'https://wwws.airfrance.us/information/legal/edito-cg-flying-blue',
  'tiers',    'https://wwws.airfrance.us/information/flyingblue/statuts-flying-blue',
  'lounge',   'https://wwws.airfrance.fr/en/information/prepare/salons'
) where slug = 'air_france';
-- air_france 'chart' dropped — no static award chart (revenue-based).

update programs set scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'tc',       'https://wwws.airfrance.us/information/legal/edito-cg-flying-blue',
  'tiers',    'https://wwws.airfrance.us/information/flyingblue/statuts-flying-blue',
  'lounge',   'https://wwws.airfrance.fr/en/information/prepare/salons'
) where slug = 'klm';
-- klm 'chart' dropped — revenue-based. Routed all topics to airfrance.us
-- since www.klm.com is bot-blocked.

update programs set scrape_urls = jsonb_build_object(
  'tiers',   'https://www.jetblue.com/trueblue/mosaic',
  'lounge',  'https://www.jetblue.com/at-the-airport',
  'tc',      'https://buy.points.com/marketing/jetblue/terms-and-conditions-en.html',
  'earning', 'https://www.jetblue.com/help/earning-points'
) where slug = 'jetblue';
-- jetblue 'chart' + 'partners' dropped — both are SPA shells. Replaced
-- with 'earning' which is the only server-rendered TrueBlue page.

update programs set scrape_urls = jsonb_build_object(
  'members',       'https://www.skyteam.com/en/about/',
  'award_rules',   'https://www.skyteam.com/en/frequent-flyers/',
  'lounge_access', 'https://www.skyteam.com/en/lounges',
  'tier_mapping',  'https://www.skyteam.com/en/about/faq/elite-elite-plus',
  'news',          'https://www.skyteam.com/en/about/press-releases'
) where slug = 'skyteam';

update programs set scrape_urls = jsonb_build_object(
  'brands',           'https://en.wikipedia.org/wiki/List_of_Hyatt_brands_and_properties',
  'chart',            'https://frequentmiler.com/world-of-hyatt-award-chart/',
  'tiers',            'https://upgradedpoints.com/travel/hotels/hyatt-elite-status-benefits/',
  'earning_partners', 'https://upgradedpoints.com/travel/hotels/world-of-hyatt-transfer-partners/'
) where slug = 'hyatt';
