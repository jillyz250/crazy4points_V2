-- Phase A admin redesign: simpler 4-status model for content_ideas.
--
-- BEFORE: new / queued / drafted / published / dismissed (5 states)
-- AFTER:  new / idea_bank / published / dismissed (4 states)
--   - 'queued' renamed to 'idea_bank' (the personal "save for later" stash)
--   - 'drafted' dropped (since blog/newsletter writing is fast - no
--     in-progress state needed)
--   - 'published' rows older than 90 days surface as "Archived" via the
--     UI filter on published_at; status stays 'published' (no auto-flip
--     cron needed)

-- ============================================================
-- STEP 1: Drop the old check constraint first (so we can migrate data)
-- ============================================================
alter table content_ideas drop constraint if exists content_ideas_status_check;

-- ============================================================
-- STEP 2: Migrate existing data to new status names
-- ============================================================
update content_ideas set status = 'idea_bank' where status = 'queued';
update content_ideas set status = 'new' where status = 'drafted';

-- Backfill published_at for any pre-existing published rows where it's missing
update content_ideas
set published_at = coalesce(published_at, updated_at, created_at)
where status = 'published' and published_at is null;

-- ============================================================
-- STEP 3: Add the new check constraint
-- ============================================================
alter table content_ideas add constraint content_ideas_status_check
  check (status = any (array['new'::text, 'idea_bank'::text, 'published'::text, 'dismissed'::text]));
