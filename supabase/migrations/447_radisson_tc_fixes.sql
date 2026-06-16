-- Radisson Rewards (global) reconciliation against the FULL official T&C (effective
-- 18 July 2023) + the official Airline Miles redemption page, both pasted by Jill
-- 2026-06-15. Resolves all four flags from migration 446. Still held inactive +
-- content_updated_at unset until final activation. ASCII-only.
--
-- CONFIRMED from official T&C:
--  * Earning: Club 8 / Premium 27 / VIP 36 points per USD (Discount Booster active:
--    Premium 9, VIP 12). Prize by Radisson brand: Club 4 / Premium 13.5 / VIP 18
--    (booster 4.5 / 6). Meetings & Events: 5 pts/USD, max 250,000 per event.
--  * Tiers (12-month rolling): Premium = 5 Eligible Nights OR 3 Eligible Stays;
--    VIP = 30 Eligible Nights OR 20 Eligible Stays. Club is automatic on enrollment.
--  * Airline transfers: 10 Radisson : 1 mile, auto-redeemed in 10,000-pt increments;
--    SAS EuroBonus exception 7 : 1 in 7-pt increments; max 1,000,000 pts/yr to miles;
--    Lufthansa Miles & More barred for the account lifetime if points were ever
--    purchased or gifted.
--  * Redemption: dynamic (no chart); Pay-with-Points min 10 pts; online Award Night
--    redemption capped at USD 600/night value (above that, redeem at the front desk).
--  * Early check-in / late check-out = 2 hours either side. Free breakfast-for-two is
--    VIP-only. F&B discount has NO stated percentage in the T&C (dropped the "10%").
--  * Points expire after any 24-month period with no activity. Member-to-member point
--    transfer allowed (max 5 members/month; receive max 100,000/month; 30-day min
--    membership). Russia properties excluded. Refer-a-friend = 1,000 pts each
--    (max 50,000 pts/yr).

update programs set
  how_to_spend = '- **Award Nights (dynamic pricing):** Redeem points for free nights at participating Radisson Blu, Radisson Collection, Radisson RED, Park Plaza, Park Inn, Country Inn & Suites, and Prize by Radisson properties across EMEA / Asia Pacific. Points required track the cash rate - no fixed chart. Online/app/Contact-Center redemption covers stays up to USD 600/night; for pricier rooms you redeem at the hotel front desk.
- **Pay with Points:** Pay for part or all of a stay, or for services and Meetings & Events charges, at checkout - minimum 10 points.
- **Transfer to airline miles:** Convert at 10 Radisson points = 1 mile, auto-redeemed in 10,000-point increments; SAS EuroBonus is more favorable at 7 points = 1 point (7-point increments). Max 1,000,000 points per calendar year to miles. Note: if you have ever purchased or been gifted points, you are barred for life from transferring to Lufthansa Miles & More.
- **Donate to charity:** Donate points to designated non-profit organizations (not tax-deductible).
- **Partner rewards:** Redeem with program partners where offered.',
  sweet_spots = '- **Fast track to VIP:** Top-tier VIP needs just 30 nights or 20 stays in a rolling 12 months - reachable in one active travel year, and it unlocks free breakfast-for-two on every night plus the best available room.
