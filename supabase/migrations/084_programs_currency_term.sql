-- Add currency_term to programs so the public page heading "How to spend X"
-- can render the right noun per program (miles vs. points).
--
-- BACKGROUND
-- ----------
-- The "How to spend" section heading on /programs/[slug] was hardcoded as
-- "How to spend miles" in ProgramPageContent.tsx, which is wrong for
-- revenue-based programs (Southwest Rapid Rewards, JetBlue TrueBlue) that
-- use "points" terminology. This adds a simple per-program override.
--
-- Default is 'miles' since most airline programs use that term. We backfill
-- the two known revenue-based US programs (southwest, jetblue) to 'points'.
-- Future programs default to 'miles' unless explicitly set otherwise during
-- authoring.

alter table programs
  add column if not exists currency_term text not null default 'miles'
  check (currency_term in ('miles', 'points'));

update programs set currency_term = 'points' where slug in ('southwest', 'jetblue');
