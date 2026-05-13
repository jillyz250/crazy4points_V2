-- Credit cards: bulk seed of the remaining Tier 2/3 skeletons.
--
-- Builds on the 18 cards seeded in migration 050. Adds:
--   1. Five new issuers (Barclays, Bank of America, US Bank, Wells Fargo, FNBO)
--   2. ~85 card skeleton rows covering the rest of the US travel-relevant
--      credit-card universe across all 10 issuers.
--
-- All cards seed with status from migration 254. Legacy cards (closed to
-- new applications but still in wallets) are stamped status='closed_to_new_apps'.
-- Defunct cards (issuer relationship terminated) are stamped status='defunct'.
--
-- FK resolution: scalar subqueries match either hyphenated or underscored
-- slug conventions to handle the legacy split in the programs table.
-- Cards where no program slug matches get NULL for that FK — still a valid
-- row; fix via UPDATE once the target program lands.
--
-- All cards seeded with minimum data: slug, issuer FK, name, type, tier,
-- currency FK, co-brand FK (where applicable), status. Editorial content
-- (intro, full benefits, earn rates, welcome bonuses) gets filled per-card
-- via the per-card authoring flow.
--
-- Idempotent: ON CONFLICT DO NOTHING on both issuers and credit_cards.

-- ── New issuers ──────────────────────────────────────────────────────────

insert into issuers (slug, name, website_url, intro) values
  ('barclays',
   'Barclays',
   'https://www.barclaycardus.com',
   'Barclays issues co-brand cards for JetBlue, American Airlines (Aviator family), Hawaiian Airlines, Wyndham Rewards, Frontier, Breeze, and several cruise lines (Carnival, Princess, Holland America). No proprietary transferable currency.'),

  ('bank-of-america',
   'Bank of America',
   'https://www.bankofamerica.com',
   'Bank of America issues the Premium Rewards lineup (uses BofA''s own redemption portal — not transferable to airline/hotel partners) plus co-brand cards for Alaska Airlines, Air France/KLM (Flying Blue), Virgin Atlantic, Allegiant, and several cruise lines.'),

  ('us-bank',
   'US Bank',
   'https://www.usbank.com',
   'US Bank issues the Altitude family. Altitude Reserve and Altitude Connect added airline/hotel transfer partners in 2024, joining the transferable-currency tier. Altitude Go remains cashback.'),

  ('wells-fargo',
   'Wells Fargo',
   'https://www.wellsfargo.com',
   'Wells Fargo operates Wells Fargo Rewards, earned by the Autograph and Autograph Journey cards. Transferable to ~10 airline and hotel partners as of late 2024. Wells Fargo also issues the Bilt Mastercard (sold under the Bilt brand) and Choice Privileges co-brand cards.'),

  ('fnbo',
   'First National Bank of Omaha',
   'https://www.fnbo.com',
   'FNBO issues a small set of US co-brand cards — most notably the Sun Country Airlines Visa. Niche but relevant for completeness in airline co-brand coverage.')
on conflict (slug) do nothing;

-- ── Card skeletons ───────────────────────────────────────────────────────
-- Defensive slug match: tries both hyphenated and underscored conventions
-- since the programs table has a mix.

insert into credit_cards (
  slug, issuer_id, name, card_type, card_tier,
  currency_program_id, co_brand_program_id, status, is_active
)
select x.slug, i.id, x.name, x.card_type, x.card_tier,
       (select id from programs
         where slug = x.currency_slug
            or slug = replace(x.currency_slug, '_', '-')
            or slug = replace(x.currency_slug, '-', '_')
         limit 1) as currency_program_id,
       (select id from programs
         where slug = x.co_brand_slug
            or slug = replace(x.co_brand_slug, '_', '-')
            or slug = replace(x.co_brand_slug, '-', '_')
         limit 1) as co_brand_program_id,
       x.status, x.is_active
