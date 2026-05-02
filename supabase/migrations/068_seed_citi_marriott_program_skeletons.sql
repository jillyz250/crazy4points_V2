-- Seed skeleton rows for Citi ThankYou Rewards and Marriott Bonvoy.
--
-- BACKGROUND
-- ----------
-- These two programs are referenced as transfer-in partners on multiple
-- airline/loyalty-program pages (AA, Atmos, etc.) but didn't exist as
-- programs.programs rows. Without rows, the TransferPartnersTable component
-- falls back to rendering the raw slug ("citi-thankyou", "marriott-bonvoy")
-- instead of a real program name + clickable link.
--
-- This migration inserts skeleton rows (slug + name + type + is_active) so
-- the transfer table renders correctly. Full editorial content (intro,
-- transfer_partners, sweet_spots, etc.) gets authored later when each program
-- gets its dedicated page run via the add-airline skill.
--
-- Slug convention is kebab-case (per feedback_program_slug_convention).
-- Migration 022 already wrote official_faq_url updates for these slugs,
-- confirming they were always intended to exist with these slugs.

insert into programs (slug, name, type, is_active) values
  ('citi-thankyou',    'Citi ThankYou Rewards', 'loyalty_program', true),
  ('marriott-bonvoy',  'Marriott Bonvoy',       'hotel',           true)
on conflict (slug) do nothing;
