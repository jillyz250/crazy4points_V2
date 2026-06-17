-- Seed press-room and signal sources for the SLH (Small Luxury Hotels) program page.
-- Sources: SLH newsroom, SLH Club program page, Hilton SLH partnership help page.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('SLH Press Room', 'https://www.slh.com/offers/press-room/', 'official_partner', 1, true, true,
   'SLH newsroom / press releases. Firecrawl required (JS-rendered). Watch for new partnership announcements, program changes.', now(), now()),
  ('Hilton x SLH Partnership Help', 'https://www.hilton.com/en/help-center/reservations/small-luxury-hotels-partnership/', 'official_partner', 1, true, false,
   'Hilton''s canonical help page for the SLH partnership - earn rate, Hilton tier benefits at SLH, channel rules. Most stable authoritative source.', now(), now()),
  ('SLH Club Program Page', 'https://www.slh.com/about-slh/our-club', 'official_partner', 1, true, true,
   'SLH Club tier benefits (Club 01/02/03). Firecrawl required. Watch for tier qualification criteria being published.', now(), now())
on conflict do nothing;
