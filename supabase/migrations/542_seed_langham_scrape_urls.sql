-- Seed scrape_urls for Brilliant by Langham so research-program.mjs can pull official pages.
-- Brilliant by Langham (launched 2024): 5 tiers Onyx/Topaz/Diamond/Sapphire/Ruby.
-- Dual points: Award Points (redeem) + Status Points (tier qualification). Converts to airline miles.

update programs set
  scrape_urls = '{
    "about": "https://www.brilliantbylangham.com/en/about-brilliant",
    "benefits": "https://www.brilliantbylangham.com/en/member-benefits",
    "faq": "https://www.brilliantbylangham.com/en/faq",
    "earn": "https://www.brilliantbylangham.com/en/earn-and-redeem"
  }'::jsonb,
  updated_at = now()
where slug = 'langham';
