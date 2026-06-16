-- Seed the Radisson Rewards (GLOBAL / non-Americas) hotel program page (authored
-- 2026-06-15 from official radissonhotels.com/en-us/rewards + Head for Points 2026
-- guide + OMAAT transfer guide). Held is_active=false + content_updated_at unset
-- until Jill's T&C verification pass (the page route 404s a program until
-- content_updated_at is set, so it stays private). ASCII-only.
--
-- IMPORTANT CONTEXT: Radisson Rewards split in 2022-2023. The AMERICAS program was
-- merged into Choice Privileges (slug 'choice', already live) in July 2023. THIS row
-- ('radisson') is the surviving GLOBAL program: Europe, Middle East, Africa, Asia
-- Pacific. The 'radisson-americas' row is retired at the bottom of this file.
--
-- FLAGGED FOR T&C VERIFICATION (resolve from Jill's pasted official pages):
--  (1) Exact earning rates per tier - blogs conflict (8/27/36 vs flat 20 pt/$1).
--  (2) Exact tier qualification thresholds (stays/nights/tier-points for Premium, VIP).
--  (3) Full current airline-transfer roster + ratios - Avios was DROPPED Sept 2025;
--      only Flying Blue (10:1), SAS (7:1) confirmed. Need the official Convert-to-Miles
--      page to complete the roster.
--  (4) Free-night / dynamic-redemption mechanics and any min-points floor.

update programs set
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.radissonhotels.com/en-us/rewards/redeem',
  intro = 'Radisson Rewards is the loyalty program for Radisson Hotel Group everywhere OUTSIDE the Americas - think Radisson Blu, Radisson Collection, Radisson RED, Park Inn, Park Plaza, and Country Inn & Suites across Europe, the Middle East, Africa, and Asia Pacific. (If you are booking a Radisson in the US, Canada, or Latin America, that is a different animal: those properties moved to Choice Privileges in 2023.) The global program runs three tiers - Club, Premium, and VIP - and in 2026 it switched to dynamic redemption, so points work like cash: if a room is available to book, it is available on points, with the price floating alongside the cash rate. The headline perk is how fast you climb - top-tier VIP is reachable in a single busy travel year - and a genuinely useful airline-transfer option for turning hotel points into miles. The catch: the footprint is thin outside Europe and Asia, and points expire after two years of inactivity.',
  how_to_spend = '- **Free nights (dynamic pricing):** Redeem points for award nights at any participating Radisson Blu, Radisson Collection, Radisson RED, Park Inn, Park Plaza, or Country Inn & Suites property in EMEA / Asia Pacific. The points required track the cash rate - no fixed category chart.
- **Points + Cash:** Cover part of a stay with points and the rest with cash on eligible rates.
- **Transfer to airlines:** Convert points to airline miles (base roughly 10 Radisson points = 1 mile; SAS is more favorable). Useful when you would rather have miles than a hotel night. (Current partner list + ratios: verify on the official Convert to Miles page - Avios was dropped in September 2025.)
- **Experiences, gift cards, and more:** Redeem for partner rewards and gift cards via the rewards catalog where offered.',
  sweet_spots = '- **Fast track to VIP:** Few major hotel programs hand you top-tier elite as quickly - a single active travel year of stays can get you to VIP, unlocking free breakfast on every stay and the best available room.
- **Discount Booster on paid stays:** Toggle Discount Booster to trade a slice of your earning for a bigger instant discount (up to ~20% for Premium/VIP) - strong when you are paying cash and not chasing points.
- **Dynamic redemption on pricey European nights:** Because points track the cash rate, redemptions hold steady value on expensive Radisson Blu / Collection nights in London, Paris, or the Gulf rather than being capped by a chart.
- **Hotel-points-to-miles bridge:** When an airline runs a transfer bonus, the 10:1 airline conversion can be a back door into miles for a redemption you actually have planned.',
  tier_benefits = '[
    {"name":"Club","qualification":"Entry tier - free to join","benefits":["Member-only rates on direct bookings","Earn points on eligible stays and on food & beverage charged to the room","Free Wi-Fi","Mobile check-in where available","Points redeemable for free nights with no fixed award chart"]},
    {"name":"Premium","qualification":"Mid tier (qualification threshold: verify on official terms)","benefits":["Higher points earning than Club","Member-only rate of up to ~15%","Free room upgrade subject to availability","10% food & beverage discount","Priority line / priority service","Discount Booster up to ~20%","Free early check-in and late check-out subject to availability"]},
    {"name":"VIP","qualification":"Top tier (qualification threshold: verify on official terms)","benefits":["Highest points earning","Free breakfast on all stays","Best available room, sometimes including suites","All Premium benefits","Enhanced upgrade priority","Discount Booster up to ~20%"]}
  ]'::jsonb,
  lounge_access = 'Radisson Rewards does not run a chain-wide executive-lounge program the way Hilton or Marriott do - lounge access is property-dependent rather than a published tier benefit. Many Radisson Blu and Radisson Collection hotels operate a Business Class or club-style lounge, but eligibility is set hotel-by-hotel, not by Rewards tier. (Confirm any lounge entitlement on the specific property page; do not assume elite status alone grants lounge access.)',
  quirks = '- **Two programs, one old name:** Radisson Rewards (this program) covers EMEA + Asia Pacific only. Americas properties are on Choice Privileges since the 2022-2023 split - the two currencies are separate.
