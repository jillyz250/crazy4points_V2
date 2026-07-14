-- Content updates for Accor + Hyatt program pages (2026-04-28).
--
-- 1. Accor: add Family & Co. (50% off 2nd room with kids) to sweet_spots and
--    the "can't be stacked" caveat to quirks. Surfaced 2026-04-28 — award
--    blogs miss this because it's a cash discount not a points play. Source:
--    https://all.accor.com/a/en/offers/Family-offer-2nd-room-discounts.html
--
-- 2. Hyatt: add Brand Explorer Free Night Award to sweet_spots. Missing
--    entirely from current page. Source: Hyatt T&Cs effective May 27, 2026,
--    Appendix B Section II(b)(2).
--
-- 3. Hyatt: add the new June 30, 2026 advance-booking-window perk for
--    Explorists / Globalists / Lifetime Globalists / Hyatt-branded
--    credit-card primary cardholders to quirks. Source: same T&Cs,
--    Appendix B Section II(a)(3).
--
-- All updates use `||` to APPEND to existing content with `NOT LIKE` guards
-- so this is idempotent — safe to re-run. After running, the staleness pill
-- on the admin pages will flip to "Today".

-- ─── Accor sweet_spots ───────────────────────────────────────────────────────

update programs
set sweet_spots = sweet_spots || E'\n\n- **Family & Co.: 50% off the second room** when traveling with kids. Book 2+ rooms simultaneously with at least 1 child in each, and the second room books at half the Flexible Rate. Works across the full Accor portfolio — Ibis budget through Sofitel, Fairmont, Raffles. The discount applies to the Flexible Rate, so the math doesn''t always beat a deeply-discounted Saver rate × 2 rooms; run both numbers before booking.',
    content_updated_at = now()
where slug = 'accor'
  and sweet_spots is not null
  and sweet_spots not like '%Family & Co.%';

-- ─── Accor quirks ────────────────────────────────────────────────────────────

update programs
set quirks = quirks || E'\n\n- **Family & Co. cannot be stacked.** The 50%-off-second-room offer cannot be combined with member discounts, status rates, promo codes, or other Accor offers. Doesn''t apply to groups. Child age limits and room occupancy rules vary by hotel — confirm at the individual property before booking.',
    content_updated_at = now()
where slug = 'accor'
  and quirks is not null
  and quirks not like '%Family & Co. cannot be stacked%';

-- ─── Hyatt sweet_spots ───────────────────────────────────────────────────────

update programs
set sweet_spots = sweet_spots || E'\n\n- **Brand Explorer Free Night Award** — stay at five different Hyatt brands (Park Hyatt, Andaz, Hyatt Place, Hyatt Ziva, etc.) on either a paid Eligible Rate or a redeemed Free Night Award, and Hyatt issues a free night good at any Cat 1–4 property. Valid for one year. Counts brands, not nights — five one-night stays at five different brands hit the trigger. Each Hyatt brand is one count, so a Park Hyatt stay only credits "Park Hyatt" toward your *next* award once you''ve completed the current cycle. Great way to turn brand-curious trips into a built-in fifth night somewhere genuinely nice (think aspirational Park Hyatt at Cat 4, or a category jump on a Hyatt Place).',
    content_updated_at = now()
where slug = 'hyatt'
  and sweet_spots is not null
  and sweet_spots not like '%Brand Explorer%';

-- ─── Hyatt quirks ────────────────────────────────────────────────────────────

update programs
set quirks = quirks || E'\n\n- **Advance-booking window for Explorists, Globalists, Lifetime Globalists, and Hyatt cardholders** (starting June 30, 2026). For Free Night Awards and Points + Cash Awards booked on or after that date, those four groups get early booking access compared to other members. Hyatt-branded credit card primary cardholders qualify regardless of tier status — so the Chase World of Hyatt card alone gets you the head start.\n- **Gifted-award cap: 10 per calendar year per recipient** (as of June 7, 2025). You can still transfer as many eligible awards as you want, but no one Member can *receive* more than 10 gifted awards per year. Plan ahead if you''re funneling Suite Upgrades or Guest of Honor Awards to a family member.',
    content_updated_at = now()
where slug = 'hyatt'
  and quirks is not null
  and quirks not like '%Advance-booking window for Explorists%';

-- ─── Hyatt partner benefits ─────────────────────────────────────────────────
-- The "Alliances" section on world.hyatt.com lists partner brands that earn,
-- redeem, or discount with Hyatt outside the core stay product. We had Mr &
-- Mrs Smith covered but were missing five other partner relationships.
-- Surfaced 2026-04-28 from world.hyatt.com/content/gp/en/landing/all-partners.

-- 4a. Hyatt sweet_spots — adjacent earning/redemption surfaces
update programs
set sweet_spots = sweet_spots || E'\n\n- **Under Canvas** (glamping near US national parks): bookable through Mr & Mrs Smith → World of Hyatt, so eligible stays earn base points and qualify for elite-night credit. Properties include ULUM Moab, The Fields of Michigan, and Bar N Ranch. Niche but excellent for park-adjacent trips where Hyatt''s normal portfolio has nothing nearby.\n- **The Venetian Resort Las Vegas:** book through Hyatt to earn and redeem points on eligible nights at a property that isn''t a Hyatt brand. One of the few ways to apply Hyatt points to a Strip stay without a transfer to MGM/Caesars.',
    content_updated_at = now()
where slug = 'hyatt'
  and sweet_spots is not null
  and sweet_spots not like '%Under Canvas%';

-- 4b. Hyatt quirks — non-stay partner perks worth knowing about
update programs
set quirks = quirks || E'\n\n- **Peloton: 100 Bonus Points per eligible workout** at participating Hyatt hotels (in-room access to select classes where available). Trivial individually, but stacks fast on extended stays at participating properties.\n- **Headspace: free** mindfulness + sleep exercises for World of Hyatt members — in the Headspace app and in-room at participating hotels. Not a points play, just an unannounced member benefit most people miss.\n- **MasterClass: up to 30% off** an annual subscription as a World of Hyatt member. Real discount, not a coupon — applies to the year-long plan.\n- **American Airlines: dual-earn via account linking.** Link your AAdvantage® and World of Hyatt accounts and earn both miles AND points on eligible activity, plus access to AA-specific Milestone Reward choices (Preferred Seat / Main Cabin Extra coupons at the 20- and 40-night milestones; Gold status at 70 nights; Platinum at 100). The link is one-time, name on both accounts must match.',
    content_updated_at = now()
where slug = 'hyatt'
  and quirks is not null
  and quirks not like '%Peloton: 100 Bonus Points%';

-- Verify after running:
--   select slug, content_updated_at,
--          sweet_spots like '%Family & Co.%' as accor_sweet_ok,
--          quirks like '%Family & Co. cannot be stacked%' as accor_quirks_ok
--   from programs where slug in ('accor', 'hyatt');
--   select slug,
--          sweet_spots like '%Brand Explorer%' as hyatt_brand_explorer_ok,
--          sweet_spots like '%Under Canvas%' as hyatt_under_canvas_ok,
--          quirks like '%Advance-booking window for Explorists%' as hyatt_booking_window_ok,
--          quirks like '%Peloton: 100 Bonus Points%' as hyatt_peloton_ok
--   from programs where slug = 'hyatt';
