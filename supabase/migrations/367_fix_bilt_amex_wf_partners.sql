-- ============================================================================
-- 367 - Corrections after the Copilot/ChatGPT verification pass + issuer-page
-- checks (bilt.com support roster, Citi premium grids, WF/Virgin official page).
--
-- 1. BILT - full roster rebuild. Our 17-row list was stale:
--      remove `aa` (AA partnership ENDED June 2024), `air-france` (dupe of
--      Flying Blue), `krisflyer` (Singapore is not a Bilt partner);
--      rename `hawaiian` -> `atmos` (Alaska/Hawaiian combined program);
--      add avianca, ba-avios, etihad, jal, qatar, southwest, tap, wyndham,
--      virgin-red; Accor at 3:2 (its lone non-1:1 partner). Net 24 partners
--      (18 airline-side + 6 hotel), all 1:1 except Accor. Spirit is defunct -
--      intentionally excluded. Intro/sweet_spots rewritten to drop the false
--      "only transferable currency with American AAdvantage" headline.
--      Source: bilt.com/rewards/partner + Bilt Rewards Support transfer list.
--
-- 2. AMEX - Hilton Honors ratio 1:2.4 -> 1:2 (standard 1,000 MR = 2,000 Hilton).
--      Both verifiers agreed it was wrong. Targeted jsonb update preserves all
--      other rows/notes.
--
-- 3. WELLS FARGO - add Virgin Red (1:1). WF lists Virgin Atlantic Flying Club
--      AND Virgin Red as distinct partners (Virgin Red under Travel &
--      Experiences). Confirmed on Virgin's official WF transfer page. Net 11.
--
-- Citi/Chase/Capital One unchanged - verified clean (Citi premium-card ratios
-- Accor 1:0.5, Choice 1:1.5, Emirates 1:0.8, LHW 1:0.2 all confirmed correct).
-- ASCII-only per the SQL-data rule.
-- ============================================================================

-- --- 1. Bilt: rebuild roster + rewrite editorial -----------------------------
update programs set
  intro = 'Bilt Rewards is the only major transferable currency you can earn by paying rent - with no transaction fee - and the roster behind it is deep: {bilt_partner_count} airline and hotel partners, almost all at a clean 1:1 (Accor is the lone exception at 3:2). The headline value lives at Hyatt, backed by a strong airline bench - United, Air Canada Aeroplan, Turkish, Cathay, Qatar, and Alaska''s Atmos Rewards. Earn it on rent and everyday spend, then move it to the award you actually want.',
  sweet_spots = '- Hyatt (1:1) - the crown jewel; top-tier Park Hyatt and Alila resorts for a fraction of cash rates.
- Turkish Miles&Smiles (1:1) - very low Star Alliance and United-operated pricing.
- Air Canada Aeroplan (1:1) - free stopover, strong Star Alliance business-class value.
- Cathay Pacific and Qatar (1:1) - oneworld business and first class to Asia and the Middle East, including Qsuites.
- Atmos Rewards (1:1) - Alaska''s program unlocks oneworld and partner sweet spots, especially from the West Coast.',
  quirks = '- Earn points by paying rent with no transaction fee (up to a yearly cap), plus everyday spend on the Bilt card.
