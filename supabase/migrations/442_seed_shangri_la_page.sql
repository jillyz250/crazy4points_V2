-- Seed the Shangri-La Circle hotel program page (authored 2026-06-15 from official
-- shangri-la.com + 2026 blog cross-check). Dynamic award pricing (no fixed chart).
-- Kept is_active=false until Jill's T&C verification pass; ASCII-only.
-- FLAGGED FOR T&C VERIFICATION: exact points-to-cash value, full inbound transfer
-- roster + ratios (only Atmos confirmed, via the Atmos Summit card), Jade-tier
-- benefit specifics, the 20+ outbound airline list.

update programs set
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.shangri-la.com/en/corporate/shangrilacircle/redeem-points/',
  intro = 'Shangri-La Circle is the loyalty program for one of Asia''s grand luxury hotel groups - 100+ properties across the Shangri-La, Kerry, Hotel Jen, and Traders brands, concentrated in Asia, the Middle East, and a handful of European gateways. It rebranded from the old Golden Circle in 2022 and runs on a refreshingly simple idea: earn points on stays, dining, and spa, then redeem them for free nights with no blackout dates and no expiry while you stay active. Four tiers - Gold, Jade, Diamond, and invite-only Polaris - climb from basic member perks to genuinely indulgent ones: lounge access, 4 PM checkouts, and at the top, an "All Access" benefit that lets Polaris members use a Shangri-La''s pool and lounge without even booking a room. If your travels run through Asia, it''s one of the more rewarding luxury programs going.',
  how_to_spend = '- **Free nights (dynamic pricing):** Redeem points for award nights at any Shangri-La, Kerry, Hotel Jen, or Traders property worldwide. The points needed track the cash rate, with no blackout dates.
- **Points + Cash:** Cover part of a stay with points and the rest with cash for partial redemptions.
- **Bring others:** Award nights can be booked for yourself and up to 5 nominees.
- **Dining, spa, and lifestyle:** Redeem for food and beverage credits, Chi, The Spa vouchers, and assorted lifestyle awards.
- **Transfer to airlines:** Move points to a roster of 20+ airline frequent-flyer partners at 1:1 (minimum 2,500 points, then 500-point increments) when you would rather have miles than a hotel night. (Exact partner list and ratios: verify on the official Redeem Points page.)
- **Charity:** Donate points to partnered charities.',
  sweet_spots = '- **Top-tier Asian flagships on points:** Properties like Shangri-La Hong Kong, Singapore, or Tokyo can be eye-watering in cash but redeem at a consistent points-to-cash value with no blackout dates - the dynamic model rewards you most on the priciest nights.
- **Points + Cash on aspirational stays:** When you are short of a full free night, the points-and-cash split knocks a big chunk off a marquee property.
- **Polaris "All Access":** Reach the invite-only top tier and you can use a Shangri-La''s club lounge and facilities even on days you are not staying - a genuinely unusual perk in luxury loyalty.
- **Transfer in via Atmos:** Atmos Rewards (Alaska/Hawaiian) points can move to Shangri-La Circle through the Atmos Summit card - a side door into Shangri-La nights for US-based collectors. (Ratio: verify.)',
  tier_benefits = '[
    {"name":"Gold","qualification":"Entry tier - free to join","benefits":["Member rates","No blackout dates on points redemptions","Priority room-type waitlist","Earn points on stays, dining, and spa"]},
    {"name":"Jade","qualification":"20 elite nights or 6,000 tier points","benefits":["Welcome recognition and amenity","Room upgrade subject to availability","Enhanced points earning","Early check-in / late check-out subject to availability"]},
    {"name":"Diamond","qualification":"50 elite nights or 15,000 tier points","benefits":["Early arrival at 11 AM and late departure at 4 PM","Executive / Horizon Club lounge access at participating properties","Suite upgrade awards at select properties","Higher bonus points earning"]},
    {"name":"Polaris","qualification":"Invitation only (top tier)","benefits":["Shangri-La All Access - use the club lounge, pool, gym, and business center at any property without an overnight stay","Flexible check-in from 12 AM and check-out to 6 PM","Dedicated global Polaris concierge","Up to 6 complimentary airport meet-and-greet transfers per year with fast-track immigration","Ability to gift Diamond status","Polaris Discovery experiences"]}
  ]'::jsonb,
  lounge_access = 'Shangri-La''s club lounges (branded Horizon Club or Executive Lounge at many properties) are the program''s lounge perk, gated by tier:
- **Diamond:** Executive / Horizon Club lounge access at participating properties, typically including continental breakfast, evening cocktails, and meeting-room use.
- **Polaris:** "Shangri-La All Access" - use the club lounge (plus pool, gym, and business center) at any property worldwide, even without an overnight stay.

Lounge availability and amenities vary by property; not every Shangri-La operates a club lounge. (Confirm per-tier lounge specifics on the official benefits page.)',
  quirks = '- **Dynamic award pricing, no chart:** There is no fixed category chart - points needed for a free night track the cash price, so value is best on expensive nights and weaker on cheap ones.
- **No blackout dates** on points redemptions, and points do not expire while your membership stays active.
- **Asia-weighted footprint:** The portfolio is concentrated in Asia, the Middle East, and select European cities - thinner in the Americas than Marriott or Hilton.
- **Multiple brands, one currency:** Points earn and burn across Shangri-La, Kerry, Hotel Jen, and Traders.
- **Polaris is invite-only:** The top tier cannot be earned through a published threshold; it is extended by invitation.
- **Transfers out in increments:** Airline transfers start at 2,500 points, then 500-point steps.',
  award_chart = 'Shangri-La Circle uses DYNAMIC award pricing rather than a fixed category chart. The points required for a free night are tied to the property''s prevailing cash rate, so there are no fixed off-peak / standard / peak point bands. Redemption value per point varies by property and rate - verify the current value on the official Redeem Points page rather than relying on a fixed figure. Key rules: no blackout dates; points + cash partial redemptions allowed; award nights bookable for the member plus up to 5 nominees at any Shangri-La, Kerry, Hotel Jen, or Traders property. Airline transfers run 1:1 (minimum 2,500 points, then 500-point increments) to 20+ frequent-flyer partners.',
  transfer_partners = '[
    {"from_slug":"atmos","ratio":"verify","notes":"Atmos Rewards (Alaska/Hawaiian) points transfer to Shangri-La Circle via the Atmos Summit card''s hotel-transfer benefit. No transfer tax. Exact ratio to verify.","bonus_active":false}
  ]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  last_verified = current_date,
  updated_at = now()
where slug = 'shangri-la';
