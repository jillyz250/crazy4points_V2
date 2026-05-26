-- Hilton Honors: fix virgin_atlantic slug to virgin-atlantic (kebab-case).
--
-- Migration 346 used snake_case 'virgin_atlantic' in Hilton's transfer_partners
-- and transfer_partners_outbound JSONB. The DB convention is kebab-case
-- (per feedback_program_slug_convention.md), and the actual programs row
-- is slug='virgin-atlantic'. verify-program.mjs flagged this as a missing
-- partner slug after the seed-hilton-page PR merged.
--
-- This patch fixes both columns; idempotent (no-op if already fixed).

update programs
   set transfer_partners = replace(transfer_partners::text, 'virgin_atlantic', 'virgin-atlantic')::jsonb,
       transfer_partners_outbound = replace(transfer_partners_outbound::text, 'virgin_atlantic', 'virgin-atlantic')::jsonb,
       last_verified = current_date
 where slug = 'hilton';
