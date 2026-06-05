-- ============================================================================
-- 381 - Add Business Travel News (Air section) as a Claude Scout source.
-- Reputable B2B corporate-travel publication; strong early signal for airline /
-- hotel loyalty changes (it surfaced the Avianca Magno top-tier launch ahead of
-- the points blogs). type=blog, tier 2, daily, Firecrawl (JS-rendered).
-- ============================================================================
insert into sources (name, url, type, tier, scrape_frequency, use_firecrawl, is_active, notes)
values (
  'Business Travel News - Air',
  'https://www.businesstravelnews.com/Transportation/Air',
  'blog', 2, 'daily', true, true,
  'Corporate-travel news, airline section. Surfaced the Avianca Magno tier launch (2026-06). Good upstream signal for loyalty-program changes.'
);

select name, url, type, tier from sources where url ilike '%businesstravelnews%';
