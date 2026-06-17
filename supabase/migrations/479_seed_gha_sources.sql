-- Seed press-room and signal sources for GHA Discovery.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('GHA Discovery Benefits', 'https://www.ghadiscovery.com/gha-discovery-benefits', 'official_partner', 1, true, true,
   'GHA tier benefits overview (Silver/Gold/Platinum/Titanium). Watch for tier structure or benefit changes.', now(), now()),
  ('GHA Discovery Terms & Conditions', 'https://www.ghadiscovery.com/terms-conditions', 'official_partner', 1, true, true,
   'Authoritative source for D$ earn rates, expiry rules, tier qualification thresholds, ineligible rates.', now(), now()),
  ('GHA Discovery Our Partners', 'https://www.ghadiscovery.com/our-partners', 'official_partner', 1, true, true,
   'GHA lifestyle partner roster. Watch for new airline or transferable-points partnerships.', now(), now()),
  ('GHA Discovery Our Brands', 'https://www.ghadiscovery.com/our-brands', 'official_partner', 1, true, true,
   'Full current member brand roster. Watch for new brands joining or departing.', now(), now())
on conflict do nothing;
