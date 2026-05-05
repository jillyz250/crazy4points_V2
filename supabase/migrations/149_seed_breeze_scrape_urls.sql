-- Seed programs.scrape_urls for Breeze Airways Breezy Rewards.
--
-- URLs verified via WebSearch site:flybreeze.com 2026-05-05.
--
-- Breeze launched a major program revamp on January 1, 2026 introducing
-- four elite tiers (Breezy 1, 2, 3, Club). Standalone carrier - no
-- alliance, no lounges. Co-brand: Breeze Easy Visa Signature (Barclays,
-- launched 2024). The official T&C is a PDF; we point 'tc' at the
-- HTML rewards info page (the PDF can be linked from the source doc).

update programs
set refresh_tier = 2,
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.flybreeze.com/breezy-rewards-info',
      'earn',     'https://www.flybreeze.com/breezy-rewards-info',
      'card',     'https://cards.barclaycardus.com/banking/cards/breeze-airways/',
      'partners', 'https://www.flybreeze.com/breezy-rewards-info',
      'news',     'https://www.flybreeze.com/news'
    )
where slug = 'breeze';
