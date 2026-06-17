-- Seed + activate the Leading Hotels of the World "Leaders Club" hotel program page
-- (authored 2026-06-17). Sourced from the OFFICIAL lhw.com pages scraped via
-- research-program.mjs: Benefits Comparison (compare-benefits), How It Works, and the
-- full Leaders Club FAQ/T&C, plus the official Citi ThankYou transfer-partners page
-- (confirms Leaders Club as a live Citi hotel transfer partner). ASCII-only.
--
-- PROGRAM SHAPE NOTES:
--  * Leaders Club was rebuilt in 2024: the old ~USD 175 annual fee was dropped and it
--    became a FREE, points-earning program. Earn 1 pt per USD 1 room rate; redeem for
--    dynamically-priced reward nights starting ~4,000 pts (~8 cents/pt of value).
--  * NO award chart - pricing is fully dynamic (tracks each hotel's cash rate).
--  * Public tiers are ONLY Club + Sterling (the official compare page shows these two).
--    The blog-rumored invite-only "Aurelian" tier is NOT published by LHW - dropped.
--  * NO outbound transfers (LHW points cannot convert to airlines) -> outbound empty.
--    The ONLY transfer-IN partner is Citi ThankYou; that relationship is already modeled
--    on the 'citi' currency row (premium 1:0.2, no-AF 1:0.14, with per-card tiers) and
--    surfaces here automatically via getInboundTransferSources(). Nothing to author here.
--  * NO co-brand credit card exists for Leaders Club.

update programs set
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.lhw.com/leaders-club/how-it-works',
  intro = 'Leading Hotels of the World is not a chain - it is a curated collective of 400-plus independently owned luxury hotels across 80-plus countries, the kind of places with a name and a story rather than a logo over the entrance (Le Sirenuse on the Amalfi Coast, The Gritti Palace in Venice). Its loyalty program, Leaders Club, was rebuilt in 2024: the old USD 175 annual fee vanished and it became a free, points-earning program anyone can join. You earn 1 point per dollar on the room rate, cash points in toward reward nights starting around 4,000, and pick up on-property perks - continental breakfast for two, a shot at an upgrade, late checkout when the hotel can swing it. It will not out-earn Hyatt or Bonvoy on volume, but it is the only points game that touches these independent-luxury properties at all - and it quietly transfers in from Citi ThankYou.',
  how_to_spend = '- **Reward nights (the main event):** Redeem points for nights at any participating Leading Hotel. Pricing is dynamic - there is no fixed category chart - starting around 4,000 points per night and scaling with the hotel''s published cash rate (roughly 8 cents of value per point). Use the "View with Points" tool on LHW.com to see the exact points cost for your dates.
- **Multi-room and multi-night redemptions:** If you have the points, you can book as many rooms as you like on a single reward stay. Reward nights are fully cancellable for a points refund as long as you cancel before check-in.
- **Mix paid and award nights:** Book some nights on cash and others on points in the same stay - just note the hotel may move you between room categories if the paid and award rooms differ.
- **Gift points:** You can buy and gift points in 1,000-point increments to another member''s account.
- Reward stays still deliver your on-property member benefits (breakfast, WiFi), but they do not earn points.',
  sweet_spots = '- **Buy-points arbitrage during a bonus.** LHW lists points around 12 cents, but runs frequent 100% buy bonuses that drop the effective cost to about 6 cents - while redemptions are worth roughly 8 cents. When a bonus is live, topping up to book an aspirational property can undercut the cash rate by 20-25%. Only worth it if you have a specific stay in mind.
- **High-rate luxury properties.** Because redemption value tracks the cash rate, points stretch furthest at the eye-watering icons - an Amalfi or Lake Como summer night, a Tokyo or Paris splurge - where 8 cents a point beats paying rack rate.
- **Citi ThankYou transfers, situationally.** Eligible US Citi cardholders can move ThankYou points to Leaders Club, and Citi runs periodic 25% transfer bonuses (the most recent ran April through May 16, 2026). The base ratio is poor, so this only makes sense to top off an account during a bonus, and only with a redemption already picked out.
- **Pre-arrival upgrades at marquee hotels.** Your annual pre-arrival upgrade is confirmed before you travel - not a check-in gamble - and at a property where a one-category bump means a sea view or a substantially nicer room, that is real money.',
  tier_benefits = '[
    {"name":"Club","qualification":"Free to join; no spend requirement. Benefits begin with your first qualifying stay.","benefits":["Earn 1 Leaders Club point per USD 1 on qualifying room rates (up to 3 rooms per booking)","Daily continental breakfast for two","Upgrade priority at arrival (one room category, subject to availability)","One pre-arrival upgrade per year - unlocked after your first paid stay, then reissued each January","Early check-in and late check-out considerations (subject to availability)","Complimentary in-room WiFi","SIXT Gold status match for car rental","Members-only rates and sales"]},
    {"name":"Sterling","qualification":"Spend at least USD 5,000 on qualifying room rates in a calendar year. Status runs from the day you earn it through December 31 of the following year.","benefits":["All Club benefits","Five pre-arrival upgrades per year (instead of one)","5% stay bonus on points (in addition to the base 1 point per USD 1)","SIXT Platinum status match for car rental"]}
  ]'::jsonb,
  lounge_access = 'Leaders Club has no program-wide lounge or club-lounge benefit - Leading Hotels of the World is a collection of independent properties, not a chain with a shared executive-lounge standard. Any club or executive lounge access depends entirely on the individual hotel and the room category you book; it is not conferred by Leaders Club membership or status. The closest thing to a portable status perk is the SIXT car-rental status match (Gold for Club, Platinum for Sterling), which has nothing to do with airport or hotel lounges. If lounge access matters for a specific stay, confirm it directly with the property.',
  quirks = '- **Program was rebuilt in 2024.** The old paid Leaders Club (around USD 175 a year, with richer fixed benefits) was replaced by today''s free, points-based program. Some long-time members consider the new version a downgrade on guaranteed perks - weigh older blog write-ups accordingly.
