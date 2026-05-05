-- Deactivate Spirit Airlines (Free Spirit) program row.
--
-- Spirit ceased operations the week of 2026-05-05 following a fast post-
-- Ch-11 collapse (emerged from Chapter 11 March 2026, shut down ~2 months
-- later). The program row should not surface in:
--   - Public /programs/spirit page (set is_active=false)
--   - add-airline next-recommendation suggestions
--   - Decision Engine destination → carrier surfacing
--   - Scout / brief next-day picks
--
-- The row stays in the table (vs DELETE) for historical reference and so
-- existing alerts tagged to Spirit retain their join target. The
-- is_active=false flag is the standard lifecycle signal across the schema
-- - all public renders + admin lists already filter on it.
--
-- The skeleton row was originally seeded for forward-planning; it never
-- received any editorial content (intro/transfer_partners/etc. all null).
-- So deactivation drops nothing user-visible.

update programs set
  is_active = false,
  notes = coalesce(notes || ' | ', '') || 'Defunct - airline ceased operations week of 2026-05-05 following post-Ch-11 collapse. Skeleton row retained for historical alert references.',
  updated_at = now()
where slug = 'spirit';
