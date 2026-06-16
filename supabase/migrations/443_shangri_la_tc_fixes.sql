-- Shangri-La Circle corrections from the official benefits/tiers page (pasted 2026-06-15).
-- CONFIRMED: per-tier earning (1 / 1.25 / 1.5 per USD), tier qualifications, and the
-- detailed Gold/Jade/Diamond benefit matrix. FIXED: Diamond check-in/out was wrong
-- (8 AM/6 PM, not 11/4 - that's Jade). Polaris detail remains blog-sourced (flagged).
-- STILL FLAGGED: exact redemption value + full outbound airline roster (Earning &
-- Converting Airline Miles FAQ). Held inactive until Jill verifies.

update programs set
  tier_benefits = '[
    {"name":"Gold","qualification":"Entry tier - free to join; earns 1 point per USD","benefits":["1 point per USD spent","No blackout dates on points redemptions","Stay, dine, and shop using points or cash + points","Member-exclusive direct-booking offers","Mobile app check-in and check-out","Complimentary meal for staying members'' children aged 6 and under","Earn points for up to 3 rooms when you pay for family/friends in the same hotel","Family Membership","Priority reservation waitlist for your desired room type"]},
    {"name":"Jade","qualification":"20 nights or 6,000 tier points; earns 1.25 points per USD","benefits":["25% more points (1.25 per USD)","Early check-in / late check-out (11 AM / 4 PM)","Daily breakfast at the cafe or designated restaurant","Room upgrade within the same category","Guaranteed bed type at reservation","Guaranteed room availability for bookings made 72+ hours before arrival","Elite Rollover Nights","Milestone Rewards","Priority check-in/out at a designated area","Stay partner shares the room free with applicable breakfast","Singapore Airlines KrisFlyer Infinite Journeys partnership","Welcome amenity choice: USD 10 laundry, USD 10 dining, or 100 points","One garment pressed on arrival"]},
    {"name":"Diamond","qualification":"50 nights or 15,000 tier points; earns 1.5 points per USD","benefits":["50% more points (1.5 per USD)","Early check-in / late check-out (8 AM / 6 PM)","Club Lounge access with your stay partner and an additional guest","Daily breakfast at the cafe or Club Lounge","Guaranteed room availability for bookings made 48+ hours before arrival","Welcome amenity choice: USD 12 laundry, USD 12 dining, or 150 points","Special Delight amenity"]},
    {"name":"Polaris","qualification":"By invitation only; earns 1.5 points per USD","benefits":["Shangri-La All Access - use the club lounge, pool, gym, and business center at any property without an overnight stay","Flexible check-in from 12 AM and check-out to 6 PM (blog-sourced; verify)","Dedicated global Polaris concierge","Up to 6 complimentary airport meet-and-greet transfers per year with fast-track immigration","Ability to gift Diamond status","Polaris Discovery experiences"]}
  ]'::jsonb,
  lounge_access = 'Shangri-La''s Club Lounges are the program''s lounge perk, gated by tier:
- **Diamond:** Club Lounge access with your stay partner and an additional guest, plus daily breakfast served in the cafe or Club Lounge.
- **Polaris:** "Shangri-La All Access" - use the Club Lounge (plus pool, gym, and business center) at any property worldwide, even without an overnight stay.

Lounge availability and amenities vary by property; not every Shangri-La operates a Club Lounge.',
  how_to_spend = '- **Free nights (dynamic pricing):** Redeem points for award nights at any Shangri-La, Kerry, Hotel Jen, or Traders property worldwide. The points needed track the cash rate, with no blackout dates.
- **Points + Cash:** Cover part of a stay with points and the rest with cash for partial redemptions.
- **Bring others:** Award nights can be booked for yourself and up to 5 nominees.
- **Dining, spa, and lifestyle:** Redeem for food and beverage credits, Chi, The Spa vouchers, and assorted lifestyle awards.
- **Transfer to airlines:** Convert points to airline miles with a roster of frequent-flyer partners (Singapore Airlines KrisFlyer is a named partner; the full list is on the official Earning & Converting Airline Miles page). Transfers run 1:1 with a 2,500-point minimum, then 500-point increments.
- **Charity:** Donate points to partnered charities.',
  award_chart = 'Shangri-La Circle uses DYNAMIC award pricing rather than a fixed category chart. Points required for a free night track the property''s cash rate, so there are no fixed off-peak / standard / peak bands. EARNING is tier-based: Gold 1 point per USD, Jade 1.25, Diamond and Polaris 1.5. Redemption value per point varies by property and rate - verify the current value on the official Redeem Points page rather than relying on a fixed figure. Key rules: no blackout dates; points + cash partial redemptions; award nights bookable for the member plus up to 5 nominees at any Shangri-La, Kerry, Hotel Jen, or Traders property. Airline transfers run 1:1 (minimum 2,500 points, then 500-point increments).',
  last_verified = current_date, updated_at = now()
where slug = 'shangri-la';
