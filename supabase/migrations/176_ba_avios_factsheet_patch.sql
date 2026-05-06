-- BA Avios comprehensive patch from Copilot fact-sheet cross-check.
--
-- Round 2 fact-check (BA Master Fact Sheet doc) verified against ba.com +
-- official sources surfaced several gaps and a few corrections:
--
-- ADDITIONS (Copilot was right):
--   - Blue is the entry tier (free to join)
--   - Gold Guest List (GGL) - 65,000 TP qualify / 40,000 retain (with 52K/32K
--     from BA flights). Annual ultra-elite tier above Gold.
--   - Per-tier Avios earning on BA flights: Blue 6 / Bronze 7 / Silver 8 /
--     Gold 9 per £1 of eligible spend (replaces the old % bonus model)
--   - Household Accounts pool Avios among up to 7 members
--   - Combine My Avios programs full list: BA / Iberia / Aer Lingus / Vueling /
--     Loganair / Qatar Privilege Club / Finnair Plus
--   - 355-day booking window
--   - Milestone Avios bonuses (5,500 / 11,000 / 16,000 TP earned)
--   - Reward Flight Saver guaranteed seats per flight (8 econ / 4 biz / 2 PE
--     from LHR/LGW; 2+2 from LCY)
--   - Fiji Airways (April 2025) + Oman Air (June 2025) joined oneworld
--   - Rebrand effective date: April 1, 2025 (announced December 30, 2024)
--
-- CORRECTIONS:
--   - Remove the unreliable "US-Tokyo JAL First class ~130,000-160,000 Avios"
--     number from sweet_spots. BA prices First class outside the standard
--     zone-banded chart and our number was extrapolated. Replaced with
--     LHR-JFK First (verified at 150K Avios return / 75K one-way per
--     ba.com post-December 2025 devaluation).
--
-- NOT INCLUDED (Copilot was wrong - confirmed in their own self-audit):
--   - US Bank Altitude Reserve as Avios partner (announced 2025, never launched)
--   - Bank of America Premium Rewards as Avios partner (never has been)
--   - Diners Club (negligible US presence)
--
-- The "5 direct + Citi indirect via Qatar" transfer-partner count stays as
-- already authored.

update programs set
  intro = replace(intro,
    'The British Airways Club (rebranded from "British Airways Executive Club" on December 30, 2024)',
    'The British Airways Club (rebrand was announced December 30, 2024 and took effect April 1, 2025, replacing the legacy British Airways Executive Club)'
  ),
  tier_benefits = '[
    {"name":"Blue (entry)","qualification":"Free to join","benefits":["Earn Avios on flights and partner activity","Earn tier points","Save preferences and booking history","Member-only offers","6 Avios per £1 on BA-marketed flights (eligible spend basis)"]},
    {"name":"Bronze","qualification":"3,500 tier points OR 25 qualifying BA flights within the April 1 - March 31 collection year","benefits":["oneworld Ruby","Priority airport check-in at BA-operated airports","Free seat selection 7 days before departure","7 Avios per £1 on BA flights"]},
    {"name":"Silver","qualification":"7,500 tier points OR 50 qualifying BA flights within the collection year","benefits":["oneworld Sapphire","Priority airport check-in across oneworld","Galleries Club / Business class lounge access on oneworld carriers worldwide for member + 1 guest","Free seat selection at booking","Priority boarding","8 Avios per £1 on BA flights","Extra checked baggage allowance"]},
    {"name":"Gold","qualification":"20,000 tier points within the collection year (no flight-count shortcut at the Gold tier)","benefits":["oneworld Emerald","Galleries First lounge access on oneworld worldwide for member + 1 guest","First class check-in and boarding","9 Avios per £1 on BA flights","Guaranteed Economy seat on BA flights when booked 24+ hours in advance","Additional Reward Flight inventory beyond the published guarantees","Extra 20 kg checked baggage allowance"]},
    {"name":"Gold Guest List (GGL)","qualification":"65,000 tier points to qualify (with at least 52,000 from BA-marketed flights, BA Holidays, or qualifying add-ons). 40,000 tier points to retain (32,000 from BA flights). Annual.","benefits":["All Gold benefits","Concorde Room access at LHR T5 and JFK T7 when traveling on BA-operated flights","Additional Reward Flight inventory beyond standard Gold","Invitation-only events"]},
    {"name":"Gold for Life","qualification":"550,000 lifetime tier points (introduced when The British Airways Club launched April 1, 2025)","benefits":["All Gold tier benefits, permanently","Status retained regardless of annual flight activity","Lifetime oneworld Emerald reciprocity"]}
  ]'::jsonb,
  quirks = quirks || '
- **Blue tier is free to join** as an entry-level membership - earn Avios + tier points without status benefits.
- **Household Accounts** pool Avios among up to 7 household members (separate from the per-tier benefits, available to any member regardless of status).
- **Milestone Avios bonuses** earned during the collection year: 2,500 bonus Avios at 5,500 tier points, 4,000 bonus Avios at 11,000 tier points, 5,000 bonus Avios at 16,000 tier points.
- **Per-tier Avios earning on BA-marketed flights** (eligible spend = base fare + BA-imposed surcharges + seat / bag fees, excludes airport charges and government taxes): Blue 6 / Bronze 7 / Silver 8 / Gold 9 Avios per £1.
- **Reward Flight Saver guaranteed seats** from LHR / LGW: 8 Economy + 2 Premium Economy + 4 Business (Club Europe / Club World) per flight. From LCY: 2 Business + 2 Economy. Gold members access additional inventory beyond these guarantees.
- **355-day booking window** for both revenue and Avios reward bookings.
- **Combine My Avios** lets you transfer Avios 1:1 between BA, Iberia, Aer Lingus, Vueling, Loganair, Qatar Privilege Club, and Finnair Plus accounts. New 30-day account-age requirement applies as of 2026. Qatar and Finnair transfers historically routed through BA; as of late 2025 some pairings transfer directly.
- **oneworld 2025 additions:** Fiji Airways (joined April 2025) and Oman Air (joined June 2025) - both now Avios earning + redemption partners.',
  sweet_spots = replace(sweet_spots,
    '- **US-Tokyo JAL First class** - approximately 130,000-160,000 Avios one-way (priced higher on the multi-carrier chart vs other oneworld partners but still competitive given JAL F is premium-cabin gold).',
    '- **LHR-JFK First class off-peak** - 150,000 Avios round-trip / 75,000 one-way (verified post-December 2025 devaluation per ba.com), plus £400-1,000+ in cash YQ. The cash YQ is what makes this redemption math less attractive than partner-metal alternatives.'
  ),
  award_chart = replace(award_chart,
    '- US-Tokyo JAL First class: ~130,000-160,000 Avios one-way (multi-carrier chart, premium pricing)',
    '- LHR-JFK First class off-peak: 150,000 Avios round-trip / 75,000 one-way (BA prices First outside the standard zone-banded chart - confirm at ba.com before booking)'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ba-avios';