from (values
  -- ─── Chase (Ultimate Rewards family + co-brands) ──────────────────────
  -- Pairable cashback (becomes UR transferable when paired with Sapphire/Ink Preferred)
  ('chase-freedom-unlimited',         'chase', 'Chase Freedom Unlimited',                   'personal', 'starter',         'chase', null::text, 'active', true),
  ('chase-freedom-flex',              'chase', 'Chase Freedom Flex',                        'personal', 'starter',         'chase', null,        'active', true),
  ('chase-freedom-rise',              'chase', 'Chase Freedom Rise',                        'personal', 'starter',         'chase', null,        'active', true),
  ('chase-ink-business-cash',         'chase', 'Chase Ink Business Cash',                   'business', 'business',        'chase', null,        'active', true),
  ('chase-ink-business-unlimited',    'chase', 'Chase Ink Business Unlimited',              'business', 'business',        'chase', null,        'active', true),
  -- Ink Premier is cashback-only (does NOT transfer to UR partners even when paired)
  ('chase-ink-business-premier',      'chase', 'Chase Ink Business Premier',                'business', 'business',        null,    null,        'active', true),
  -- Chase airline co-brands
  ('chase-united-explorer',           'chase', 'United Explorer Card',                      'personal', 'airline_cobrand', 'united',     'united',     'active', true),
  ('chase-united-gateway',            'chase', 'United Gateway Card',                       'personal', 'airline_cobrand', 'united',     'united',     'active', true),
  ('chase-united-business',           'chase', 'United Business Card',                      'business', 'airline_cobrand', 'united',     'united',     'active', true),
  ('chase-southwest-rapid-rewards-plus',     'chase', 'Southwest Rapid Rewards Plus',       'personal', 'airline_cobrand', 'southwest',  'southwest',  'active', true),
  ('chase-southwest-rapid-rewards-premier',  'chase', 'Southwest Rapid Rewards Premier',    'personal', 'airline_cobrand', 'southwest',  'southwest',  'active', true),
  ('chase-southwest-rapid-rewards-priority', 'chase', 'Southwest Rapid Rewards Priority',   'personal', 'airline_cobrand', 'southwest',  'southwest',  'active', true),
  ('chase-southwest-performance-business',   'chase', 'Southwest Performance Business',     'business', 'airline_cobrand', 'southwest',  'southwest',  'active', true),
  ('chase-southwest-premier-business',       'chase', 'Southwest Premier Business',         'business', 'airline_cobrand', 'southwest',  'southwest',  'active', true),
  ('chase-aer-lingus-visa-signature',        'chase', 'Aer Lingus Visa Signature',          'personal', 'airline_cobrand', 'aer_lingus', 'aer_lingus', 'active', true),
  ('chase-british-airways-visa-signature',   'chase', 'British Airways Visa Signature',     'personal', 'airline_cobrand', 'ba_avios',   'ba_avios',   'active', true),
  ('chase-iberia-visa-signature',            'chase', 'Iberia Visa Signature',              'personal', 'airline_cobrand', 'iberia',     'iberia',     'active', true),
  ('chase-aeroplan',                  'chase', 'Aeroplan Credit Card',                      'personal', 'airline_cobrand', 'aeroplan',   'aeroplan',   'active', true),
  -- Chase hotel co-brands
  ('chase-ihg-one-rewards-premier',          'chase', 'IHG One Rewards Premier',            'personal', 'hotel_cobrand',   'ihg-one-rewards', 'ihg-one-rewards', 'active', true),
  ('chase-ihg-one-rewards-traveler',         'chase', 'IHG One Rewards Traveler',           'personal', 'hotel_cobrand',   'ihg-one-rewards', 'ihg-one-rewards', 'active', true),
  ('chase-ihg-one-rewards-premier-business', 'chase', 'IHG One Rewards Premier Business',   'business', 'hotel_cobrand',   'ihg-one-rewards', 'ihg-one-rewards', 'active', true),
  ('chase-marriott-bonvoy-boundless', 'chase', 'Marriott Bonvoy Boundless Credit Card',     'personal', 'hotel_cobrand',   'marriott',   'marriott',   'active', true),
  ('chase-marriott-bonvoy-bountiful', 'chase', 'Marriott Bonvoy Bountiful Credit Card',     'personal', 'hotel_cobrand',   'marriott',   'marriott',   'active', true),
  ('chase-marriott-bonvoy-bold',      'chase', 'Marriott Bonvoy Bold Credit Card',          'personal', 'hotel_cobrand',   'marriott',   'marriott',   'active', true),
  ('chase-ritz-carlton',              'chase', 'The Ritz-Carlton Credit Card',              'personal', 'hotel_cobrand',   'marriott',   'marriott',   'closed_to_new_apps', true),
  ('chase-marriott-bonvoy-premier',   'chase', 'Marriott Bonvoy Premier Credit Card',       'personal', 'hotel_cobrand',   'marriott',   'marriott',   'closed_to_new_apps', true),
  -- Chase Disney + Amazon (no transferable currency — these are co-brand cashback)
  ('chase-disney-premier-visa',       'chase', 'Disney Premier Visa Card',                  'personal', 'hotel_cobrand',   null, null, 'active', true),
  ('chase-disney-visa',               'chase', 'Disney Visa Card',                          'personal', 'starter',         null, null, 'active', true),
  ('chase-prime-visa',                'chase', 'Prime Visa',                                'personal', 'starter',         null, null, 'active', true),

  -- ─── Amex (Membership Rewards + co-brands) ────────────────────────────
  ('amex-blue-business-plus',         'amex', 'The Blue Business Plus Credit Card from American Express',  'business', 'business',        'amex', null, 'active', true),
  ('amex-everyday',                   'amex', 'Amex EveryDay Credit Card',                  'personal', 'starter',         'amex', null, 'active', true),
  ('amex-everyday-preferred',         'amex', 'Amex EveryDay Preferred Credit Card',        'personal', 'mid',             'amex', null, 'active', true),
  -- Delta co-brands (personal + business)
  ('amex-delta-blue',                 'amex', 'Delta SkyMiles Blue American Express Card',  'personal', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-gold',                 'amex', 'Delta SkyMiles Gold American Express Card',  'personal', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-platinum',             'amex', 'Delta SkyMiles Platinum American Express Card', 'personal', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-reserve',              'amex', 'Delta SkyMiles Reserve American Express Card',  'personal', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-gold-business',        'amex', 'Delta SkyMiles Gold Business American Express Card',     'business', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-platinum-business',    'amex', 'Delta SkyMiles Platinum Business American Express Card', 'business', 'airline_cobrand', 'delta', 'delta', 'active', true),
  ('amex-delta-reserve-business',     'amex', 'Delta SkyMiles Reserve Business American Express Card',  'business', 'airline_cobrand', 'delta', 'delta', 'active', true),
  -- Hilton co-brands
  ('amex-hilton-honors',              'amex', 'Hilton Honors American Express Card',        'personal', 'hotel_cobrand',   'hilton', 'hilton', 'active', true),
  ('amex-hilton-honors-surpass',      'amex', 'Hilton Honors American Express Surpass Card', 'personal', 'hotel_cobrand',  'hilton', 'hilton', 'active', true),
  ('amex-hilton-honors-business',     'amex', 'Hilton Honors American Express Business Card', 'business', 'hotel_cobrand', 'hilton', 'hilton', 'active', true),
  -- Marriott (Amex side)
  ('amex-marriott-bonvoy-bevy',       'amex', 'Marriott Bonvoy Bevy American Express Card', 'personal', 'hotel_cobrand',   'marriott', 'marriott', 'active', true),
  ('amex-marriott-bonvoy-business',   'amex', 'Marriott Bonvoy Business American Express Card', 'business', 'hotel_cobrand', 'marriott', 'marriott', 'active', true),

  -- ─── Citi (ThankYou Points + co-brands) ───────────────────────────────
  ('citi-prestige',                   'citi', 'Citi Prestige Card',                         'personal', 'premium',         'citi', null, 'closed_to_new_apps', true),
  ('citi-double-cash',                'citi', 'Citi Double Cash Card',                      'personal', 'starter',         'citi', null, 'active', true),
  ('citi-custom-cash',                'citi', 'Citi Custom Cash Card',                      'personal', 'starter',         'citi', null, 'active', true),
  ('citi-rewards-plus',               'citi', 'Citi Rewards+ Card',                         'personal', 'starter',         'citi', null, 'active', true),
  -- AAdvantage co-brands
  ('citi-aadvantage-platinum-select', 'citi', 'Citi / AAdvantage Platinum Select World Elite Mastercard', 'personal', 'airline_cobrand', 'aa', 'aa', 'active', true),
  ('citi-aadvantage-executive',       'citi', 'Citi / AAdvantage Executive World Elite Mastercard',       'personal', 'airline_cobrand', 'aa', 'aa', 'active', true),
  ('citi-aadvantage-mileup',          'citi', 'Citi / AAdvantage MileUp Card',                            'personal', 'airline_cobrand', 'aa', 'aa', 'active', true),
  ('citi-aadvantage-business',        'citi', 'CitiBusiness / AAdvantage Platinum Select World Mastercard', 'business', 'airline_cobrand', 'aa', 'aa', 'active', true),

  -- ─── Capital One ──────────────────────────────────────────────────────
  ('capital-one-ventureone',          'capital-one', 'Capital One VentureOne Rewards Credit Card', 'personal', 'starter',  'capital_one', null, 'active', true),
  ('capital-one-venture-x-business',  'capital-one', 'Capital One Venture X Business',              'business', 'business', 'capital_one', null, 'active', true),
  ('capital-one-spark-miles',         'capital-one', 'Capital One Spark Miles for Business',        'business', 'business', 'capital_one', null, 'active', true),
  ('capital-one-spark-miles-select',  'capital-one', 'Capital One Spark Miles Select for Business', 'business', 'business', 'capital_one', null, 'active', true),

  -- ─── Barclays ─────────────────────────────────────────────────────────
  -- JetBlue
  ('barclays-jetblue',                'barclays', 'JetBlue Card',                            'personal', 'airline_cobrand', 'jetblue', 'jetblue', 'active', true),
  ('barclays-jetblue-plus',           'barclays', 'JetBlue Plus Card',                       'personal', 'airline_cobrand', 'jetblue', 'jetblue', 'active', true),
  ('barclays-jetblue-business',       'barclays', 'JetBlue Business Card',                   'business', 'airline_cobrand', 'jetblue', 'jetblue', 'active', true),
  -- AAdvantage Aviator (Barclays side)
  ('barclays-aadvantage-aviator-red',      'barclays', 'AAdvantage Aviator Red World Elite Mastercard', 'personal', 'airline_cobrand', 'aa', 'aa', 'active', true),
  ('barclays-aadvantage-aviator-business', 'barclays', 'AAdvantage Aviator Business Mastercard',        'business', 'airline_cobrand', 'aa', 'aa', 'active', true),
  ('barclays-aadvantage-aviator-silver',   'barclays', 'AAdvantage Aviator Silver World Elite Mastercard', 'personal', 'airline_cobrand', 'aa', 'aa', 'closed_to_new_apps', true),
  -- Hawaiian (still branded Hawaiian despite Atmos transition)
  ('barclays-hawaiian-airlines',      'barclays', 'Hawaiian Airlines World Elite Mastercard', 'personal', 'airline_cobrand', 'hawaiian', 'hawaiian', 'active', true),
  -- Wyndham
  ('barclays-wyndham-rewards-earner',          'barclays', 'Wyndham Rewards Earner Card',         'personal', 'hotel_cobrand', 'wyndham-rewards', 'wyndham-rewards', 'active', true),
  ('barclays-wyndham-rewards-earner-plus',     'barclays', 'Wyndham Rewards Earner Plus Card',    'personal', 'hotel_cobrand', 'wyndham-rewards', 'wyndham-rewards', 'active', true),
  ('barclays-wyndham-rewards-earner-business', 'barclays', 'Wyndham Rewards Earner Business Card', 'business', 'hotel_cobrand', 'wyndham-rewards', 'wyndham-rewards', 'active', true),
  -- ULCC airlines
  ('barclays-frontier-airlines',      'barclays', 'Frontier Airlines World Mastercard',       'personal', 'airline_cobrand', 'frontier', 'frontier', 'active', true),
  ('barclays-breeze-airways',         'barclays', 'Breeze Airways Credit Card',               'personal', 'airline_cobrand', 'breeze',   'breeze',   'active', true),
  -- Spirit shut down operations May 2026 — keep card row but mark defunct
  ('barclays-free-spirit',            'barclays', 'Free Spirit Travel More World Elite Mastercard', 'personal', 'airline_cobrand', 'spirit', 'spirit', 'defunct', false),
  -- Cruise co-brands (lowest priority for editorial fill)
  ('barclays-carnival',               'barclays', 'Carnival World Mastercard',                'personal', 'airline_cobrand', null, null, 'active', true),
  ('barclays-princess-cruises',       'barclays', 'Princess Cruises Rewards Visa',            'personal', 'airline_cobrand', null, null, 'active', true),
  ('barclays-holland-america',        'barclays', 'Holland America Line Rewards Visa',        'personal', 'airline_cobrand', null, null, 'active', true),

  -- ─── Bank of America ──────────────────────────────────────────────────
  ('bank-of-america-premium-rewards',       'bank-of-america', 'Bank of America Premium Rewards Credit Card', 'personal', 'mid',     null, null, 'active', true),
  ('bank-of-america-premium-rewards-elite', 'bank-of-america', 'Bank of America Premium Rewards Elite',        'personal', 'premium', null, null, 'active', true),
  ('bank-of-america-alaska-airlines',          'bank-of-america', 'Alaska Airlines Visa Signature Credit Card', 'personal', 'airline_cobrand', 'alaska',         'alaska',         'active', true),
  ('bank-of-america-alaska-airlines-business', 'bank-of-america', 'Alaska Airlines Visa Business Credit Card',  'business', 'airline_cobrand', 'alaska',         'alaska',         'active', true),
  ('bank-of-america-air-france-klm',           'bank-of-america', 'Air France KLM World Elite Mastercard',      'personal', 'airline_cobrand', 'flying_blue',    'flying_blue',    'active', true),
  ('bank-of-america-virgin-atlantic',          'bank-of-america', 'Virgin Atlantic World Elite Mastercard',     'personal', 'airline_cobrand', 'virgin_atlantic', 'virgin_atlantic', 'active', true),
  ('bank-of-america-allegiant',                'bank-of-america', 'Allegiant World Mastercard',                 'personal', 'airline_cobrand', 'allegiant',      'allegiant',      'active', true),
  -- Cruise co-brands
  ('bank-of-america-royal-caribbean',          'bank-of-america', 'Royal Caribbean Visa Signature',             'personal', 'airline_cobrand', null, null, 'active', true),
  ('bank-of-america-celebrity-cruises',        'bank-of-america', 'Celebrity Cruises Visa Signature',           'personal', 'airline_cobrand', null, null, 'active', true),
  ('bank-of-america-norwegian-cruise',         'bank-of-america', 'Norwegian Cruise Line World Mastercard',     'personal', 'airline_cobrand', null, null, 'active', true),

  -- ─── US Bank ──────────────────────────────────────────────────────────
  -- Altitude Reserve/Connect added airline transfer partners in 2024 — true transferable tier.
  -- Currency program FK is NULL until a 'us-bank-altitude-rewards' program row exists.
  ('us-bank-altitude-reserve',          'us-bank', 'US Bank Altitude Reserve Visa Infinite',     'personal', 'premium',  null, null, 'active', true),
  ('us-bank-altitude-connect',          'us-bank', 'US Bank Altitude Connect Visa Signature',    'personal', 'mid',      null, null, 'active', true),
  ('us-bank-business-altitude-connect', 'us-bank', 'US Bank Business Altitude Connect',          'business', 'business', null, null, 'active', true),

  -- ─── Wells Fargo ──────────────────────────────────────────────────────
  ('wells-fargo-autograph-journey',       'wells-fargo', 'Wells Fargo Autograph Journey Visa',   'personal', 'mid',     'wells-fargo-rewards', null, 'active', true),
  ('wells-fargo-autograph',               'wells-fargo', 'Wells Fargo Autograph Card',           'personal', 'starter', 'wells-fargo-rewards', null, 'active', true),
  ('wells-fargo-choice-privileges-select','wells-fargo', 'Choice Privileges Select Mastercard',  'personal', 'hotel_cobrand', null, null, 'active', true),
  ('wells-fargo-choice-privileges',       'wells-fargo', 'Choice Privileges Mastercard',         'personal', 'hotel_cobrand', null, null, 'active', true),

  -- ─── FNBO ─────────────────────────────────────────────────────────────
  ('fnbo-sun-country-airlines', 'fnbo', 'Sun Country Airlines Visa Signature', 'personal', 'airline_cobrand', 'sun_country', 'sun_country', 'active', true)
) as x(slug, issuer_slug, name, card_type, card_tier, currency_slug, co_brand_slug, status, is_active)
join issuers i on i.slug = x.issuer_slug
on conflict (slug) do nothing;

-- ── Verification ─────────────────────────────────────────────────────────
-- Quick sanity queries (run manually after applying):
--
--   select count(*) from credit_cards;
--   -- Expect: ~104 (18 from migration 050 + 1 from 045 + ~85 new)
--
--   select status, count(*) from credit_cards group by status order by status;
--   -- Expect: active (~98), closed_to_new_apps (~5), defunct (1 — Free Spirit)
--
--   select i.name, count(c.id) from issuers i
--     left join credit_cards c on c.issuer_id = i.id
--     group by i.name order by count(c.id) desc;
--   -- Expect: Chase ~33, Amex ~21, Barclays ~14, BofA ~10, Citi ~9,
--   --        Capital One ~6, Wells Fargo ~4, US Bank ~3, Bilt 1, FNBO 1