- **No award chart - pricing is fully dynamic.** Reward-night cost tracks each hotel''s published cash rate, starting around 4,000 points. Always check the points cost for your specific dates with the "View with Points" tool on LHW.com.
- **Points expire after 24 months** of no earning or redemption activity.
- **Benefits attach to the member''s room only,** and only on eligible rates. Public and members-only rates earn points and benefits; corporate or negotiated rates earn points but not the other on-property benefits; OTA, group, prepaid-agency, and phone-with-the-hotel bookings earn neither.
- **Pre-arrival upgrades have rules.** One category only, never into or within a suite or villa, request at booking and no later than 3 days (00:00 UTC) before arrival, and not available on reward nights. If LHW cannot confirm it, the upgrade is re-credited and you receive 500 points.
- **You can buy points** in 1,000-point increments up to 50,000 per calendar year - useful only alongside a buy bonus and a planned redemption.
- **Citi ThankYou is the only transfer-in partner,** and the ratio is unfavorable (premium Citi cards: 1,000 ThankYou = 200 points; no-annual-fee Citi cards earn less). There is no Leaders Club co-brand credit card.
- **SIXT status match** (Gold for Club, Platinum for Sterling) is the one perk you can use away from the hotels.',
  award_chart = 'Leading Hotels of the World publishes NO award category chart - reward-night pricing is fully dynamic and tracks each Member Hotel''s published cash rate for your specific dates.

- **Entry point:** reward nights start at approximately 4,000 points per night.
- **Value:** points redeem at roughly 8 US cents each against the cash rate (some high-rate properties reach about 9 cents).
- **How to price a stay:** use the "View with Points" feature on LHW.com - it shows the exact points needed per eligible room for your dates.
- **Earning rate:** 1 point per USD 1 of room-rate spend (Sterling members add a 5% bonus); maximum 3 rooms per booking. No points are earned on on-property spend.
- **Buying points:** list price is about 12 cents per point; LHW runs frequent 100% buy bonuses that cut the effective cost to about 6 cents (1,000-point increments, up to 50,000 points per calendar year).
- **Transfer in:** eligible US Citi ThankYou cardholders can transfer to Leaders Club (premium Citi cards at 1,000:200; less for no-annual-fee Citi cards), with periodic 25% transfer bonuses.

There are no peak/off-peak bands or published per-property point prices - the cash rate is effectively the chart.',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  is_active = true,
  content_updated_at = now(),
  last_verified = current_date,
  updated_at = now()
where slug = 'leading-hotels';
