-- Add `gaps` jsonb column to track promo-term fields the writer flagged
-- as unknown ("gaps_acknowledged") and any admin-supplied fills.
--
-- Shape:
--   [
--     { "field": "booking_window", "filled": "April 20-26, 2026" },
--     { "field": "travel_window",  "filled": null },
--     { "field": "exclusions",     "filled": null }
--   ]
--
-- Workflow:
--   1. Writer drafts → outputs gaps_acknowledged: string[]; this becomes
--      [{field: <name>, filled: null}, ...] in this column.
--   2. Admin opens edit page → fills some of the inputs in the gap-fill
--      banner; updated values land in `filled` per row.
--   3. On regenerate, filled entries are passed back to the writer as
--      "Verified gap fields" extra_context; the writer surfaces them as
--      real bullets. Unfilled entries stay omitted from the published body
--      ("only verified ships").
alter table alerts
  add column if not exists gaps jsonb default '[]'::jsonb;

comment on column alerts.gaps is
  'Writer-flagged gaps + admin fills. Array of { field, filled }. Unfilled entries stay out of published description.';
