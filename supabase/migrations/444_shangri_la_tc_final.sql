-- Shangri-La Circle final verification from the full official T&C (pasted 2026-06-15,
-- T&C dated 12 May 2026) + the Airline Miles Conversion table + experiences page.
-- CORRECTED two real errors: (1) redemption is a FIXED 15 points = USD 1 (~6.67c/pt),
-- NOT dynamic; (2) points DO expire (2nd anniversary of accrual-year end), not "never."
-- Also: airline transfer minimum is 1,000 (not 2,500); guaranteed bed type is a
-- DIAMOND benefit (not Jade); SQ KrisFlyer is a STATUS MATCH. Populated the full
-- 18-airline outbound roster (InterMiles is defunct, no DB row). Held inactive.

update programs set
  award_chart = 'Shangri-La Circle uses a FIXED redemption value rather than off-peak / standard / peak category bands. Points redeem at a fixed rate of 15 Shangri-La Circle points = USD 1 (or local-currency equivalent) of the property''s prevailing cash rate - so each point is worth about 6.67 US cents toward rooms, dining, spa, experiences, or Boutique purchases. Example: a room costing USD 300 a night runs about 4,500 points. EARNING is tier-based: Gold 1 point per USD, Jade 1.25, Diamond and Polaris 1.5. Cash + Points awards use the same 15:1 rate with a 500-point minimum. No blackout dates (subject to the award availability the hotel releases). Airline conversions run at a base 1:1 (varies by partner), minimum 1,000 points, then 500-point increments. Points expire on the second anniversary of the end of the calendar year in which they were earned.',
  how_to_spend = '- **Free nights (fixed value):** Redeem points for award nights at any Shangri-La, Kerry, Hotel Jen, or Traders property at a fixed 15 points = USD 1 of the room''s cash rate. No blackout dates (subject to award availability).
- **Cash + Points:** Combine points and cash on Flexible Rate room awards (same 15:1 rate, 500-point minimum).
- **Dining, spa, experiences, and boutique:** Redeem for dining and Chi spa vouchers, lifestyle experiences, and Shangri-La Boutique products at the same 15 points = USD 1 rate.
- **Bring family:** Award nights are bookable for the member plus up to 5 registered Family Membership nominees.
- **Convert to airlines:** Transfer points to 18+ airline partners at a base 1:1 (some partners differ), minimum 1,000 points then 500-point increments, processed in 4-6 weeks.
- **Charity:** Donate points to designated charities (2,000-point minimum, valued at USD 0.02 per point).',
  quirks = '- **Fixed redemption value:** Points redeem at a fixed 15 points = USD 1 of the property''s cash rate (about 6.67 US cents per point) for rooms, dining, spa, experiences, and Boutique - value is consistent, not dynamic.
