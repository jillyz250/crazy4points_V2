insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Air Europa SUMA program', 'https://www.aireuropa.com/us/en/aea/suma/our-program.html', 'official_partner', 1, true, true,
   'SUMA overview: two mile types (SUMA Miles spend/24mo; Tier Miles status/12mo), earn/redeem, SkyTeam. Madrid hub.', now(), now()),
  ('Air Europa SUMA cards & benefits', 'https://www.aireuropa.com/us/en/aea/suma/our-program/cards-and-benefits.html', 'official_partner', 1, true, true,
   'AUTHORITATIVE tier matrix: Silver/Gold/Platinum thresholds (18k/32k/60k Tier Miles or 14/26/50 flights, min 4 AE), SkyTeam Elite/Elite Plus mapping, seat + lounge + upgrade benefits.', now(), now()),
  ('Air Europa SUMA miles & expiry', 'https://www.aireuropa.com/ot/en/aea/suma/our-program/miles-suma-miles-level.html', 'official_partner', 1, true, true,
   'SUMA Miles valid 24 months; Tier Miles expire 12 months. Earn per euro + cabin/level.', now(), now()),
  ('Air Europa SUMA partners', 'https://www.aireuropa.com/us/en/aea/suma/our-program/our-partners.html', 'official_partner', 2, true, true,
   'SkyTeam airline + hotel/car partners. Redemption floors: partner from ~1,500, SkyTeam from ~6,000 SUMA Miles.', now(), now())
on conflict do nothing;
