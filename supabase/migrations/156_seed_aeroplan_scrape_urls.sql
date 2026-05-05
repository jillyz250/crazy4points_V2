-- Normalize air_canada slug to kebab-case + seed Aeroplan scrape_urls.
-- Aeroplan is the loyalty program; Air Canada is the operating carrier row.
-- Air Canada Aeroplan is one of the most-used flexible-currency transfer
-- targets for US readers (1:1 from Amex, Chase, Bilt, Cap One, Citi).

update programs set slug = 'air-canada' where slug = 'air_canada';
update programs set member_programs = replace(member_programs::text, '"air_canada"', '"air-canada"')::jsonb where member_programs::text ilike '%air_canada%';

update programs
set refresh_tier = 1,
    type = 'loyalty_program',
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.aircanada.com/ca/en/aco/home/aeroplan/legal/terms-and-conditions.html',
      'earn',     'https://www.aircanada.com/ca/en/aco/home/aeroplan/earn.html',
      'tiers',    'https://www.aircanada.com/ca/en/aco/home/aeroplan/status/tiers.html',
      'partners', 'https://www.aircanada.com/ca/en/aco/home/aeroplan/earn/everyday.html',
      'redeem',   'https://www.aircanada.com/ca/en/aco/home/aeroplan/redeem.html',
      'news',     'https://www.aircanada.com/media/'
    )
where slug = 'aeroplan';