- **Points expire:** Points expire on the second anniversary of the end of the calendar year in which they were earned (roughly 25-36 months); accounts go inactive after 36 months without activity.
- **No pooling, but family nominees:** You cannot pool points between members, but you can redeem room and non-room awards for up to 5 registered Family Membership nominees.
- **Earn points OR airline miles, not both:** On a qualifying stay you choose to earn Shangri-La points or credit an airline partner - never both for the same stay.
- **OTA bookings do not qualify:** Stays booked through Expedia, Booking.com, Trip.com, etc. earn no points or tier benefits - you must book direct.
- **Asia-weighted footprint:** Concentrated in Asia, the Middle East, and select European cities - thinner in the Americas than Marriott or Hilton.
- **Multiple brands, one currency:** Points earn and burn across Shangri-La, Kerry, Hotel Jen, and Traders.
- **Polaris is invite-only:** The top tier cannot be earned through a published threshold.',
  tier_benefits = '[
    {"name":"Gold","qualification":"Entry tier - free to join; earns 1 point per USD","benefits":["1 point per USD spent","Mobile app check-in and check-out","Priority waitlist for your desired room type","No blackout dates when redeeming points","Member rates on direct bookings","Complimentary buffet for up to 2 children aged 6 and under (dining with an adult)","Earn points for up to 3 rooms paid in the same hotel"]},
    {"name":"Jade","qualification":"20 nights or 6,000 tier points; earns 1.25 points per USD","benefits":["25% more points (1.25 per USD)","Early check-in 11 AM / late check-out 4 PM (subject to availability; a few properties excluded)","Priority check-in/out at a designated Shangri-La Circle counter","Guaranteed room availability for reservations made 72+ hours before arrival","One-category room upgrade (up to Club rooms; suites excluded), for stays up to 7 nights","Daily breakfast at the cafe or a designated restaurant","Welcome amenity choice: USD 10 dining credit, USD 10 laundry credit, or 100 points","A stay partner shares the room free, with breakfast","Status match with Singapore Airlines KrisFlyer (Infinite Journeys)"]},
    {"name":"Diamond","qualification":"50 nights or 15,000 tier points; earns 1.5 points per USD","benefits":["50% more points (1.5 per USD)","Early check-in 8 AM / late check-out 6 PM (subject to availability; a few properties excluded)","Club Lounge access with your stay partner and 1 additional guest","Daily breakfast at the cafe or Club Lounge","Guaranteed room availability for reservations made 48+ hours before arrival","Guaranteed bed type at reservation","Priority check-in/out at the Club Lounge or in-room","Welcome amenity choice: USD 12 dining credit, USD 12 laundry credit, or 150 points, plus a local Special Delight amenity","Complimentary pressing of one suit per stay (excludes JEN hotels)"]},
    {"name":"Polaris","qualification":"By invitation only; earns 1.5 points per USD","benefits":["All Diamond benefits, plus by-invitation extras published on the Polaris portal","Reported extras (blog-sourced - verify on the Polaris portal): Shangri-La All Access to club lounge, pool, gym, and business center without an overnight stay; enhanced check-in/out flexibility; a dedicated global concierge; airport meet-and-greet transfers; and the ability to gift Diamond status"]}
  ]'::jsonb,
  transfer_partners_outbound = '[
    {"from_slug":"air-china","ratio":"1:1","notes":"To Air China PhoenixMiles. Base 1:1 (verify on the official conversion table). No transfer tax; min 1,000 points, then 500 increments.","bonus_active":false},
    {"from_slug":"air-france","ratio":"1:1","notes":"To Air France-KLM Flying Blue. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"ana","ratio":"1:1","notes":"To ANA Mileage Club. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"cathay","ratio":"1:1","notes":"To Cathay (Asia Miles). Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"china-southern","ratio":"1:1","notes":"To China Southern Sky Pearl Club. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"delta","ratio":"1:1","notes":"To Delta SkyMiles. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"etihad","ratio":"1:1","notes":"To Etihad Guest. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"finnair","ratio":"1:1","notes":"To Finnair Plus. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"hainan-airlines","ratio":"1:1","notes":"To Hainan Fortune Wings Club. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"juneyao","ratio":"1:1","notes":"To Juneyao Air. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"oman-air","ratio":"1:1","notes":"To Oman Air Sindbad. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"philippine-airlines","ratio":"1:1","notes":"To Philippine Airlines Mabuhay Miles. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"qantas","ratio":"1:1","notes":"To Qantas Frequent Flyer. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"qatar","ratio":"1:1","notes":"To Qatar Privilege Club. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"saudia","ratio":"1:1","notes":"To Saudia AlFursan. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"krisflyer","ratio":"1:1","notes":"To Singapore Airlines KrisFlyer. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"united","ratio":"1:1","notes":"To United MileagePlus. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"virgin-australia","ratio":"1:1","notes":"To Velocity Frequent Flyer. Base 1:1 (verify). No transfer tax; min 1,000 points.","bonus_active":false}
  ]'::jsonb,
  last_verified = current_date, updated_at = now()
where slug = 'shangri-la';
