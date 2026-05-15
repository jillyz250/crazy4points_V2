-- Add verifications jsonb to program_extractions.
--
-- Per-field auto-verification results. Editor clicks "🔍 Verify against source"
-- on a field card; the action calls Sonnet with current + extracted + the
-- already-scraped markdown, and stores the verdict here.
--
-- Shape:
--   {
--     "lounge_access": {
--       "verdict": "corrected" | "confirmed" | "unverifiable",
--       "discrepancies": [
--         {"claim": "...", "current_says": "...", "extracted_says": "...",
--          "source_says": "...", "resolution": "..."}
--       ],
--       "corrected_value": "<final markdown in current's voice>",
--       "notes": "<short narrative>",
--       "generated_at": "2026-05-15T..."
--     },
--     "quirks": { ... }
--   }
--
-- Apply picks corrected_value over merged_value over extracted (set in
-- the UI form's hidden new_value_json).

alter table program_extractions
  add column if not exists verifications jsonb not null default '{}'::jsonb;

comment on column program_extractions.verifications is
  'Per-field auto-verification results from running Sonnet against the scraped markdown. Keyed by field name. Apply uses verifications[field].corrected_value if present.';
