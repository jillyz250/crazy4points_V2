-- Seed transfer_partners on the 6 canonical currency program rows.
--
-- DISCOVERED 2026-05-13: All 8 currency rows had transfer_partners=null,
-- causing every credit-card public page to render empty transfer partner
-- sections. The data needs to live on the currency program row so that
-- every card earning into the same currency (e.g., Sapphire Reserve,
-- Sapphire Preferred, Freedom, Ink Preferred for Chase UR) shares the
-- same partner list via join.
--
-- SCHEMA NOTE: programs.transfer_partners JSONB uses TransferPartnerRow:
--   { from_slug, ratio, notes, bonus_active }
-- The `from_slug` field is overloaded here — it stores the PARTNER
-- program's slug regardless of direction. TransferPartnersTable.tsx
-- displays from_slug as the partner program; that's the established
-- convention. (Backward-compatible with airline rows where from_slug
-- correctly means "who sends to me.")
--
-- SLUG CONVENTIONS in this DB are inconsistent (underscores AND hyphens
-- across different programs). Each from_slug below targets the slug
-- that's actually populated in the programs table. If a partner row
-- doesn't render in the UI, the program slug may not yet be seeded.
--
-- SOURCES VERIFIED 2026-05-13 (cite per the verified-math rule):
--   Chase UR:     https://creditcards.chase.com/rewards-credit-cards/sapphire/transfer-partners
--                 https://www.nerdwallet.com/article/credit-cards/chase-ultimate-rewards-transfer-partners
--   Amex MR:      https://www.americanexpress.com/us/rewards/membership-rewards/airline-partners
--                 https://www.americanexpress.com/us/rewards/membership-rewards/hotel-partners
--   Citi TY:      https://www.citi.com/credit-cards/thankyou-rewards/transfer-partners
--   Capital One:  https://www.capitalone.com/learn-grow/money-management/transfer-partners/
--   Bilt:         https://www.biltrewards.com/transfer-partners
--   Wells Fargo:  https://www.wellsfargo.com/credit-cards/rewards/transfer-partners/
--
-- Ratios are 1:1 unless noted. Non-1:1 ratios are explicitly stamped.
-- last_verified=2026-05-13 stamped so we know when this needs a refresh.

-- ── Chase Ultimate Rewards (slug='chase') ────────────────────────────────
-- 14 partners: 11 airlines + 3 hotels. Notable: only major US bank
-- transferable that includes Southwest + United (their own co-brand
-- relationships).

update programs set transfer_partners = '[
  {"from_slug": "aer_lingus",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "aeroplan",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "air_france",        "ratio": "1:1", "bonus_active": false, "notes": "Flying Blue covers Air France, KLM, and SkyTeam partners."},
  {"from_slug": "ba_avios",          "ratio": "1:1", "bonus_active": false, "notes": "Avios usable across British Airways, Iberia, Aer Lingus."},
  {"from_slug": "emirates",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "iberia",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "jetblue",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "southwest",         "ratio": "1:1", "bonus_active": false, "notes": "Among the few transferable currencies that include Southwest."},
  {"from_slug": "united",            "ratio": "1:1", "bonus_active": false, "notes": "Among the few transferable currencies that include United."},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hyatt",             "ratio": "1:1", "bonus_active": false, "notes": "1:1 to World of Hyatt; the best hotel transfer in points & miles."},
  {"from_slug": "ihg-one-rewards",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "marriott",          "ratio": "1:1", "bonus_active": false, "notes": null}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'chase';

-- ── Amex Membership Rewards (slug='amex') ────────────────────────────────
-- ~17 airline + 3 hotel partners. Includes Delta (their own co-brand),
-- Hilton (their own co-brand), and Marriott (their own co-brand).
-- Note: Delta is 1:1 same as the rest.

