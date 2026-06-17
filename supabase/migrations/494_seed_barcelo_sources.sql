-- Seed sources for barcelo so Claude Scout can monitor for program changes.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('myBarcelo Benefits tiers and FAQ', 'https://www.barcelo.com/en-us/mybarcelo/', 'official_partner', 1, true, true,
   'Main myBarcelo Benefits landing page. Watch for tier structure changes, discount percentages, qualification thresholds, and new benefit additions.', now(), now()),
  ('myBarcelo general conditions (T&C)', 'https://www.barcelo.com/en-us/mybarcelo/general-conditions/', 'official_partner', 1, true, true,
   'Authoritative source for tier qualification rules, OTA exclusion policy, stay-counting rules, Cuba exclusion, and spend-threshold currency.', now(), now()),
  ('Barcelo airline partners page', 'https://www.barcelo.com/en-us/bhg/partners/', 'official_partner', 2, true, true,
   'Lists airline earn-on-stay partners (LifeMiles, Copa ConnectMiles). Monitor for new partner additions or rate changes.', now(), now()),
  ('LifeMiles x Barcelo partnership terms', 'https://www.lifemiles.com/partners/hotel/BARGL', 'official_partner', 2, true, true,
   'LifeMiles T&C for Barcelo earn (1 mile per USD 1 spent). Watch for rate or eligibility changes.', now(), now()),
  ('Barcelo press room', 'https://www.barcelo.com/en-us/bhg/press-room/', 'official_partner', 3, true, true,
   'Official Barcelo Hotel Group news. Monitor for new brand additions, market expansion, and program updates.', now(), now())
on conflict do nothing;
