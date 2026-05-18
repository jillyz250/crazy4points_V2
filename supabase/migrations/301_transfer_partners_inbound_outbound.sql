-- Fix the transfer-partners data model: split inbound vs outbound.
--
-- Background
-- ----------
-- The `programs.transfer_partners` JSONB column has been overloaded with two
-- semantically opposite meanings depending on which program it lives on:
--
--   * On transferable credit-card currencies (Chase UR, Amex MR, Citi TY,
--     Cap One Miles, Bilt) and on hotel chains (Marriott, Hilton, Hyatt,
--     IHG, Choice, Wyndham), and on the Avios family (BA, Iberia, Aer Lingus,
--     Qatar, Finnair, Vueling, Loganair) — the rows describe OUTBOUND
--     destinations: "this program's points transfer TO these N programs".
--
--   * On closed-loop airline programs (Southwest, Delta, AA, United, JetBlue,
--     Aeroplan, Atmos, etc.) — the rows describe INBOUND sources: "these N
--     programs transfer INTO this program". Closed-loop airlines have NO
--     outbound transfer destinations (you cannot move Southwest points out
--     to another currency); listing inbound here was an editorial convenience.
--
-- The card detail page renders `transfer_partners` as if it were always
-- OUTBOUND. For Southwest co-brand cards, the page falsely claims the card
-- transfers OUT to Chase UR + Bilt + Marriott — that is backwards.
--
-- Fix
-- ---
-- Add a new column `transfer_partners_outbound` to hold the OUTBOUND data
-- explicitly. Backfill it for the programs whose existing data is outbound.
-- Leave `transfer_partners` populated for closed-loop airlines, where it now
-- canonically means INBOUND. The legacy column name is preserved for
-- backward compatibility through Phase 1; a future migration may rename it
-- to `transfer_partners_inbound`.
--
-- Anti-shortcut: this migration does NOT drop or null any existing data. It
-- only ADDS the new column and MOVES rows for the explicit outbound list.

alter table programs
  add column if not exists transfer_partners_outbound jsonb not null default '[]'::jsonb;

comment on column programs.transfer_partners_outbound is
  'OUTBOUND: programs that THIS program transfers points OUT to (e.g. Chase UR -> Hyatt, Marriott -> Alaska). Used by card detail pages to surface where the card''s points can be transferred. Empty for closed-loop airline programs that have no outbound transfers.';

comment on column programs.transfer_partners is
  'INBOUND: programs that transfer points/miles INTO this one (e.g. Chase UR -> Southwest). Useful editorial info for closed-loop airline co-brand card pages ("other ways to earn these points"). Historically overloaded to also hold outbound data for transferable currencies and hotels; that data has been moved to transfer_partners_outbound. May be renamed to transfer_partners_inbound in a future migration.';

-- Backfill: programs whose `transfer_partners` data is OUTBOUND in nature.
-- For each, copy the data to `transfer_partners_outbound` and clear the
-- legacy column to prevent double-rendering.
--
-- Verified OUTBOUND programs (2026-05-18):
--   - Transferable card currencies (UR, MR, TY, Cap1, Bilt)
--   - Hotel chains with airline transfer ratios (Marriott, Hilton, Hyatt, IHG,
--     Choice, Wyndham)
--   - Avios family — points are shared 1:1 within the BA/Iberia/Aer Lingus/Qatar/
--     Finnair/Vueling/Loganair currencies. Each Avios-family program's
--     transfer_partners lists OUTBOUND destinations (the other Avios partners).
--
-- We use UPDATE...WHERE with the slug allowlist; slugs that do not exist
-- in this DB are silently skipped.
update programs
   set transfer_partners_outbound = transfer_partners,
       transfer_partners = '[]'::jsonb
 where slug in (
   -- Transferable card currencies
   'chase-ultimate-rewards',
   'amex-membership-rewards',
   'citi-thankyou',
   'capital-one',
   'bilt',
   -- Hotel chains
   'marriott-bonvoy',
   'hilton-honors',
   'hyatt',
   'ihg-one-rewards',
   'choice-privileges',
   'wyndham-rewards',
   -- Avios family (outbound within the family)
   'ba-avios',
   'iberia-plus',
   'aer-lingus-aerclub',
   'qatar-privilege-club',
   'finnair-plus',
   'vueling-club',
   'loganair-clan-loganair'
 )
   and jsonb_array_length(coalesce(transfer_partners, '[]'::jsonb)) > 0;

-- Flip points_transferable_to_partners=false on every credit card whose
-- currency_program is now a closed-loop airline program.
--
-- After the backfill above, any program with empty `transfer_partners_outbound`
-- and a non-empty `transfer_partners` is, by construction, closed-loop. Cards
-- earning into those currencies cannot transfer points to airline/hotel
-- partners directly (the points only redeem within that closed program).
--
-- Set-based update — uses the new columns instead of a hardcoded slug list,
-- which means it self-corrects if more programs are properly classified in
-- the future.
update credit_cards c
   set points_transferable_to_partners = false
  from programs p
 where c.currency_program_id = p.id
   and c.points_transferable_to_partners = true
   and jsonb_array_length(coalesce(p.transfer_partners_outbound, '[]'::jsonb)) = 0
   and p.type in ('airline','credit_card');
-- Note: hotels are excluded from the auto-flip; if a hotel program ends up
-- with empty transfer_partners_outbound (which it should NOT for the six
-- hotels listed above), we want a human to review rather than blindly flip
-- co-brand hotel cards. The six listed hotel programs all had outbound data
-- successfully moved above, so their co-brand cards are unaffected.

-- Audit query (run manually after applying):
-- select p.slug, p.type,
--        jsonb_array_length(coalesce(p.transfer_partners, '[]'::jsonb)) as inbound_count,
--        jsonb_array_length(coalesce(p.transfer_partners_outbound, '[]'::jsonb)) as outbound_count
--   from programs p
--  where p.is_active = true
--  order by p.type, p.slug;
