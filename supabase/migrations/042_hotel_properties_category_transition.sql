-- Hotel category transition columns.
--
-- Some loyalty programs publish category changes ahead of an effective date
-- (e.g. World of Hyatt's annual category refresh — Feb 25, 2026 announcement
-- for May 20, 2026 changes affecting 136 hotels). During the window between
-- announcement and effective date, the existing `category` column must keep
-- reflecting the CURRENT category (so awards still book correctly), while
-- the upcoming category needs to live somewhere queryable.
--
-- These two columns let us mark a row as "changing on a future date" without
-- breaking present-day accuracy:
--   - `category_next`         — the category that will apply after the change
--   - `category_changes_at`   — the date the change becomes effective
--
-- After the effective date passes, a cleanup script copies `category_next`
-- into `category` and clears both transition columns. The schema is generic
-- so other programs (Marriott, Hilton, IHG) can use the same shape for their
-- own annual updates.

alter table hotel_properties
  add column if not exists category_next       text,
  add column if not exists category_changes_at date;

-- Index for "which properties have a pending change?" lookups (UI badge,
-- alert generation, brief eligibility, etc.). Partial index keeps it tiny —
-- only rows actively in transition get indexed.
create index if not exists hotel_properties_pending_change_idx
  on hotel_properties (program_id, category_changes_at)
  where category_changes_at is not null;

comment on column hotel_properties.category_next is
  'Pending future category. Non-null only when a category change has been announced but is not yet effective. Cleared after category_changes_at passes and category is updated.';
comment on column hotel_properties.category_changes_at is
  'Effective date for the pending change. NULL when no change is pending.';
