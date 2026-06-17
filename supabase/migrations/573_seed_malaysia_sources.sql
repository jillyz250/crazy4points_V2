-- Seed sources for Malaysia Airlines Enrich.
insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Malaysia Airlines Enrich main', 'https://enrich.malaysiaairlines.com/', 'official_partner', 1, true, true,
   'Enrich overview: two point types (Enrich Points spend, 3-yr validity; Elite Points status), earn/redeem, Enrich Hotels. oneworld member.', now(), now()),
  ('Enrich 2026 programme update', 'https://enrich.malaysiaairlines.com/EnrichUpdates2026', 'official_partner', 1, true, true,
   'AUTHORITATIVE for the Jan 1 2026 refresh: Enrich Points multipliers (Blue 1.5/Silver 1.8/Gold 2.2/Platinum 2.5 per RM1), Elite Status thresholds (2026: 30/60/100; 2027 qualification: 35/70/140 Elite Points), Elite Points by distance+cabin.', now(), now()),
  ('Malaysia Airlines oneworld member page', 'https://www.oneworld.com/members/malaysia-airlines', 'official_partner', 2, true, true,
   'oneworld tier mapping (Silver=Ruby, Gold=Sapphire, Platinum=Emerald) + alliance benefits.', now(), now()),
  ('FrequentMiler Citi ThankYou transfer partners', 'https://frequentmiler.com/citi-thankyou-rewards-airline-and-hotel-transfer-partners/', 'blog', 2, true, false,
   'Confirms Citi ThankYou -> Enrich is a CURRENT 1:1 partner (2026); 1-2 day transfer. The 2022 drop was temporary. FM notes Enrich award values are modest.', now(), now())
on conflict do nothing;
