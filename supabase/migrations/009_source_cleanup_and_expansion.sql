-- Source pipeline cleanup + expansion (Apr 20, 2026)
--
-- Findings from Apr 20 audit:
-- • All 37 Google Alert RSS feeds are empty. Google phased out RSS delivery
--   for new alerts — email digest is the only option now. Pausing these rows
--   until email ingestion ships (Phase 6).
-- • Zero official_partner sources have ever produced intel because
--   use_firecrawl was never flipped on. Most program pages are JS-heavy and
--   plain fetch returns near-empty HTML.
-- • LoyaltyLobby appears in intel findings (Haiku cites it from embedded
--   quotes in other feeds) but is not a seeded source, so the counter misses.
-- • Major programs are missing from official sources (Alaska, Hilton, IHG,
--   Aeroplan, Virgin Atlantic, BA, Flying Blue).
-- • Several well-regarded trusted blogs aren't in the RSS rotation.

-- 1) Pause Google Alert RSS feeds until email ingestion ships.
UPDATE sources
SET is_active = false,
    updated_at = now()
WHERE notes = 'Google Alert RSS';

-- 2) Flip Firecrawl on for JS-heavy official program pages.
UPDATE sources
SET use_firecrawl = true,
    updated_at = now()
WHERE type = 'official_partner';

-- 3) Add LoyaltyLobby as a blog RSS source (Haiku is already citing it).
INSERT INTO sources (name, url, type, tier, is_active, scrape_frequency, notes, use_firecrawl) VALUES
('LoyaltyLobby', 'https://loyaltylobby.com/feed/', 'blog', 2, true, 'daily', 'RSS feed — Finnish blog with strong coverage of European programs', false)
ON CONFLICT DO NOTHING;

-- 4) Expand trusted blog RSS coverage.
INSERT INTO sources (name, url, type, tier, is_active, scrape_frequency, notes, use_firecrawl) VALUES
('Miles Talk',             'https://milestalk.com/feed/',             'blog', 2, true, 'daily', 'RSS feed',                                  false),
('Prince of Travel',       'https://princeoftravel.com/feed/',        'blog', 2, true, 'daily', 'RSS feed — Canadian travel rewards focus',  false),
('God Save the Points',    'https://godsavethepoints.com/feed/',      'blog', 2, true, 'daily', 'RSS feed',                                  false),
('Live and Let''s Fly',    'https://liveandletsfly.com/feed/',        'blog', 2, true, 'daily', 'RSS feed',                                  false)
ON CONFLICT DO NOTHING;

-- 5) Add missing tier-1 official program pages (Firecrawl-enabled).
INSERT INTO sources (name, url, type, tier, is_active, scrape_frequency, notes, use_firecrawl) VALUES
('Alaska Mileage Plan',            'https://www.alaskaair.com/content/mileage-plan',                 'official_partner', 1, true, 'daily', 'Alaska miles program',                         true),
('Hilton Honors',                  'https://www.hilton.com/en/hilton-honors/',                        'official_partner', 1, true, 'daily', 'Hilton points + promos',                       true),
('IHG One Rewards',                'https://www.ihg.com/onerewards/content/us/en/home',               'official_partner', 1, true, 'daily', 'IHG points + promos',                          true),
('Air Canada Aeroplan',            'https://www.aircanada.com/us/en/aco/home/aeroplan.html',          'official_partner', 1, true, 'daily', 'Aeroplan miles program',                       true),
('Virgin Atlantic Flying Club',    'https://www.virginatlantic.com/flyingclub/en/home.html',          'official_partner', 1, true, 'daily', 'Virgin Atlantic miles + partner promos',       true),
('British Airways Executive Club', 'https://www.britishairways.com/en-us/executive-club',             'official_partner', 1, true, 'daily', 'BA Avios + partner promos',                    true),
('Air France Flying Blue',         'https://wwws.airfrance.us/information/flyingblue',                'official_partner', 1, true, 'daily', 'Flying Blue miles + promo rewards calendar',   true)
ON CONFLICT DO NOTHING;
