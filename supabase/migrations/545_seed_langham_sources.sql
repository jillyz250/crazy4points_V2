-- Seed sources for Brilliant by Langham so Claude Scout can monitor for program changes.
-- All primary data scraped successfully via Firecrawl from official brilliantbylangham.com pages.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Brilliant by Langham about page', 'https://www.brilliantbylangham.com/en/about-brilliant', 'official_partner', 1, true, true,
   'Program overview, participating brands (Langham, Cordis, Eaton, Ying''nFlo, Chelsea Toronto), ~30 hotels.', now(), now()),
  ('Brilliant by Langham member benefits', 'https://www.brilliantbylangham.com/en/member-benefits', 'official_partner', 1, true, true,
   'Authoritative tier matrix: Status Point thresholds (Onyx/Topaz 12k/Diamond 108k/Sapphire 360k/Ruby 720k), elite bonus % per tier, dining discount %, room upgrade + late checkout values.', now(), now()),
  ('Brilliant by Langham FAQ', 'https://www.brilliantbylangham.com/en/faq', 'official_partner', 1, true, true,
   'Earn rate 150 Award + 150 Status Points per US$5, 24-month Award Point expiry, annual Status Point reset, 3-room cap, direct-booking-only, non-transferable.', now(), now()),
  ('Brilliant by Langham points redemption', 'https://www.brilliantbylangham.com/en/points-redemption', 'official_partner', 1, true, true,
   'Dynamic redemption (no published chart), no blackout dates, full-cash-or-full-points. Lists airline conversion partners (Cathay Asia Miles, Singapore KrisFlyer, Air China PhoenixMiles).', now(), now()),
  ('Brilliant by Langham points-to-miles T&C', 'https://www.brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions', 'official_partner', 2, true, true,
   '"Have a Brilliant Flight" airline conversion terms. Monitor conversion ratios -- subject to change without notice. Partners: Cathay, Singapore, Air China, China Eastern.', now(), now()),
  ('Brilliant by Langham status match / Mastercard fast-track', 'https://www.brilliantbylangham.com/en/enrolment/statusmatch', 'official_partner', 2, true, true,
   'Status match enrolment + Mastercard fast-track (World Elite->Ruby, World->Sapphire, Platinum/Titanium->Diamond). Offer extended through 2027-12-31. Monitor for changes.', now(), now()),
  ('Brilliant by Langham programme terms', 'https://www.brilliantbylangham.com/en/programme-terms-conditions', 'official_partner', 2, true, true,
   'Full program T&C. Monitor for changes to earn rates, expiry, qualifying-spend definitions, redemption rules.', now(), now())
on conflict do nothing;
