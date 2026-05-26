-- Seed Hilton Honors program page (slug='hilton', type='hotel').
--
-- Source-of-truth hierarchy:
-- 1. Official Hilton: hilton.com/en/hilton-honors/member-benefits (tiers),
--    hilton.com/en/hilton-honors/terms (5th-night-free rules, Executive
--    Lounge rules, expiration), stories.hilton.com (Diamond Reserve
--    announcement, America's 250th anniversary promo, Explora partnership).
--    All scraped 2026-05-26 via research-program.mjs.
-- 2. Third-party (where Hilton's URLs 404'd or topic isn't on hilton.com):
--    Award Travel Finder + NerdWallet (inbound transfer ratios), Upgraded
--    Points + LoyaltyLobby (2026 program changes timing), Amex.com (card
--    details), TPG / OMAAT / Frequent Miler / View From The Wing (sweet
--    spots, devaluation observations).
-- 3. ChatGPT fact-check pass: applied corrections to bonus end-date,
--    YOTEL tense (future not present), Lifetime Diamond terms, and
--    dropped the unverifiable "3 devaluations in <12 months" count.
--
-- Dynamic pricing: Hilton publishes no category chart. award_chart field
-- frames the observed point ranges per brand/property class with explicit
-- "dynamic pricing" callout so the writer/fact-checker don't quote ranges
-- as fixed bands.
--
-- Inbound transfer notes mention transfer-tax status per
-- feedback_capture_transfer_fees.md. Hotel-to-airline transfers have no
-- US federal excise tax; Amex MR -> Hilton is hotel destination so no tax.

update programs
   set is_active = true,
       content_updated_at = now(),
       last_verified = current_date,
       alliance = 'none',
       intro = $intro$Hilton Honors is the largest hotel loyalty program in the world by member count - and one of the easiest to earn points in, but among the trickiest to redeem well. Hilton runs fully dynamic pricing (no published chart), so the same room can cost 70,000 points one weekend and 130,000 the next. The wins come from knowing where the math holds up: Hampton Inns in secondary US cities, all-inclusive Caribbean resorts before peak weeks, and the every-5th-night-free rule that turns a 5-night Cancun stay into a 4-night spend. The losses come from booking a top-tier property without checking - what once capped at 95K now drifts well into 200K+ territory.

For 2026, Hilton overhauled the program: Gold dropped from 40 to 25 nights, Diamond from 60 to 50, rollover nights ended, and a new Diamond Reserve tier (80 nights + $18,000 annual spend) landed at the top with Confirmable Upgrade Rewards as the headline perk. The relevant move for points-and-miles people is the Amex Hilton trio (no-AF, Surpass, Aspire) - earn rates of 7x to 14x at Hilton plus Diamond status comp on Aspire keep the redemption math workable even with the latest devaluations.$intro$,
       transfer_partners = $tp$[
  {"from_slug": "amex", "ratio": "1:2", "bonus_active": true, "notes": "Standard ratio is 1:2 (1,000 Amex MR = 2,000 Hilton Honors). 20% transfer bonus running through May 30, 2026 (effective 1:2.4). Hotel destination - no US federal excise tax."},
  {"from_slug": "bilt", "ratio": "1:1", "bonus_active": false, "notes": "Direct 1:1 transfer. Hotel destination - no US federal excise tax."},
  {"from_slug": "virgin_atlantic", "ratio": "2:3", "bonus_active": false, "notes": "Virgin Atlantic Flying Club transfers to Hilton at 2:3 (Virgin -> Hilton). Used as an indirect path for Chase UR holders (Chase UR -> Virgin 1:1, then Virgin -> Hilton 2:3, net Chase -> Hilton approximately 1:1.5). No transfer fee on the Virgin -> Hilton leg."}
]$tp$::jsonb,
       transfer_partners_outbound = $tpo$[
  {"from_slug": "alaska", "ratio": "10:1", "bonus_active": false, "notes": "Hotel-to-airline transfers from Hilton are 10:1 across nearly all partners. Almost never the right move - your Hilton points are typically worth more as Hilton stays than as airline miles."},
  {"from_slug": "american-airlines", "ratio": "10:1", "bonus_active": false, "notes": "10:1 ratio. See category note above."},
  {"from_slug": "united-airlines", "ratio": "10:1", "bonus_active": false, "notes": "10:1 ratio."},
  {"from_slug": "delta", "ratio": "10:1", "bonus_active": false, "notes": "10:1 ratio."},
  {"from_slug": "virgin_atlantic", "ratio": "10:1.5", "bonus_active": false, "notes": "Slightly better outbound ratio than the standard 10:1, but still poor value vs. redeeming for Hilton stays."}
]$tpo$::jsonb,
       how_to_spend = $hts$- **Standard Reward Stays** - book entirely with points at any Hilton property. Pricing is fully dynamic (varies by demand, no chart).
- **Points & Money Rewards** - pay part points / part cash on the same booking. Useful when you are short on points and want to stretch.
- **5th Night Free on award stays** (Silver tier and above) - 5+ consecutive nights on points means the 5th, 10th, 15th, and 20th nights are free. Capped at 20 consecutive nights per reservation. Points-only stays (not Points & Money). Must be at the same property.
- **Premium Room Rewards** - upgrade from standard room to suite, club, or specialty room at a higher point cost. Subject to availability.
- **Confirmable Upgrade Rewards** (Diamond Reserve only as of 2026) - lock in a suite upgrade at booking, up to a one-bedroom suite for 7 nights. Transferable to another Honors member. Expires 12 months after issuance.
- **Free Night Reward (FNR) certificates** - earned via Amex Hilton Surpass (anniversary plus $15,000 calendar-year spend) and Amex Hilton Aspire (anniversary plus additional certificates at spend thresholds). Aspire FNRs have no points cap.
- **Hilton Honors Experiences** - limited drops on experiences.hiltonhonors.com. Special promo runs occasionally land in the 250-point range; aspirational packages run 200K+ points.
- **Transfer to airlines** - 10:1 ratio across most airline partners. Almost never the right move - Hilton points hold more value as Hilton stays.$hts$,
       sweet_spots = $ss$- **Hampton Inn / Spark by Hilton in secondary US cities** - typically 15,000 to 30,000 points per night for a clean, reliable room. Best value-per-point on the program. Pair with the 5th-night-free rule on 5+ night stays for road trips.
- **Caribbean all-inclusive resorts** - Hilton Cancun Mar Caribe, Hilton Tulum Riviera Maya, and Mangrove Beach Curacao typically run 95,000 to 130,000 points per night for all-inclusive (food, drinks, activities included). Cash rates around $650+/night at these properties make the per-point math work even at the top of the range. Always run the 5th-night-free trick on 5+ night stays.
- **Small Luxury Hotels (SLH) within Hilton** - adults-only Hermitage Bay Antigua and similar SLH properties open up at 150,000+ points. Aspirational redemptions where points can hit 0.8+ cents per point.
- **Hilton Experiences drops** - limited-time 250-point experiences (most recent: Hilton Honors America Experiences, 12 road trip packages launching May 26, 2026 tied to America's 250th anniversary). First-come, first-served via experiences.hiltonhonors.com.
- **20%+ Amex MR transfer bonuses** - when running, Amex Gold (4x dining and groceries) into Hilton at effective 1:2.4 means $1 spent earns 9.6 Hilton points. Only transfer when you have a specific Hilton stay booked or about to book - never transfer speculatively.
- **Free Night Reward (FNR) certificates from Amex Hilton Aspire** - no points cap, valid at any Hilton property including Conrad and Waldorf Astoria. The single best FNR in the cobranded card space.$ss$,
       tier_benefits = $tb$[
  {
    "name": "Member",
    "qualification": "Sign up free; no nights required",
    "benefits": [
      "Base earn 10 points per $1 at most Hilton brands (dropping to 5 points per $1 at Spark, Homewood Suites, and Hampton starting January 8, 2026)",
      "Hilton Honors app digital check-in and digital key",
      "Member-only rates and Hilton Honors discount"
    ]
  },
  {
    "name": "Silver",
    "qualification": "4 stays, 10 nights, or $2,500 USD eligible spend per calendar year",
    "benefits": [
      "20% bonus on base points earning",
      "5th Night Free on Standard Room Reward Stays of 5+ consecutive nights",
      "Two bottled waters per stay",
      "Elite Rollover Nights ended starting 2026 (2025 nights still rolled to 2026)"
    ]
  },
  {
    "name": "Gold",
    "qualification": "15 stays, 25 nights, or $6,000 USD eligible spend per calendar year (lowered from 40 nights in 2026)",
    "benefits": [
      "80% bonus on base points earning",
      "Daily Food & Beverage Credit at participating hotels (or free continental breakfast outside the US)",
      "Space-available room upgrades",
      "Milestone Rewards: 10,000 bonus points every 10 nights after 40 nights in a calendar year",
      "Gift Gold status to any Honors member after 60 nights in a calendar year",
      "5th Night Free on award stays"
    ]
  },
  {
    "name": "Diamond",
    "qualification": "25 stays, 50 nights, or $11,500 USD eligible spend per calendar year (lowered from 60 nights in 2026)",
    "benefits": [
      "100% bonus on base points earning",
      "Executive Lounge Access (where available) for Member plus 1 additional registered guest",
      "Space-available upgrades up to suite (subject to availability)",
      "Guaranteed 48-hour room availability (book at least 48 hours in advance)",
      "Gift Diamond status to any Honors member after 100 nights in a calendar year",
      "1-year Diamond extension available after 3 years at Diamond plus 250 lifetime nights or 500,000 lifetime base points"
    ]
  },
  {
    "name": "Diamond Reserve",
    "qualification": "80 nights or 40 stays AND $18,000 USD annual eligible spend (new tier in 2026; cannot be reached via cobranded credit card alone)",
    "benefits": [
      "120% bonus on base points earning",
      "Confirmable Upgrade Reward (CUR) - lock in suite upgrade at booking, up to one-bedroom suite for 7 nights",
      "Second CUR at 120-night milestone or for 30,000 points option",
      "CURs expire 12 months after issuance and are transferable to another Honors member",
      "Guaranteed 4 PM late checkout",
      "Stacks all Diamond benefits plus invitation-only experiences"
    ]
  },
  {
    "name": "Lifetime Diamond",
    "qualification": "10 years of Diamond status plus 1,000 lifetime nights or a lifetime base-points threshold (verify current threshold against Hilton lifetime status terms)",
    "benefits": [
      "Permanent Diamond status",
      "All standard Diamond benefits retained for life"
    ]
  }
]$tb$::jsonb,
       lounge_access = $la$**Executive Lounge access - Diamond and Diamond Reserve tiers** at participating Hilton properties with Executive Lounges (most full-service Hilton brand, Conrad, Waldorf Astoria, some DoubleTree). Includes Member plus one additional registered guest. Does NOT apply to Executive Lounge equivalents on Club / Executive floors where the room rate itself includes lounge access. Properties offering complimentary breakfast 7 days per week to elite members typically do not also offer the Daily Food & Beverage Credit (one or the other, not both).

**Note:** Hilton does not operate a unified lounge program like Marriott Bonvoy Sapphire or Hyatt Club Access. Lounge availability is per-property and not always staffed at all hours - verify before booking if lounge access is the main reason for choosing a particular Hilton stay.

For airport lounge access, the Amex Hilton Aspire Card grants Priority Pass Select membership (1,500+ airport lounges worldwide), which is the closest equivalent to a Sky Club or Centurion benefit.$la$,
       quirks = $q$- **Fully dynamic pricing, no chart** - there is no published category chart. The same property can vary 50,000 to 100,000+ points week to week. Always price the paid rate first to gauge whether the points cost is reasonable (target 0.5+ cents per point).
- **5th Night Free is points-only** - does not apply to Points & Money Rewards bookings or paid stays. Must be 5 consecutive nights at the same property, confirmed at time of booking.
- **Free Night Reward (FNR) certificates** - earned via the Amex Hilton Surpass (anniversary plus $15,000 calendar-year spend) and the Amex Hilton Aspire (anniversary plus additional certificates at spend thresholds). Aspire FNRs have no points cap; Surpass FNRs are subject to an annual Hilton points cap.
- **Points expire after 24 months of inactivity** - any earning or redemption activity resets the clock.
- **Rollover nights eliminated starting 2026** - 2025 nights still rolled to 2026, but going forward the status year resets fully at calendar year-end.
- **Diamond Reserve cannot be earned via credit card alone** - requires the $18,000 annual spend threshold on actual Hilton charges (not credit-card-spend across all categories).
- **Spark and Homewood Suites earning cut** - starting January 8, 2026, base earning at these brands dropped from 10 to 5 base points per $1.
- **No public status match program** - Hilton occasionally runs targeted status match offers but does not maintain a published match program.
- **Devaluations have been frequent** - top-tier properties now run well into 200,000+ points per night versus 95,000 just a couple years ago. Always price-check before booking.
- **YOTEL and Explora Journeys partnerships** - YOTEL earn/redeem integration is arriving by end of 2026 (not yet live). Explora Journeys cruises earn/redeem launches summer 2026.$q$,
       award_chart = $ac$Hilton Honors uses **fully dynamic pricing** for award stays. There is no published category chart - the points cost of a Standard Room Reward Stay varies by property, date, day of week, and demand.

**Observed point ranges by brand class (2026 — these are observational, not fixed bands):**

| Brand Class | Typical Range (per night) |
|---|---|
| Hampton Inn, Spark, Tru, Home2 Suites | 15,000 - 30,000 (secondary US markets); 35,000 - 50,000 (high-demand US) |
| Hilton Garden Inn, DoubleTree, Hilton (full-service) | 30,000 - 80,000 |
| Curio, Canopy, Tapestry (lifestyle) | 50,000 - 120,000 |
| Embassy Suites, Hilton resort properties | 50,000 - 150,000 |
| All-Inclusive Resorts (Cancun, Tulum, Riviera Maya, Curacao) | 80,000 - 130,000 (with all food, drinks, and activities) |
| Conrad, Waldorf Astoria | 95,000 - 250,000+ (urban / aspirational) |
| Small Luxury Hotels (SLH) on Hilton | 80,000 - 200,000 |

**Free Night Reward (FNR) caps** (the de-facto bands governing certificate eligibility):
- **Amex Hilton Surpass FNR** - valid at properties where standard room redemption is under an annual Hilton points cap. Earned at card anniversary plus an additional FNR after $15,000 in calendar-year spend.
- **Amex Hilton Aspire FNR** - no points cap; valid at any property including Conrad and Waldorf Astoria, subject to standard room availability.

**5th Night Free rule** - applies on award stays of 5+ consecutive nights for Silver-and-above members. Stack with the dynamic-pricing model by booking stays where the per-night cost is already strong (Hampton in secondary markets, all-inclusive resorts at shoulder season). Free nights apply to the 5th, 10th, 15th, and 20th nights; capped at 20 consecutive nights per reservation.$ac$
 where slug = 'hilton';
