-- Tier 1 credit card skeletons — bulk seed for the credit_cards directory.
--
-- Adds 4 new issuers (Amex, Citi, Capital One, Bilt) and 18 card skeleton
-- rows representing the Tier 1 travel-relevant US card universe. Cards get
-- minimum data: slug, issuer FK, name, type, tier, currency FK, co-brand FK
-- (where applicable). Editorial fields (intro, full benefits, earn rates,
-- welcome bonuses) get filled per-card via the 11-step add-program workflow.
--
-- last_verified intentionally NULL on every row so each card shows up in
-- /admin/refresh-queue as "needs first verification" — that's the roadmap.
--
-- Slug convention for credit_cards.* and issuers.*: DASHES (matches the
-- existing chase-world-of-hyatt and chase issuer rows). Note: this differs
-- from programs.slug which uses underscores. Per-table convention.
--
-- Bilt issuer slug = 'bilt' (the brand, even though Wells Fargo is the
-- actual issuing bank). Per user decision 2026-04-29.
--
-- Idempotent: ON CONFLICT DO NOTHING on both issuers and credit_cards.
-- Re-running this migration is safe.

-- ── Issuers ──────────────────────────────────────────────────────────────

insert into issuers (slug, name, website_url, intro) values
  ('amex',
   'American Express',
   'https://www.americanexpress.com',
   'American Express operates the Membership Rewards (MR) currency, earned by Platinum/Gold/Green and the Business Platinum/Business Gold lineup. Amex also issues co-brand cards for Hilton, Marriott Bonvoy (Brilliant), and Delta SkyMiles.'),

  ('citi',
   'Citi',
   'https://www.citi.com',
   'Citi operates the ThankYou Rewards currency, earned by the Strata Premier/Strata Elite cards (and the predecessor Premier/Prestige). Citi also issues co-brand cards for AAdvantage and Costco.'),

  ('capital-one',
   'Capital One',
   'https://www.capitalone.com',
   'Capital One operates the Capital One Miles currency, earned by the Venture/Venture X/VentureOne lineup. Cap One Miles transfer to ~15 airline and 2 hotel partners; Venture X is a popular Sapphire Reserve alternative.'),

  ('bilt',
   'Bilt',
   'https://www.biltrewards.com',
   'Bilt issues the Bilt Mastercard (underwritten by Wells Fargo). Earns Bilt Rewards points on rent payments, dining, and other categories. Bilt Rewards transfers 1:1 to a roster of airline and hotel partners including Hyatt; Rent Day promos run on the 1st of each month.')
on conflict (slug) do nothing;

-- ── Tier 1 card skeletons ────────────────────────────────────────────────
-- Resolved via scalar subqueries against issuers and programs. Cards where
-- a target program slug doesn't exist get NULL for that FK (degrades to a
-- still-valid row; can be filled in later when the program lands).

insert into credit_cards (
  slug, issuer_id, name, card_type, card_tier,
  currency_program_id, co_brand_program_id, is_active
)
select x.slug, i.id, x.name, x.card_type, x.card_tier,
       (select id from programs where slug = x.currency_slug) as currency_program_id,
       (select id from programs where slug = x.co_brand_slug) as co_brand_program_id,
       true
from (values
  -- Chase (UR family)
  ('chase-sapphire-reserve',        'chase', 'Chase Sapphire Reserve',        'personal', 'premium',        'chase', null::text),
  ('chase-sapphire-preferred',      'chase', 'Chase Sapphire Preferred',      'personal', 'mid',            'chase', null),
  ('chase-ink-business-preferred',  'chase', 'Chase Ink Business Preferred',  'business', 'business',       'chase', null),

  -- Chase co-brands
  ('chase-world-of-hyatt-business', 'chase', 'World of Hyatt Business Credit Card', 'business', 'hotel_cobrand', 'hyatt',  'hyatt'),
  ('united-quest',                  'chase', 'United Quest Card',             'personal', 'airline_cobrand', 'united', 'united'),
  ('united-club-infinite',          'chase', 'United Club Infinite Card',     'personal', 'airline_cobrand', 'united', 'united'),

  -- Amex (MR family)
  ('amex-platinum',                 'amex',  'The Platinum Card from American Express', 'personal', 'premium',  'amex', null),
  ('amex-gold',                     'amex',  'American Express Gold Card',    'personal', 'premium',        'amex', null),
  ('amex-business-platinum',        'amex',  'The Business Platinum Card from American Express', 'business', 'business', 'amex', null),
  ('amex-business-gold',            'amex',  'American Express Business Gold Card', 'business', 'business', 'amex', null),
  ('amex-green',                    'amex',  'American Express Green Card',   'personal', 'mid',            'amex', null),

  -- Amex co-brands
  ('marriott-bonvoy-brilliant',     'amex',  'Marriott Bonvoy Brilliant American Express', 'personal', 'hotel_cobrand', 'amex', 'marriott'),
  ('hilton-honors-aspire',          'amex',  'Hilton Honors American Express Aspire Card',  'personal', 'hotel_cobrand', 'amex', 'hilton'),

  -- Citi (TY family)
  ('citi-strata-premier',           'citi',  'Citi Strata Premier Card',      'personal', 'mid',            'citi', null),
  ('citi-strata-elite',             'citi',  'Citi Strata Elite Card',        'personal', 'premium',        'citi', null),

  -- Capital One
  ('capital-one-venture-x',         'capital-one', 'Capital One Venture X Rewards Credit Card', 'personal', 'premium', 'capital_one', null),
  ('capital-one-venture',           'capital-one', 'Capital One Venture Rewards Credit Card',   'personal', 'mid',     'capital_one', null),

  -- Bilt
  ('bilt-mastercard',               'bilt',  'Bilt Mastercard',               'personal', 'starter',        'bilt', null)
) as x(slug, issuer_slug, name, card_type, card_tier, currency_slug, co_brand_slug)
join issuers i on i.slug = x.issuer_slug
on conflict (slug) do nothing;
