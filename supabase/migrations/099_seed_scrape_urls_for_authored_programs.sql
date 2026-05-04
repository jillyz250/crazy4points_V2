-- Backfill programs.scrape_urls + refresh_tier for the 14 programs we've
-- authored so far (atmos already seeded via migration 097 round).
--
-- URLs proposed from training knowledge + last-session scrape memory.
-- Failures will be caught by scrape-all.mjs and retried with alternates
-- in a follow-up migration.
--
-- AA + Southwest are Firecrawl-blocked at the vendor (per 2026-05-04 testing)
-- but URLs are stored anyway so the auto-refresh still records `firecrawl_blocked`
-- status — surfaces the gap, doesn't hide it.

-- ============================================================
-- Tier 1 (monthly refresh)
-- ============================================================

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'partners', 'https://www.delta.com/us/en/skymiles/how-to-earn-miles/airline-partners',
  'chart',    'https://www.delta.com/us/en/skymiles/how-to-use-miles/award-travel',
  'tiers',    'https://www.delta.com/us/en/skymiles/medallion-program/medallion-program-overview',
  'tc',       'https://www.delta.com/us/en/skymiles/program-rules-conditions/program-rules',
  'lounge',   'https://www.delta.com/us/en/sky-club/access-options'
) where slug = 'delta';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'partners', 'https://www.united.com/en/us/fly/mileageplus/earn-miles/airline-partners.html',
  'chart',    'https://www.united.com/en/us/fly/mileageplus/awards/award-travel.html',
  'tiers',    'https://www.united.com/en/us/fly/mileageplus/premier/premier-overview.html',
  'tc',       'https://www.united.com/en/us/fly/mileageplus/program-rules.html',
  'lounge',   'https://www.united.com/en/us/fly/travel/airport/lounge-access.html'
) where slug = 'united';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'partners', 'https://www.aa.com/i18n/aadvantage-program/miles/earn/airline-partners.jsp',
  'chart',    'https://www.aa.com/i18n/aadvantage-program/miles/use/award-travel.jsp',
  'tiers',    'https://www.aa.com/i18n/aadvantage-program/elite-status/aadvantage-elite-status.jsp',
  'tc',       'https://www.aa.com/i18n/aadvantage-program/program-information/aadvantage-terms-conditions.jsp',
  'lounge',   'https://www.aa.com/i18n/travel-info/admirals-club/admirals-club.jsp'
) where slug = 'aa';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'partners', 'https://www.southwest.com/rapidrewards/earn',
  'chart',    'https://www.southwest.com/rapidrewards/use',
  'tiers',    'https://www.southwest.com/rapidrewards/a-list',
  'tc',       'https://www.southwest.com/rapidrewards/program-rules',
  'lounge',   'https://www.southwest.com/help/changes-and-cancellations'
) where slug = 'southwest';

-- alaska + hawaiian share atmos URLs (joint program); per-carrier rows
-- get the same URL set so per-program timeline still works.
update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'partners', 'https://www.alaskaair.com/atmosrewards/content/partners/airlines',
  'chart',    'https://www.alaskaair.com/atmosrewards/content/use-points/award-charts',
  'tiers',    'https://www.alaskaair.com/atmosrewards/content/tiers',
  'tc',       'https://www.alaskaair.com/atmosrewards/content/program-rules',
  'lounge',   'https://www.alaskaair.com/atmosrewards/content/benefits/lounges'
) where slug in ('alaska', 'hawaiian');

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'brands',           'https://world.hyatt.com/content/gp/en/our-brands.html',
  'chart',            'https://world.hyatt.com/content/gp/en/rates/award-categories.html',
  'tiers',            'https://world.hyatt.com/content/gp/en/member-benefits.html',
  'tc',               'https://world.hyatt.com/content/gp/en/terms.html',
  'earning_partners', 'https://world.hyatt.com/content/gp/en/earn-points/transfer-points.html'
) where slug = 'hyatt';

update programs set refresh_tier = 1, scrape_urls = jsonb_build_object(
  'members',       'https://www.oneworld.com/members',
  'award_rules',   'https://www.oneworld.com/news/explorer',
  'lounge_access', 'https://www.oneworld.com/lounges',
  'tier_mapping',  'https://www.oneworld.com/benefits',
  'news',          'https://www.oneworld.com/news'
) where slug = 'oneworld';

-- ============================================================
-- Tier 2 (quarterly refresh)
-- ============================================================

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'partners', 'https://www.jetblue.com/trueblue/partners',
  'chart',    'https://www.jetblue.com/trueblue/use-points',
  'tiers',    'https://www.jetblue.com/trueblue/mosaic',
  'tc',       'https://www.jetblue.com/legal/trueblue',
  'lounge',   'https://www.jetblue.com/at-the-airport'
) where slug = 'jetblue';

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'chart',    'https://www.flyingblue.com/en/spend/airline',
  'tiers',    'https://www.flyingblue.com/en/elite-status',
  'tc',       'https://www.flyingblue.com/en/program-rules',
  'lounge',   'https://www.flyingblue.com/en/elite-benefits'
) where slug = 'flying_blue';

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'chart',    'https://www.airfrance.us/US/en/local/loyalty/awardticket.htm',
  'tiers',    'https://www.airfrance.us/US/en/local/loyalty/elitestatus.htm',
  'tc',       'https://www.airfrance.us/US/en/common/transverse/footer/cgu.htm',
  'lounge',   'https://www.airfrance.us/US/en/common/voyage/aeroport/salons.htm'
) where slug = 'air_france';

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'partners', 'https://www.flyingblue.com/en/earn/airline',
  'chart',    'https://www.klm.com/information/flyingblue',
  'tiers',    'https://www.klm.com/information/flyingblue/elite-status',
  'tc',       'https://www.klm.com/information/legal/conditions-flying-blue',
  'lounge',   'https://www.klm.com/information/services/airport/lounges'
) where slug = 'klm';

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'members',       'https://www.skyteam.com/en/about/members',
  'award_rules',   'https://www.skyteam.com/en/round-the-world-planner',
  'lounge_access', 'https://www.skyteam.com/en/lounges',
  'tier_mapping',  'https://www.skyteam.com/en/about/membership-benefits',
  'news',          'https://www.skyteam.com/en/about/press-releases'
) where slug = 'skyteam';

update programs set refresh_tier = 2, scrape_urls = jsonb_build_object(
  'members',       'https://www.staralliance.com/en/member-airlines',
  'award_rules',   'https://www.staralliance.com/en/round-the-world',
  'lounge_access', 'https://www.staralliance.com/en/lounge-access',
  'tier_mapping',  'https://www.staralliance.com/en/status-benefits',
  'news',          'https://www.staralliance.com/en/news'
) where slug = 'star_alliance';
