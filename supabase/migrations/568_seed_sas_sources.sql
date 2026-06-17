-- Seed sources for SAS EuroBonus so Claude Scout can monitor for program changes.
insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('SAS EuroBonus main', 'https://www.flysas.com/en/eurobonus', 'official_partner', 1, true, true,
   'Program overview, two point types (Bonus + Level), earn/use, hotels/car/shopping, news. Note: SAS moved Star Alliance -> SkyTeam 2024-09-01.', now(), now()),
  ('SAS EuroBonus membership levels', 'https://www.flysas.com/en/eurobonus/membership-levels', 'official_partner', 1, true, true,
   'Tier thresholds + benefits (Member/Silver/Gold/Diamond, + invite-only Pandion). SkyTeam Elite / Elite Plus mapping. Page timed out on scrape 2026-06-17 -- retry.', now(), now()),
  ('SAS EuroBonus award flights', 'https://www.flysas.com/en/eurobonus/award-flights', 'official_partner', 1, true, true,
   'Fixed award chart for SAS-operated flights; no carrier fuel surcharges. Source of truth for award point levels -- verify here on refresh.', now(), now()),
  ('SAS EuroBonus partners', 'https://www.flysas.com/en/eurobonus/partners', 'official_partner', 2, true, true,
   'SkyTeam airline partners (Delta, Air France, KLM, Korean, Virgin Atlantic, China Eastern, etc.) + hotel/car/shopping partners. Partner award booking fees changed May 2026.', now(), now())
on conflict do nothing;
