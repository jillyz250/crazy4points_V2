-- 246_programs_marquee_redemption.sql
-- Add a curator-picked "marquee" partner_redemption per program.
--
-- Today, the Should I Transfer top-sweet-spot block surfaces the cheapest
-- easy + good-availability row. That's a "boring-good" surface — fine,
-- but it buries the famous redemptions that actually make a transfer
-- bonus worth chasing (e.g. JAL First on AA at 80k, MAD-JFK J via Iberia
-- at 34k, Cathay J via Atmos, etc.).
--
-- This column lets the curator (admin) pin ONE redemption per program as
-- "the famous one." When set, Should I Transfer's top sweet spot block
-- displays the marquee FIRST, then falls back to the cheapest-easy logic
-- for any additional examples. When null, falls back to current behavior.
--
-- Authored: 2026-05-12

begin;

alter table programs
  add column if not exists marquee_redemption_id uuid
    references partner_redemptions(id) on delete set null;

comment on column programs.marquee_redemption_id is
  'Optional FK to partner_redemptions — the curator-picked "marquee" '
  'redemption for this program. Surfaced first in Should I Transfer''s '
  'top sweet spot block. When NULL, the tool falls back to the cheapest '
  'easy-complexity + good-availability row.';

create index if not exists programs_marquee_redemption_idx
  on programs (marquee_redemption_id)
  where marquee_redemption_id is not null;

commit;
