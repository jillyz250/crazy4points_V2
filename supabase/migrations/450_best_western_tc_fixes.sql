-- Best Western Rewards reconciliation against the FULL official T&C (effective
-- 26 Sept 2024) + the official Benefits-at-a-Glance table, both pasted by Jill
-- 2026-06-15. Held inactive until final activation. ASCII-only.
--
-- KEY CORRECTION: Best Western elite confers NO ROOM UPGRADES. The draft (mig 449)
-- gave Gold/Diamond "room upgrade subject to availability" - that is blog-sourced and
-- NOT in the official benefits table. Removed from all tiers. The official table's only
-- per-tier perks are: bonus points, complimentary water + 500 pts (Gold+), and early
-- check-in / late check-out (Platinum+). Diamond vs Diamond Select differ ONLY by the
-- bonus percentage - no additional perks.
--
-- CONFIRMED from official T&C:
--  * Earning: 10 pts/USD on room rate (before tax/fees) for Qualifying Nights; 5 pts/USD
--    at SureStay Studio, Executive Residency, and @HOME by Best Western. OTA / tour /
--    crew / wholesale / 30+ night rates do not qualify.
--  * Elite (calendar-year Qualifying Nights): Gold 5 / Platinum 7 / Diamond 15 /
--    Diamond Select 25; bonuses +10 / +15 / +30 / +50%. Status earned in 2026 holds
--    through 31 Dec 2027. Earning Miles (preference) forfeits the elite bonus.
--  * Points NEVER expire. No blackout dates. Free nights: standard room only, dynamic
--    pricing by expected ADR, up to 7 consecutive nights, call center or online only.
--  * Pay with Points: min 5,000 pts + cash, 1,000-pt increments, first night only,
--    counts toward elite.
--  * Member-to-member transfers: 1,000-pt increments, 30-day account age, max
--    150,000/rolling calendar year (over 70,000 subject to review).
--  * BWR member rate = 7%+ off the Flexible Rate. Best Western Gift Card never expires.
--
-- STILL OPEN: airline transfer roster. The official Convert-to-Miles link 404s and the
-- T&C does not enumerate partners ("visit bestwesternrewards.com for the full list").
-- transfer_partners_outbound left EMPTY rather than padded from memory (Radisson lesson).

update programs set
  how_to_spend = '- **Free nights (dynamic by ADR):** Redeem points for free nights at participating hotels worldwide. Points required track the property''s expected average daily rate, so they vary through the year - starting around 5,000 points and scaling up for pricier properties. Standard rooms only (no suites), up to 7 consecutive nights, NO blackout dates. Book online or via the call center (not travel agents).
- **Pay with Points:** Combine points and cash on a stay - minimum 5,000 points plus cash, in 1,000-point increments, applied to the first night. You still earn (and qualify for elite on) the cash portion.
- **Convert to airline miles:** Convert points to miles with select airline partners, or set miles as your earning preference (note: choosing miles forfeits elite bonus points). Exact partner roster + ratios live on the official site. (Convert-to-Miles page roster: to be captured - the public link currently 404s.)
- **Gift cards and charity:** Redeem points for retail/dining gift cards, the never-expiring Best Western Gift Card, or charitable donations.',
  sweet_spots = '- **Points that never expire:** The standout feature - Best Western points do not expire from inactivity, so a slowly-built balance stays safe indefinitely (unlike Hilton, Marriott, or IHG).
