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

-- Verify after running:
--   select slug, content_updated_at,
--          sweet_spots like '%Family & Co.%' as accor_sweet_ok,
--          quirks like '%Family & Co. cannot be stacked%' as accor_quirks_ok
--   from programs where slug in ('accor', 'hyatt');
--   select slug,
--          sweet_spots like '%Brand Explorer%' as hyatt_sweet_ok,
--          quirks like '%Advance-booking window for Explorists%' as hyatt_quirks_ok
--   from programs where slug = 'hyatt';
