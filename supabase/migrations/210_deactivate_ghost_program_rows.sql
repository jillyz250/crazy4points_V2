-- Deactivate ghost program rows that have been polluting the admin refresh
-- queue with "never verified" / 56y-old entries.
--
-- These are skeleton rows from earlier seeding work that:
--   - Have last_verified IS NULL (never authored)
--   - Have intro length < 100 chars (no real content)
--
-- Two main flavors:
--   1. Underscore-slug duplicates (aer_lingus, el_al, royal_air_maroc, etc.)
--      where the canonical kebab-case row exists with full content
--   2. Standalone unauthored skeletons (accor, hilton, ihg, choice, sas, etc.)
--      that we may want to author later
--
-- Setting is_active=false rather than DELETE because partner_redemptions and
-- transfer_partners JSON reference some of these by ID/slug. Deactivating
-- preserves FK integrity while hiding them from:
--   - admin_refresh_queue view (the refresh-queue admin page)
--   - listProgramsForIndex query (public /programs index)
--   - getPrograms() (Scout's program-tagger lookup)
--
-- Re-activate any specific row by flipping is_active=true if you decide to
-- author it later.

update programs
set is_active = false,
    updated_at = now()
where is_active = true
  and last_verified is null
  and length(coalesce(intro, '')) < 100;
