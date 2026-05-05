-- Step 7.5 - add Avelo company news to Scout sources.
-- HTML-only press release feed (no public RSS).

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Avelo Airlines Company News',
  'https://www.aveloair.com/company-news',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Avelo press releases (HTML; no RSS). Use Firecrawl. Watch for new bases (TKI in late 2026), card or PLUS program changes, route announcements, network adjustments. Programs: avelo'
)
on conflict do nothing;