- **Dynamic redemption, no chart:** As of 2026 there is no fixed category award chart - points track the cash rate, so value is steadiest on expensive nights.
- **Points expire on inactivity:** Points are voided after any 24-month period with no earning or redemption activity; any qualifying activity resets the 24-month clock.
- **Avios is gone:** Radisson dropped British Airways / Avios as a transfer partner in September 2025 - older guides still list it. Verify the live partner roster before planning a transfer.
- **Airline transfers are a bridge, not a profit center:** ~10:1 to miles is fine when you have a specific redemption planned, but it is not a high-value default - keep points for hotel nights unless a transfer bonus is running.
- **Thin in the Americas:** For US/Canada/LatAm Radisson stays, you earn Choice Privileges, not these points.',
  award_chart = 'Radisson Rewards (global) uses DYNAMIC redemption rather than a fixed category chart. As of 2026, points function like currency: if a room is available to book with cash, it is generally available on points, with the points price floating alongside the prevailing cash rate. There are therefore no fixed off-peak / standard / peak point bands to publish. Redemption value per point varies by property and date - verify current pricing live on radissonhotels.com rather than relying on a fixed figure. Airline transfers run at roughly 10 Radisson points = 1 airline mile (SAS more favorable at about 7:1); British Airways / Avios was removed as a partner in September 2025. (Exact earning rates per tier and the full current transfer roster: verify on official terms.)',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[
    {"from_slug":"flying-blue","ratio":"10:1","notes":"To Air France-KLM Flying Blue (about 10 Radisson points = 1 mile). No transfer tax. Verify ratio + minimums on the official Convert to Miles page.","bonus_active":false},
    {"from_slug":"sas","ratio":"7:1","notes":"To SAS EuroBonus - the most favorable published ratio (about 7 Radisson points = 1 point). No transfer tax. Verify on the official Convert to Miles page.","bonus_active":false},
    {"from_slug":"miles-and-more","ratio":"10:1","notes":"To Lufthansa Miles & More (about 10:1). Verify - partner roster shifts; confirm on the official Convert to Miles page.","bonus_active":false}
  ]'::jsonb,
  last_verified = current_date,
  updated_at = now()
where slug = 'radisson';

-- Retire the Radisson Rewards Americas skeleton (merged into Choice Privileges,
-- July 2023). It is already inactive + never authored, so it never renders; this
-- just records the disposition for future audits.
update programs set
  intro = 'RETIRED: Radisson Rewards Americas was merged into Choice Privileges (slug ''choice'') in July 2023. Members and points (at 2:1) moved to Choice Privileges, which is the active loyalty program for Radisson-brand properties in the US, Canada, and Latin America. Do not author this row; see the ''choice'' program page and the global ''radisson'' (Radisson Rewards) page.',
  is_active = false,
  updated_at = now()
where slug = 'radisson-americas';
