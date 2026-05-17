-- Seed the experience_programs table with the 2026 active programs identified
-- via Copilot research (verified against issuer URLs 2026-05-17).
--
-- Pattern A (issuer_wide): 5 programs
-- Pattern B (loyalty): 5 programs
-- Pattern C (card_specific): 8 programs (no junction inserts here — those land
-- in a separate migration so the links are reviewable independently)

-- ── A. ISSUER-WIDE ──────────────────────────────────────────────────────────

insert into experience_programs (slug, name, official_url, description, category, issuer_slug, last_verified) values
('chase-experiences', 'Chase Experiences',
 'https://experiences.chase.com/',
 'Chase''s cardmember-exclusive events portal — dining series, chef collaborations, concerts, sports, cultural events. Open to all Chase consumer credit cardholders.',
 'issuer_wide', 'chase', current_date),

('amex-experiences', 'American Express Experiences',
 'https://www.americanexpress.com/us/entertainment/',
 'Amex''s entertainment portal — presales, preferred seating on concerts, sports, and Broadway. Available to U.S. Amex cardholders.',
 'issuer_wide', 'amex', current_date),

('citi-entertainment', 'Citi Entertainment',
 'https://www.citientertainment.com/',
 'Citi''s exclusive ticket presales, preferred seating, dining events, and sports access. Available to all Citi credit cardholders.',
 'issuer_wide', 'citi', current_date),

('capital-one-entertainment', 'Capital One Entertainment',
 'https://www.capitalone.com/entertainment/',
 'Capital One''s concerts, sports, and VIP-package portal. Available to most Capital One cardholders (Venture, Venture X, Savor, Quicksilver).',
 'issuer_wide', 'capital-one', current_date),

('boa-preferred-seating', 'Bank of America Preferred Seating (Live Nation)',
 'https://www.bankofamerica.com/credit-cards/preferred-seating/',
 'Bank of America''s Live Nation partnership — ticket presales and preferred-seating sections at concerts and venues. Available to all BoA credit/debit cardholders.',
 'issuer_wide', 'bank-of-america', current_date);

-- ── B. LOYALTY (anchor by currency_program slug) ────────────────────────────

insert into experience_programs (slug, name, official_url, description, category, currency_program_slug, last_verified) values
('marriott-bonvoy-moments', 'Marriott Bonvoy Moments',
 'https://moments.marriottbonvoy.com/',
 'Marriott''s auction + fixed-price experiences portal — culinary, sports, concerts, travel packages. Open to anyone earning Marriott Bonvoy points (most cobrand cards qualify).',
 'loyalty', 'marriott-bonvoy', current_date),

('hyatt-find-experiences', 'World of Hyatt FIND Experiences',
 'https://world.hyatt.com/content/gp/en/find.html',
 'Hyatt''s curated experiences program — culinary, wellness, and adventure offerings purchasable with points. Open to all World of Hyatt members.',
 'loyalty', 'hyatt', current_date),

('ihg-experiences', 'IHG One Rewards Experiences',
 'https://www.ihg.com/onerewards/content/us/en/rewards/experiences',
 'IHG''s auction and fixed-price experiences platform. Open to all IHG One Rewards members.',
 'loyalty', 'ihg', current_date),

('hilton-honors-experiences', 'Hilton Honors Experiences',
 'https://experiences.hiltonhonors.com/',
 'Hilton''s auctions and fixed-price events platform. Open to all Hilton Honors members.',
 'loyalty', 'hilton', current_date),

('alaska-mileage-plan-unlocked', 'Alaska Mileage Plan Unlocked',
 'https://unlocked.mileageplan.com/',
 'Alaska''s auctions and fixed-price experiences portal. Open to all Mileage Plan members; Bank of America Alaska cardholders may earn more.',
 'loyalty', 'alaska', current_date);

-- ── C. CARD-SPECIFIC (slugs only — junction rows in migration 294) ──────────

insert into experience_programs (slug, name, official_url, description, category, issuer_slug, last_verified) values
('united-card-events-chase', 'United Card Events from Chase',
 'https://www.unitedcardevents.com/',
 'Chase × United cardholder-exclusive events: private dining, sports, concerts, behind-the-scenes United experiences. Available to Chase United cobrand cardholders only.',
 'card_specific', 'chase', current_date),

('southwest-rapid-rewards-access', 'Southwest Rapid Rewards Access Events',
 'https://access.southwest.com/',
 'Chase × Southwest cardholder-exclusive events: concerts, sports, meet-and-greets. Available to Chase Southwest cobrand cardholders only.',
 'card_specific', 'chase', current_date),

('chase-sapphire-reserved', 'Sapphire Reserved (Chase Gets You Closer)',
 'https://experiences.chase.com/sapphire',
 'Sapphire-exclusive VIP access program: presales, festival lounges, dining series, curated weekends. Available to Chase Sapphire Preferred and Sapphire Reserve cardholders only.',
 'card_specific', 'chase', current_date),

('amex-by-invitation-only', 'By Invitation Only',
 'https://www.americanexpress.com/us/benefits/events/by-invitation-only/',
 'Amex ultra-premium curated events portal: exclusive sports, fashion, cultural, and travel events. Available to Platinum, Business Platinum, and Centurion cardholders only.',
 'card_specific', 'amex', current_date),

('amex-resy-global-dining-access', 'Global Dining Access by Resy',
 'https://www.resy.com/amex',
 'Amex × Resy partnership: priority reservations at sought-after restaurants and exclusive dining events. Available to Platinum, Business Platinum, and Centurion cardholders only.',
 'card_specific', 'amex', current_date),

('capital-one-dining', 'Capital One Dining',
 'https://www.capitalone.com/dining/',
 'Capital One''s priority dining reservations and chef-led events platform. Available to Venture X, Venture, and Savor cardholders.',
 'card_specific', 'capital-one', current_date),

('capital-one-lounges', 'Capital One Lounges',
 'https://www.capitalone.com/airport-lounges/',
 'Capital One''s growing network of airport lounges + special lounge-hosted events. Venture X = unlimited free access; Venture = 2 free visits per year; Spark Travel Elite included.',
 'card_specific', 'capital-one', current_date),

('us-bank-pga-access', 'U.S. Bank PGA TOUR Access',
 'https://www.usbank.com/about-us-bank/community/pga-tour.html',
 'U.S. Bank''s PGA TOUR partnership — golf-related event access and promotions. Limited program (only certain U.S. Bank cards).',
 'card_specific', 'us-bank', current_date);
