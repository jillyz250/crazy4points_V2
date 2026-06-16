-- Seed the Best Western Rewards hotel program page (authored 2026-06-15 from official
-- bestwestern.com + TPG/AwardWallet/Milesopedia/FinanceBuzz 2026 cross-check). Held
-- is_active=false + content_updated_at unset until Jill's T&C verification pass.
-- ASCII-only.
--
-- FLAGGED FOR T&C VERIFICATION (resolve from Jill's pasted official pages):
--  (1) Full airline-transfer roster + ratios - "9 airline partners" cited but not
--      enumerated. transfer_partners_outbound seeded EMPTY pending the official
--      Convert-to-Miles page. (Radisson lesson: do not pad from memory.)
--  (2) Diamond / Diamond Select benefits beyond bonus points - sources are thin
--      (BW is midscale; elite perks are modest). Verify exact per-tier benefits.
--  (3) Tier qualification: nights-based thresholds confirmed (5/7/15/25 nights in a
--      calendar year); confirm whether a stays-based or points-based path also exists.
--  (4) Free-night points range (5,000-70,000, dynamic by expected ADR) + any cap.

update programs set
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.bestwestern.com/en_US/rewards/redeem-points.html',
  intro = 'Best Western Rewards is the loyalty program for one of the world''s largest midscale hotel families - Best Western, Best Western Plus, Best Western Premier, the BW Signature and Premier Collections, the SureStay economy brands, and boutique lines like Aiden, Sadie, GLo, and Vib, plus the upscale WorldHotels collection. It is not a points-maximizer''s aspirational program - there are no marble lobbies or rooftop lounges here - but it does two unglamorous things really well: points never expire, and there are no blackout dates. You earn a flat 10 points per dollar from day one, climb five tiers (Blue, Gold, Platinum, Diamond, Diamond Select) purely on nights, and redeem for free nights that range from cheap roadside stays to the occasional surprisingly nice European property. If your travel runs through small-town America, highway exits, or secondary international cities, this is the program that quietly has a hotel where the big chains do not.',
  how_to_spend = '- **Free nights (dynamic by ADR):** Redeem points for free nights at participating properties worldwide, from about 5,000 points for budget stays up to ~70,000 for premium properties. Points needed track the expected average daily rate - higher on peak dates - but there are NO blackout dates.
- **Points + Cash:** Combine points with cash on eligible stays where offered.
- **Transfer to airline miles:** Convert points to miles with a short list of airline partners (about 9). Useful when you would rather have miles than a hotel night. (Exact partner list + ratios: verify on the official Convert to Miles page.)
- **Gift cards and merchandise:** Redeem points for retail and dining gift cards and merchandise via the rewards catalog.
- **Travel and experiences:** Redeem for car rentals and other travel partners where offered.',
  sweet_spots = '- **Points that never expire:** The single best feature - unlike Hilton, Marriott, or IHG, Best Western points do not expire from inactivity, so a slowly-earned balance stays safe for a future redemption.
- **No blackout dates:** If a room is available to book, it is available on points - handy for last-minute or peak-season roadside stays the big chains black out.
- **Cheap free nights in small markets:** In secondary US towns and along highway corridors, a 5,000-15,000-point redemption on a $100+ night can beat the cash-per-point math of flashier programs.
- **Free elite status via status match:** Best Western will match most competing-program elite status (often straight to Diamond Select) and currently extends matched status through 2027 - an easy way to bank bonus points with no stays.',
  tier_benefits = '[
    {"name":"Blue","qualification":"Entry tier - free to join","benefits":["10 points per USD on eligible room charges (5 at SureStay Studio)","Points never expire","No blackout dates on free-night redemptions","Member rates on direct bookings","Free in-room internet"]},
    {"name":"Gold","qualification":"5 qualifying nights in a calendar year","benefits":["10% bonus points on stays","Room upgrade subject to availability","Welcome gift: bottle of water plus 500 bonus points","All Blue benefits"]},
    {"name":"Platinum","qualification":"7 qualifying nights in a calendar year","benefits":["15% bonus points on stays","Early check-in and late check-out subject to availability","All Gold benefits"]},
    {"name":"Diamond","qualification":"15 qualifying nights in a calendar year","benefits":["30% bonus points on stays","Enhanced room upgrade and check-in/out priority subject to availability","All Platinum benefits"]},
    {"name":"Diamond Select","qualification":"25 qualifying nights in a calendar year","benefits":["50% bonus points on stays - the program''s top earning rate","Highest upgrade and service priority subject to availability","All Diamond benefits"]}
  ]'::jsonb,
  lounge_access = 'Best Western is a midscale and economy hotel family and does NOT operate a chain-wide executive-lounge program the way Hilton, Marriott, or IHG do. Elite status (Gold through Diamond Select) confers bonus points, upgrade priority, and early/late check-in rather than lounge access. A handful of upscale Best Western Premier, BW Premier Collection, or WorldHotels properties may operate their own club lounge, but that is property-specific, not a Rewards tier benefit. Do not expect lounge access from status alone.',
  quirks = '- **Points never expire:** Best Western''s standout feature - no inactivity expiry, unlike nearly every major competitor.
- **No blackout dates:** Free nights are available whenever a room is available to book.
- **Dynamic free-night pricing:** Points needed track the expected average daily rate (roughly 5,000-70,000), so value is best on otherwise-expensive nights.
- **Midscale elite perks are modest:** Elite tiers mainly add bonus points and upgrade/check-in priority - there is no chain-wide free breakfast or lounge benefit.
- **Nights-based tiers:** Status is earned on qualifying nights (5 / 7 / 15 / 25 per calendar year), not on spend or points.
- **Generous status match:** Best Western matches most competing elite status (often to Diamond Select) and currently honors matched status through 2027.
- **Member-to-member transfers:** Points can be transferred to another member''s account.
- **Huge small-market footprint:** The value is reach - properties in secondary cities and along highways where Marriott/Hilton are absent.',
  award_chart = 'Best Western Rewards uses DYNAMIC free-night pricing rather than a fixed category chart. The number of points required for a free night is based on the expected average daily rate for the property on the requested date, so it varies throughout the year - roughly 5,000 points for budget properties up to about 70,000 for premium ones. Crucially, there are NO blackout dates (if the room is available to book, it is available on points) and points NEVER expire from inactivity. EARNING is a flat 10 points per USD on eligible room charges for most brands (5 points at SureStay Studio), regardless of status; elite members add a tier bonus (Gold +10%, Platinum +15%, Diamond +30%, Diamond Select +50%). Points can also be redeemed for airline miles with about 9 partner carriers (roster + ratios: verify on the official Convert to Miles page), gift cards, merchandise, and travel partners.',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  last_verified = current_date,
  updated_at = now()
where slug = 'best-western';