- **Discount Booster on cash stays:** Premium/VIP members can toggle Discount Booster for up to a ~20% instant discount - you earn fewer points (9/$ Premium, 12/$ VIP) in exchange, so it shines when you are paying cash and not chasing a balance.
- **Dynamic redemption on pricey European nights:** Because points track the cash rate, value holds up on expensive Radisson Blu / Collection nights in London, Paris, or the Gulf rather than being capped by a chart.
- **SAS EuroBonus is the best transfer:** At 7:1, SAS is the standout airline conversion (vs 10:1 elsewhere) - worth it only when you have a specific EuroBonus redemption planned.',
  tier_benefits = '[
    {"name":"Club","qualification":"Entry tier - automatic on enrollment; earns 8 points per USD (4 at Prize by Radisson)","benefits":["8 points per USD on eligible room charges and food & beverage charged to the room","Member Only Rate - save up to 15% on direct bookings","Food & beverage discount at participating hotel restaurants","Priority Line at the front desk (select properties / online check-in)","Points redeemable for dynamically priced Award Nights and Pay-with-Points (min 10 points)","Refer a friend: 1,000 bonus points each (up to 50,000/yr)"]},
    {"name":"Premium","qualification":"5 Eligible Nights OR 3 Eligible Stays in a rolling 12 months; earns 27 points per USD (13.5 at Prize)","benefits":["27 points per USD (9 per USD when Discount Booster is active)","Everything in Club","Free room upgrade subject to availability (suites only at select properties)","Early check-in and late check-out - 2 hours either side, subject to availability","Discount Booster - toggle on for up to ~20% off direct bookings","My Favorite Hotel perks: Priority List, favorite-room assignment, and post-stay luggage storage","24/7 Premium exclusive contact center"]},
    {"name":"VIP","qualification":"30 Eligible Nights OR 20 Eligible Stays in a rolling 12 months; earns 36 points per USD (18 at Prize)","benefits":["36 points per USD (12 per USD when Discount Booster is active)","Everything in Premium","Free breakfast for two on every night of an eligible stay","Best available room, sometimes including suites","Exclusive VIP access to hotel areas (select properties)","Free express ironing - one item per stay at Radisson Collection, art''otel, and Holmes Hotel properties","24/7 VIP exclusive contact center"]}
  ]'::jsonb,
  award_chart = 'Radisson Rewards (global) uses DYNAMIC redemption - there is no fixed category chart. Points work like currency: if a room can be booked for cash it can generally be booked on points, with the points price floating alongside the cash rate. Online, app, and Contact-Center Award Night redemptions cover stays valued up to USD 600/night; for higher-priced rooms you redeem at the hotel front desk. Pay-with-Points works for partial or full payment at checkout with a 10-point minimum. EARNING is tier-based: Club 8, Premium 27, VIP 36 points per USD (Discount Booster active: Premium 9, VIP 12); Prize by Radisson brand earns at half those rates; Meetings & Events earn 5 points/USD up to 250,000 per event. Airline transfers run 10 Radisson points = 1 mile (auto-redeemed in 10,000-pt increments), with SAS EuroBonus more favorable at 7:1; maximum 1,000,000 points per calendar year to miles. Points expire after any 24-month period with no account activity. British Airways / Avios was removed as a transfer partner in September 2025.',
  quirks = '- **Two programs, one old name:** Radisson Rewards (this program) covers EMEA + Asia Pacific only; Americas properties moved to Choice Privileges in 2023. Separate currencies.
- **Dynamic redemption, no chart:** Points track the cash rate, so value is steadiest on expensive nights. Online redemption is capped at USD 600/night value - pricier award stays must be booked at the front desk.
- **Points expire on inactivity:** Points are voided after any 24-month period with no earning or redemption activity; any qualifying activity resets the clock.
- **Discount Booster is a trade-off:** Toggling it on cuts your earning (Premium 27 -> 9/$, VIP 36 -> 12/$) in exchange for up to ~20% off - good for cash stays, bad if you are building a balance.
- **Avios is gone:** Radisson dropped British Airways / Avios as a transfer partner in September 2025 - older guides still list it.
- **Member-to-member transfers:** You can transfer points to up to 5 members per month and receive up to 100,000/month, after 30 days of membership - a limited pooling workaround.
- **Miles & More catch:** If you have ever purchased or been gifted Radisson points, you are barred for the account lifetime from transferring to Lufthansa Miles & More.
- **Airline transfers are a bridge, not a profit center:** 10:1 (7:1 for SAS) is fine when you have a redemption planned, not a high-value default - keep points for hotel nights unless a transfer bonus is running.
- **Russia excluded; thin in the Americas:** No Russian properties participate, and US/Canada/LatAm Radisson stays earn Choice Privileges, not these points.',
  transfer_partners_outbound = '[
    {"from_slug":"sas","ratio":"7:1","notes":"To SAS EuroBonus - the single most favorable ratio (7 Radisson points = 1 EuroBonus point), auto-redeemed in 7-point increments. No transfer tax. Confirmed on the official Airline Miles redemption page.","bonus_active":false},
    {"from_slug":"flying-blue","ratio":"10:1","notes":"To Air France-KLM Flying Blue (10 Radisson points = 1 mile), auto-redeemed in 10,000-point increments. No transfer tax. Confirmed partner (Head for Points 2025).","bonus_active":false},
    {"from_slug":"miles-and-more","ratio":"10:1","notes":"To Lufthansa Miles & More (10:1), in 10,000-point increments. BARRED for the account lifetime if you have ever purchased or been gifted Radisson points. No transfer tax. Named on the official Airline Miles page.","bonus_active":false}
  ]'::jsonb,
  last_verified = current_date,
  updated_at = now()
where slug = 'radisson';
