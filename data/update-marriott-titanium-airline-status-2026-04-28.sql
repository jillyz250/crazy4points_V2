-- Add the Marriott Bonvoy Titanium / Ambassador → Aeroplan 25K status match
-- to the /programs/marriott-bonvoy page. Surfaced 2026-04-28.
--
-- Bonvoy page already covers United MileagePlus Silver via RewardsPlus (in
-- tier_benefits AND quirks). The Aeroplan 25K reciprocal status is a
-- separate, more recent partnership (manual one-time registration) and was
-- missing entirely from the page.
--
-- All updates append with NOT LIKE guards — idempotent, safe to re-run.
--
-- Sources:
--   https://travel-partner.marriott.com/air-canada/en-us
--   https://www.aircanada.com/ca/en/aco/home/aeroplan/partners/marriott.html

-- ─── Marriott sweet_spots ────────────────────────────────────────────────────
-- Add Aeroplan 25K to the airline-status story. Frames it as "stacking" with
-- the existing United Silver perk, so the dual-status angle reads clearly.

update programs
set sweet_spots = sweet_spots || E'\n\n- **Stack two airline elite statuses at Titanium / Ambassador: United Silver AND Aeroplan 25K.** Bonvoy''s RewardsPlus partnership with United auto-grants Premier Silver once accounts are linked. A separate Aeroplan partnership adds **Aeroplan 25K** (manual one-time registration at Marriott''s portal) — valid 12+ months and renews automatically while Titanium/Ambassador is maintained. Two airline elite tiers from one hotel tier, both with Star Alliance Silver privileges (priority check-in, priority security, extra baggage on many partners). One of the best status-stacking plays in hotel loyalty.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and sweet_spots is not null
  and sweet_spots not like '%Aeroplan 25K%';

-- ─── Marriott quirks ─────────────────────────────────────────────────────────
-- The Aeroplan 25K piece needs a how-to-claim caveat because it's NOT
-- automatic like the United one — readers will assume it auto-posts.

update programs
set quirks = quirks || E'\n\n- **Aeroplan 25K requires a one-time registration** (unlike the United Silver match, which auto-posts when accounts are linked). Sign up at [travel-partner.marriott.com/air-canada/](https://travel-partner.marriott.com/air-canada/en-us). Must be an active member of both Marriott Bonvoy and Aeroplan. Status posts within a few days, valid 12+ months, and renews automatically each year you maintain Titanium or Ambassador — no re-registration needed unless you fall out of status.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and quirks is not null
  and quirks not like '%Aeroplan 25K requires a one-time registration%';

-- Verify after running:
--   select slug, content_updated_at,
--          sweet_spots like '%Aeroplan 25K%' as marriott_aeroplan_sweet_ok,
--          quirks like '%Aeroplan 25K requires a one-time registration%' as marriott_aeroplan_quirks_ok
--   from programs where slug = 'marriott-bonvoy';
