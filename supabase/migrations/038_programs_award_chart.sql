-- Adds a dedicated `award_chart` field to programs.
--
-- Previously, chart numbers (e.g. "Cat 8 standard = 40K points") were stuffed
-- into the editorial `sweet_spots` field. That mixed reference data with
-- opinion content, made the public /programs/[slug] page hard to render
-- cleanly, and made it awkward to update the chart without touching prose.
--
-- This separates them. Both fields are passed to the writer + fact-checker
-- as authoritative source data, but they're displayed and edited separately.
--
-- Programs that don't have a fixed chart (Flying Blue, dynamic-pricing
-- programs) can leave this null or use it for a "How pricing works" note.

alter table programs
  add column if not exists award_chart text;

-- Backfill: nothing automatic. Per-program data lives only in `sweet_spots`
-- today; an editor will copy it over to award_chart when ready (Hyatt first,
-- then any other program where it makes sense).
