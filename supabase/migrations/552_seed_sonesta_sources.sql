-- Seed sources for Sonesta Travel Pass so Claude Scout can monitor for program changes.
-- Primary data scraped via Firecrawl from the official travelpass.sonesta.com main page + FAQ.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Sonesta Travel Pass main page', 'https://travelpass.sonesta.com/', 'official_partner', 1, true, true,
   'Authoritative for tier thresholds (Bronze/Silver/Gold/Platinum), earn rates by brand, redemption mechanic, status carryover, status match, FAQ. Most data-dense page.', now(), now()),
  ('Sonesta Travel Pass member benefits PDF', 'https://travelpass.sonesta.com/wp-content/uploads/2025/07/STP-Member-Benefits.pdf', 'official_partner', 1, true, true,
   'Official per-tier benefits chart PDF (bonus multiplier exact percentages, full benefit matrix). Fetch for precise tier-by-tier detail on next refresh.', now(), now()),
  ('Sonesta Travel Pass earn page', 'https://travelpass.sonesta.com/earn/', 'official_partner', 2, true, true,
   'Earn rates by brand and partner. Monitor for brand-list and rate changes.', now(), now()),
  ('Sonesta Travel Pass terms & conditions', 'https://www.sonesta.com/travel-pass/terms-conditions', 'official_partner', 1, true, true,
   'Full program T&C: qualifying rates, points expiry, reward-night transfer rules, status qualification. Authoritative for expiry timeframe (verify exact inactivity window here).', now(), now()),
  ('Sonesta our partners page', 'https://www.sonesta.com/our-partners', 'official_partner', 2, true, true,
   'Brand partner roster (Avis/Budget, Grubhub, Fable, bath amenities) -- travel services, NOT points-transfer partners. Monitor if any airline/bank transfer partner is ever added.', now(), now())
on conflict do nothing;
