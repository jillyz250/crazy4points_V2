-- Citi ThankYou — canonical 19 outbound transfer partners with TIERED ratios
-- Source: Citi ThankYou logged-in portal (verified 2026-05-18 by Jill)
-- Schema: row.tiers[] holds per-tier ratios + eligible card slugs.
--   - Premium tier (1:1 most partners): Strata Elite, Strata Premier, Prestige
--   - Standard tier (1:0.7 most partners): Custom Cash, Double Cash, Rewards+
-- AT&T cards excluded (cash-back-only, not in our DB per editorial policy).
-- AAdvantage has narrower tier eligibility (no AT&T cards in either tier).
-- Active promos preserved as `promo_ratio` on tier rows.

UPDATE programs
   SET transfer_partners_outbound = '[
  {"from_slug":"aa","notes":"AAdvantage Bonus Miles. Narrower eligibility - AT&T cards excluded from both tiers.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash"]}
   ],"ratio":"1:1"},
  {"from_slug":"accor","notes":"ALL - Accor Live Limitless. ALL Reward points.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:0.5","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.35","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:0.5"},
  {"from_slug":"avianca","notes":"Avianca LifeMiles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"cathay","notes":"Cathay Pacific Asia Miles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"choice","notes":"Choice Privileges hotel points.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1.5","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:1.05","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1.5"},
  {"from_slug":"emirates","notes":"Emirates Skywards Miles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:0.8","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.56","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:0.8"},
  {"from_slug":"etihad","notes":"Etihad Guest Miles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"eva-air","notes":"EVA Air Infinity MileageLands.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"flying-blue","notes":"Air France-KLM Flying Blue.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"iprefer","notes":"Preferred Hotels and Resorts I Prefer. +30% bonus active 2026-05-18.","bonus_active":true,
   "tiers":[
     {"tier":"premium","ratio":"1:2.0","promo_ratio":"1:2.6","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:1.4","promo_ratio":"1:1.82","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:2.0"},
  {"from_slug":"jetblue","notes":"JetBlue TrueBlue points.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"krisflyer","notes":"Singapore Airlines KrisFlyer Miles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"leading-hotels","notes":"Leaders Club (Leading Hotels of the World).","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:0.2","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.14","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:0.2"},
  {"from_slug":"qantas","notes":"Qantas Frequent Flyer points.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"qatar","notes":"Qatar Airways Privilege Club Avios.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"thai","notes":"Thai Royal Orchid Plus.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"turkish","notes":"Turkish Miles and Smiles.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"virgin-atlantic","notes":"Virgin Atlantic Flying Club + Virgin Red.","bonus_active":false,
   "tiers":[
     {"tier":"premium","ratio":"1:1","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"},
  {"from_slug":"wyndham","notes":"Wyndham Rewards. +25% bonus active 2026-05-18.","bonus_active":true,
   "tiers":[
     {"tier":"premium","ratio":"1:1","promo_ratio":"1:1.25","eligible_card_slugs":["citi-strata-elite","citi-strata-premier","citi-prestige"]},
     {"tier":"standard","ratio":"1:0.7","promo_ratio":"1:0.875","eligible_card_slugs":["citi-custom-cash","citi-double-cash","citi-rewards-plus"]}
   ],"ratio":"1:1"}
]'::jsonb,
       transfer_partners_verified_at = now(),
       updated_at = now()
 WHERE slug IN ('citi', 'citi-thankyou');

SELECT slug,
       jsonb_array_length(transfer_partners_outbound) AS outbound_count,
       transfer_partners_verified_at::date AS verified_on
  FROM programs
 WHERE slug IN ('citi', 'citi-thankyou');
