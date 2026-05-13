-- 250_backfill_partner_chart_urls.sql
-- Backfill programs.partner_chart_url for 8 programs that have an
-- actual published award chart on their own domain.
--
-- Verification process (2026-05-13):
--   1. WebSearch found candidate URLs on each program's domain
--   2. Firecrawl scraped each (scripts/verify-chart-urls.mjs) and
--      flagged YES/MAYBE/NO based on table count + chart-number density
--   3. Curator (Jill) manually spot-checked any MAYBE
--   4. Only confirmed-chart URLs ship in this migration
--
-- Source policy: official program-domain URL only. No blogs, no
-- aggregators. Each URL was manually opened by the curator to confirm
-- it actually shows a chart (not just marketing or a calculator).
--
-- NOT included (verified to have no chart — dynamic pricing or
-- promo-only programs):
--   united, avianca, flying-blue, aegean, air-china, emirates,
--   etihad, latam — left NULL, no source link rendered.
--
-- Authored: 2026-05-13

begin;

update programs set partner_chart_url = 'https://www.aerlingus.com/media/pdfs/EI_routes_avios_amounts.pdf'
  where slug = 'aer-lingus';

update programs set partner_chart_url = 'https://www.finnair.com/us-en/finnair-plus/collect-and-use-avios/use-avios-on-award-flights-with-partners'
  where slug = 'finnair';

update programs set partner_chart_url = 'https://www.velocityfrequentflyer.com/flying-status/use-points-for-flights'
  where slug = 'virgin-australia';

update programs set partner_chart_url = 'https://www.aeromexico.com/en-us/aeromexico-rewards/award-ticket'
  where slug = 'aeromexico';

update programs set partner_chart_url = 'https://www.saudia.com/loyalty-program/about-alfursan-program/alfursan-miles/miles-redemption/skyteam-reward-table'
  where slug = 'saudia';

update programs set partner_chart_url = 'https://www.thaiairways.com/static/common/pdf/royal_orchid_plus/Redeeming/Star_Alliance_Chart2.pdf'
  where slug = 'thai';

update programs set partner_chart_url = 'https://flyasiana.com/C/US/EN/contents/star-alliance-mileage-tickets'
  where slug = 'asiana';

update programs set partner_chart_url = 'https://www.evaair.com/en-us/infinity-mileagelands/mileage-award-program/mileage-redemption/'
  where slug = 'eva-air';

commit;

-- Verify
select slug, name, partner_chart_url
from programs
where slug in ('aer-lingus','finnair','virgin-australia','aeromexico','saudia','thai','asiana','eva-air')
order by slug;