- Rent Day (the 1st of each month) doubles points on non-rent spend and runs periodic transfer bonuses.
- Nearly every partner is 1:1 and instant; Accor Live Limitless is the lone exception at 3:2 (1,000 Bilt is about 667 Accor points).
- You need at least 5 qualifying transactions per statement for the card to earn points that month.
- Transfers are one-way and final, with no transfer fees or taxes.',
  transfer_partners_outbound = '[
    {"from_slug":"atmos","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Atmos Rewards (Alaska + Hawaiian combined program); strong oneworld and partner sweet spots."},
    {"from_slug":"aer-lingus","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. AerClub Avios."},
    {"from_slug":"aeroplan","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Free stopover; strong Star Alliance business-class value."},
    {"from_slug":"flying-blue","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Air France-KLM; monthly Promo Rewards discounts."},
    {"from_slug":"avianca","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. LifeMiles; no fuel surcharges on Star Alliance."},
    {"from_slug":"ba-avios","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. British Airways Executive Club; Avios usable across the BA/Iberia/Aer Lingus family."},
    {"from_slug":"cathay","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Asia Miles; first and business class to Asia."},
    {"from_slug":"emirates","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Skywards."},
    {"from_slug":"etihad","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Etihad Guest."},
    {"from_slug":"iberia","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Iberia Plus Avios."},
    {"from_slug":"jal","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. JAL Mileage Bank; oneworld premium to Asia."},
    {"from_slug":"qatar","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Privilege Club; books Qsuites business."},
    {"from_slug":"southwest","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Rapid Rewards; no change fees, no award chart."},
    {"from_slug":"tap","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. TAP Miles&Go."},
    {"from_slug":"turkish","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Miles&Smiles; very low Star Alliance pricing."},
    {"from_slug":"united","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. MileagePlus."},
    {"from_slug":"virgin-atlantic","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Flying Club; ANA and Delta One sweet spots."},
    {"from_slug":"virgin-red","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Virgin Group rewards club; moves 1:1 on to Virgin Atlantic Flying Club."},
    {"from_slug":"accor","ratio":"3:2","bonus_active":false,"notes":"No transfer fee. ALL - Accor Live Limitless; the lone non-1:1 partner (1,000 Bilt is about 667 Accor points)."},
    {"from_slug":"hilton","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Hilton Honors."},
    {"from_slug":"hyatt","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. The crown-jewel redemption; outsized value at top properties."},
    {"from_slug":"ihg","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. IHG One Rewards."},
    {"from_slug":"marriott-bonvoy","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Marriott Bonvoy."},
    {"from_slug":"wyndham","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Wyndham Rewards; added 2026."}
  ]'::jsonb,
  last_verified = now(), content_updated_at = now(), updated_at = now()
where slug = 'bilt';

-- --- 2. Amex: Hilton 1:2.4 -> 1:2 (preserve all other rows/notes) ------------
update programs set
  transfer_partners_outbound = (
    select jsonb_agg(
      case when elem->>'from_slug' = 'hilton'
        then jsonb_set(elem, '{ratio}', '"1:2"')
        else elem end)
    from jsonb_array_elements(transfer_partners_outbound) elem
  ),
  last_verified = now(), updated_at = now()
where slug = 'amex';

-- --- 3. Wells Fargo: add Virgin Red (1:1) + reword intro to total count ------
-- (Virgin Red sits under WF "Travel & Experiences", not airlines, so the
--  airline/hotel split token would overcount it. Use total partner count.)
update programs set
  intro = 'Wells Fargo Rewards is the newest transferable currency, and it is growing fast. You earn it on the Autograph and Autograph Journey cards and move it to {wells-fargo_partner_count} airline and hotel partners - airlines at 1:1, and hotels at a favorable 1:2. The roster is shorter than the old guard, but it includes high-value names like Avianca, Air France-KLM, Cathay Pacific, and Virgin Atlantic. As always, transfer only once you have a specific award in mind.',
  transfer_partners_outbound = transfer_partners_outbound || '[
    {"from_slug":"virgin-red","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Virgin Group rewards club; listed under WF Travel & Experiences and moves 1:1 on to Virgin Atlantic Flying Club."}
  ]'::jsonb,
  last_verified = now(), updated_at = now()
where slug = 'wells-fargo';

-- --- verify ------------------------------------------------------------------
select slug, jsonb_array_length(transfer_partners_outbound) tp,
  (transfer_partners_outbound @> '[{"from_slug":"aa"}]') has_aa,
  (transfer_partners_outbound @> '[{"from_slug":"virgin-red"}]') has_virgin_red,
  (transfer_partners_outbound @> '[{"from_slug":"hilton","ratio":"1:2"}]') hilton_1to2
from programs where slug in ('bilt','amex','wells-fargo') order by slug;
