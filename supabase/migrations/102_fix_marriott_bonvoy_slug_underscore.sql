-- Fix: three programs (atmos, aa, southwest) reference Marriott Bonvoy as
-- "marriott_bonvoy" (underscore) in their transfer_partners JSONB. The
-- canonical slug per project convention (feedback_program_slug_convention.md)
-- is kebab-case "marriott-bonvoy", which exists in the programs table.
--
-- The underscore version doesn't exist as a programs row, so the lookup
-- falls back to rendering the raw slug as the partner pill name. Caught
-- by scripts/verify-program.mjs.
--
-- Replace all underscore occurrences in transfer_partners JSONB across
-- the three affected programs.

update programs
set transfer_partners = replace(transfer_partners::text, 'marriott_bonvoy', 'marriott-bonvoy')::jsonb,
    last_verified = current_date
where slug in ('atmos', 'aa', 'southwest')
  and transfer_partners::text like '%marriott_bonvoy%';
