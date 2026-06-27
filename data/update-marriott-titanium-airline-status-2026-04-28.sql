-- Add the Marriott Bonvoy Titanium → airline-status benefit to the
-- /programs/marriott-bonvoy page. Surfaced 2026-04-28 from the Upgraded
-- Points "most valuable perk per hotel program" article.
--
-- Bonvoy page currently has only intro populated; sweet_spots and quirks
-- are empty. This script handles both the empty case (SET) and any future
-- re-run after fuller authoring (APPEND with NOT LIKE guard), so it's
-- idempotent — safe to run now and safe to leave in place after a full
-- Marriott authoring pass.
--
-- Sources:
--   https://travel-partner.marriott.com/air-canada/en-us
--   https://www.aircanada.com/ca/en/aco/home/aeroplan/partners/marriott.html

-- ─── Marriott sweet_spots ────────────────────────────────────────────────────

-- Case 1: sweet_spots is empty/null — SET to the new bullet
update programs
set sweet_spots = E'- **Complimentary airline elite status at Titanium (75 nights) and Ambassador (100 nights).** Link your Bonvoy account with United MileagePlus and Aeroplan, register, and Marriott matches you to **United Premier Silver** AND **Aeroplan 25K** for at least 12 months. Status renews automatically as long as you maintain Titanium or Ambassador. Two airline elite tiers — including Star Alliance Silver perks (priority check-in, priority security, extra baggage on many partners) — earned by hitting a single hotel tier. One of the best status-stacking plays in hotel loyalty, and the reason Bonvoy Titanium is often the most valuable hotel tier overall for points-and-miles travelers.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and (sweet_spots is null or sweet_spots = '');

-- Case 2: sweet_spots already populated (post full-authoring) — APPEND with guard
update programs
set sweet_spots = sweet_spots || E'\n\n- **Complimentary airline elite status at Titanium (75 nights) and Ambassador (100 nights).** Link your Bonvoy account with United MileagePlus and Aeroplan, register, and Marriott matches you to **United Premier Silver** AND **Aeroplan 25K** for at least 12 months. Status renews automatically as long as you maintain Titanium or Ambassador. Two airline elite tiers — including Star Alliance Silver perks (priority check-in, priority security, extra baggage on many partners) — earned by hitting a single hotel tier. One of the best status-stacking plays in hotel loyalty.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and sweet_spots is not null
  and sweet_spots != ''
  and sweet_spots not like '%Complimentary airline elite status at Titanium%';

-- ─── Marriott quirks ─────────────────────────────────────────────────────────

-- Case 1: quirks empty — SET
update programs
set quirks = E'- **United Silver: just link the accounts.** Connect your Marriott Bonvoy and United MileagePlus profiles via the Marriott account-linking page. Once Titanium or Ambassador is on your Bonvoy account, Premier Silver posts to your United account automatically — no separate registration.\n- **Aeroplan 25K: requires a one-time registration.** Sign up at [travel-partner.marriott.com/air-canada/](https://travel-partner.marriott.com/air-canada/en-us). Must be an active member of both Bonvoy AND Aeroplan. Status posts within a few days and is valid 12+ months. Renews automatically each year you maintain Titanium or Ambassador — no re-registration.\n- **Status drops if you fall out of Titanium.** Both perks are tied to your active hotel tier. Drop to Platinum and the airline statuses expire at the end of their current 12-month window. Lifetime Titanium does NOT carry the airline-status benefit through low-stay years — verify the program''s current terms before assuming.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and (quirks is null or quirks = '');

-- Case 2: quirks already populated — APPEND with guard
update programs
set quirks = quirks || E'\n\n- **United Silver: just link the accounts.** Connect Bonvoy + United MileagePlus profiles via the Marriott account-linking page; Premier Silver posts automatically once Titanium or Ambassador hits your account.\n- **Aeroplan 25K: requires a one-time registration** at [travel-partner.marriott.com/air-canada/](https://travel-partner.marriott.com/air-canada/en-us). Must be a member of both programs. Valid 12+ months, renews while Titanium/Ambassador is maintained.\n- **Status drops if you fall out of Titanium.** Both perks are tied to active hotel tier — Platinum or below loses them at the end of the current 12-month window.',
    content_updated_at = now()
where slug = 'marriott-bonvoy'
  and quirks is not null
  and quirks != ''
  and quirks not like '%United Silver: just link the accounts%';

-- Verify after running:
--   select slug, content_updated_at,
--          sweet_spots like '%Complimentary airline elite status at Titanium%' as marriott_titanium_sweet_ok,
--          quirks like '%United Silver: just link the accounts%' as marriott_titanium_quirks_ok
--   from programs where slug = 'marriott-bonvoy';