- **No blackout dates:** If a standard room is available to book, it is available on points - useful for last-minute or peak-season roadside stays.
- **Cheap free nights in small markets:** In secondary US towns and along highway corridors, a low-thousands-of-points redemption on a $100+ night can beat the cash-per-point math of flashier programs.
- **Free elite status via Status Match No Catch:** Best Western instantly matches most competing-program elite status for free, and status earned in 2026 holds through December 2027 - an easy way to bank the elite bonus with no stays.
- **7%+ member rate:** Booking the Best Western Rewards Rate direct saves at least 7% off the Flexible Rate on top of earning points.',
  tier_benefits = '[
    {"name":"Blue","qualification":"Entry tier - free to join","benefits":["10 points per USD on the room rate (5 at SureStay Studio, Executive Residency, and @HOME by Best Western)","Points never expire","No blackout dates on free-night redemptions","Exclusive member rates - 7%+ off the Flexible Rate","Pay with Points (from 5,000 points plus cash)","Free-night redemptions still count toward Elite status","Exclusive reservation line"]},
    {"name":"Gold","qualification":"5 Qualifying Nights in a calendar year","benefits":["10% bonus points on Qualifying Nights","Complimentary water at check-in","500 bonus points upon arrival","All Blue benefits"]},
    {"name":"Platinum","qualification":"7 Qualifying Nights in a calendar year","benefits":["15% bonus points on Qualifying Nights","Early check-in and late check-out, subject to availability","All Gold benefits"]},
    {"name":"Diamond","qualification":"15 Qualifying Nights in a calendar year","benefits":["30% bonus points on Qualifying Nights","All Platinum benefits (the higher bonus is the only addition - no room upgrade or lounge)"]},
    {"name":"Diamond Select","qualification":"25 Qualifying Nights in a calendar year","benefits":["50% bonus points on Qualifying Nights - the program''s top earning rate","All Diamond benefits (the 50% bonus is the sole differentiator from Diamond)"]}
  ]'::jsonb,
  lounge_access = 'Best Western is a midscale and economy hotel family and does NOT operate a chain-wide executive-lounge program the way Hilton, Marriott, or IHG do. Elite status (Gold through Diamond Select) confers bonus points, complimentary water at check-in, and - from Platinum up - early check-in / late check-out, but NOT lounge access or room upgrades. A handful of upscale Best Western Premier, BW Premier Collection, or WorldHotels properties may operate their own club lounge, but that is property-specific, not a Rewards tier benefit.',
  quirks = '- **Points never expire:** Best Western''s standout feature - the official terms state points do not expire, unlike nearly every major competitor.
- **No blackout dates:** Free nights are available whenever a standard room is available to book.
- **Dynamic free-night pricing:** Points needed track the property''s expected average daily rate; standard rooms only, up to 7 consecutive nights per redemption.
- **Midscale elite perks are modest:** Elite mainly adds bonus points, water, and (Platinum+) early/late check-out. There is NO room upgrade, free breakfast, or lounge benefit - and Diamond vs Diamond Select differ only by bonus percentage.
- **Nights-based tiers:** Status is earned purely on Qualifying Nights (5 / 7 / 15 / 25 per calendar year); status earned in 2026 holds through December 2027.
- **Status Match No Catch:** Best Western instantly matches most competing elite status for free.
- **Member-to-member transfers:** Allowed in 1,000-point increments after 30 days of membership, up to 150,000 points per rolling calendar year.
- **Earn miles instead of points = no elite bonus:** Setting an airline as your earning preference means you earn only miles for that stay and forfeit the elite bonus.
- **Huge small-market footprint:** The real value is reach - properties in secondary cities and along highways where Marriott/Hilton are absent.',
  award_chart = 'Best Western Rewards uses DYNAMIC free-night pricing rather than a fixed category chart. The points required for a free night are based on the property''s expected average daily rate for the requested date, so they vary throughout the year (starting around 5,000 points and scaling up for premium properties). Redemptions are for STANDARD rooms only (no suites), up to 7 consecutive nights, with NO blackout dates, and points NEVER expire. EARNING is a flat 10 points per USD on the room rate for most brands (5 points at SureStay Studio, Executive Residency, and @HOME by Best Western); elite members add a tier bonus on Qualifying Nights (Gold +10%, Platinum +15%, Diamond +30%, Diamond Select +50%). Pay with Points combines a 5,000-point minimum (in 1,000-point increments) with cash on the first night. Points can also be converted to airline miles with select partners (full roster on the official site), or redeemed for gift cards and charitable donations. Members booking the Best Western Rewards Rate save 7%+ off the Flexible Rate.',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  last_verified = current_date,
  updated_at = now()
where slug = 'best-western';
