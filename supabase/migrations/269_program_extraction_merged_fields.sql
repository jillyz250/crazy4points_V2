-- Merged field versions for program extractions.
--
-- When the editor wants to combine the current manual content with the
-- newly-extracted facts (rather than choose one over the other), they
-- click "Merge with current." Sonnet returns a merged version that keeps
-- the current's voice/structure and adds facts from extracted. The result
-- is stored here so it persists across review sessions.
--
-- Shape:
--   merged_fields = {
--     "lounge_access": { value: "<merged markdown>", generated_at: "<iso>" },
--     "quirks": { value: "<merged markdown>", generated_at: "<iso>" },
--     ...
--   }
--
-- Apply action uses merged_fields[field].value when present; falls back to
-- extraction.<field>.value otherwise.

alter table program_extractions
  add column if not exists merged_fields jsonb not null default '{}'::jsonb;

comment on column program_extractions.merged_fields is
  'Per-field merged versions (current + extracted, combined by Sonnet). Editor opts in per field via the Merge button. Apply uses the merged value when present, otherwise the raw extracted value. Persists across review sessions.';
