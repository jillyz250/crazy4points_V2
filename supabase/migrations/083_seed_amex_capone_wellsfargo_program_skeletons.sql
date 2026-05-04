-- Seed skeleton rows for the three remaining major flexible-currency programs:
-- Amex Membership Rewards, Capital One Rewards, Wells Fargo Rewards.
--
-- BACKGROUND
-- ----------
-- These three programs are referenced as transfer-in partners on multiple
-- airline pages (JetBlue, AA, etc.) but didn't exist as programs.programs
-- rows. Without rows, the TransferPartnersTable component falls back to
-- rendering the raw slug ("amex-membership-rewards", "capital-one",
-- "wells-fargo-rewards") instead of a real program name + clickable link.
--
-- This migration mirrors the pattern of 068 (which seeded citi-thankyou
-- and marriott-bonvoy). Skeleton rows only — full editorial content
-- (intro, transfer_partners, sweet_spots, etc.) gets authored later when
-- each program gets its dedicated page run via the add-airline skill.
--
-- Slug convention is kebab-case (per feedback_program_slug_convention).

insert into programs (slug, name, type, is_active) values
  ('amex-membership-rewards',  'American Express Membership Rewards', 'loyalty_program', true),
  ('capital-one',               'Capital One Rewards',                 'loyalty_program', true),
  ('wells-fargo-rewards',       'Wells Fargo Rewards',                 'loyalty_program', true)
on conflict (slug) do nothing;