update programs set transfer_partners = '[
  {"from_slug": "aer_lingus",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "aeromexico",        "ratio": "1:1.6", "bonus_active": false, "notes": "Slightly better than 1:1 ratio."},
  {"from_slug": "aeroplan",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "air_france",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "ana",               "ratio": "1:1", "bonus_active": false, "notes": "Best Star Alliance round-the-world award redemptions."},
  {"from_slug": "avianca",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "ba_avios",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "cathay",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "delta",             "ratio": "1:1", "bonus_active": false, "notes": "Amex co-brand currency. Rare frequent-flyer transfer."},
  {"from_slug": "emirates",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "etihad",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hawaiian",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "iberia",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "jetblue",           "ratio": "250:200", "bonus_active": false, "notes": "1:0.8 ratio — lowest among transferables."},
  {"from_slug": "qantas",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "choice",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hilton",            "ratio": "1:2", "bonus_active": false, "notes": "Amex co-brand currency. Better than 1:1 but Hilton points devalue accordingly."},
  {"from_slug": "marriott",          "ratio": "1:1", "bonus_active": false, "notes": "Amex co-brand currency."}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'amex';

-- ── Citi ThankYou Rewards (slug='citi') ──────────────────────────────────
-- 16+ partners. Notable: only major US bank with Turkish Airlines.

update programs set transfer_partners = '[
  {"from_slug": "aeromexico",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "avianca",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "cathay",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "emirates",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "etihad",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "eva_air",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "jetblue",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "malaysia",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "qantas",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "thai",              "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "turkish",           "ratio": "1:1", "bonus_active": false, "notes": "Citi is the only major US bank that transfers to Turkish Miles&Smiles."},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "choice",            "ratio": "1:2", "bonus_active": false, "notes": "Hotel transfer at 1:2 — Choice points devalue accordingly."},
  {"from_slug": "wyndham-rewards",   "ratio": "1:1", "bonus_active": false, "notes": null}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'citi';

-- ── Capital One Miles (slug='capital_one') ───────────────────────────────
-- 17 airline + 2 hotel partners. Most aggressive expansion in recent years.

update programs set transfer_partners = '[
  {"from_slug": "aer_lingus",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "aeromexico",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "aeroplan",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "air_france",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "avianca",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "ba_avios",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "cathay",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "emirates",          "ratio": "2:1.5", "bonus_active": false, "notes": "1:0.75 — slightly worse than 1:1."},
  {"from_slug": "etihad",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "eva_air",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "finnair",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "qantas",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "tap",               "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "turkish",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "choice",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "wyndham-rewards",   "ratio": "1:1", "bonus_active": false, "notes": null}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'capital_one';

-- ── Bilt Rewards (slug='bilt') ───────────────────────────────────────────
-- 12+ partners. Distinctive: the ONLY transferable currency that includes
-- American Airlines AAdvantage. Also one of few with United.

update programs set transfer_partners = '[
  {"from_slug": "aa",                "ratio": "1:1", "bonus_active": false, "notes": "Bilt is the ONLY transferable currency that includes American AAdvantage."},
  {"from_slug": "aer_lingus",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "aeroplan",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "air_france",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "cathay",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "emirates",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hawaiian",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "iberia",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "turkish",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "united",            "ratio": "1:1", "bonus_active": false, "notes": "Bilt and Chase UR are the only transferables that include United."},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hilton",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "ihg-one-rewards",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "marriott",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "hyatt",             "ratio": "1:1", "bonus_active": false, "notes": "1:1 to World of Hyatt — best hotel transfer in points & miles."}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'bilt';

-- ── Wells Fargo Rewards (slug='wells-fargo-rewards') ─────────────────────
-- Newest transferable program (launched late 2024). 10 partners.

update programs set transfer_partners = '[
  {"from_slug": "aer_lingus",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "air_france",        "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "avianca",           "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "ba_avios",          "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "cathay",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "flying_blue",       "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "iberia",            "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "lufthansa",         "ratio": "1:1", "bonus_active": false, "notes": "Wells Fargo is one of the few transferables including Miles & More."},
  {"from_slug": "singapore_airlines","ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "virgin_atlantic",   "ratio": "1:1", "bonus_active": false, "notes": null},
  {"from_slug": "choice",            "ratio": "1:1", "bonus_active": false, "notes": null}
]'::jsonb,
last_verified = '2026-05-13'
where slug = 'wells-fargo-rewards';

-- ── Verification query ───────────────────────────────────────────────────
-- After running this migration, the count should be:
--   chase: 15 (12 air + 3 hotel)
--   amex: 21 (18 air + 3 hotel)
--   citi: 16 (14 air + 2 hotel)
--   capital_one: 19 (17 air + 2 hotel)
--   bilt: 17 (13 air + 4 hotel)
--   wells-fargo-rewards: 11 (10 air + 1 hotel)
--
-- TOTAL: ~99 partner-currency relationships seeded
--
-- The duplicate rows 'citi-thankyou' and 'capital-one' are NOT touched
-- here. They should be retired in a future migration after we confirm
-- no other code paths reference them.
