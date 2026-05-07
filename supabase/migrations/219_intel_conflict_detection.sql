-- Phase B: conflict-flagging system for intel_items.
--
-- Adds columns so the conflict detector (utils/ai/detectConflict.ts) can
-- mark intel items that contradict existing program-page content. Surfaces
-- in the admin UI as a red banner on idea/intel cards.

alter table intel_items
  add column if not exists conflicts_program_id uuid references programs(id) on delete set null,
  add column if not exists conflict_field text,
  add column if not exists conflict_summary text,
  add column if not exists conflict_intel_claim text,
  add column if not exists conflict_program_text text,
  add column if not exists conflict_detected_at timestamptz,
  add column if not exists conflict_resolution text;

-- Optional: a quick lookup index for "show me unresolved conflicts"
create index if not exists intel_items_unresolved_conflicts_idx
  on intel_items (conflicts_program_id, conflict_resolution)
  where conflicts_program_id is not null and conflict_resolution is null;

comment on column intel_items.conflicts_program_id is
  'If non-null, this intel item claims something that contradicts the linked program page. Set by detectConflict.ts during build-brief.';
comment on column intel_items.conflict_field is
  'Which field on the program page conflicts: intro / quirks / transfer_partners / tier_benefits / award_chart / lounge_access / sweet_spots / how_to_spend';
comment on column intel_items.conflict_summary is
  'One-line natural-language summary of the conflict for admin display.';
comment on column intel_items.conflict_intel_claim is
  'Quoted snippet from intel raw_text that triggered the conflict.';
comment on column intel_items.conflict_program_text is
  'Quoted snippet from the program page field that conflicts with the intel.';
comment on column intel_items.conflict_detected_at is
  'Timestamp when the detector flagged this conflict.';
comment on column intel_items.conflict_resolution is
  'How admin resolved: NULL = unresolved (still surfaced in UI), "intel_dismissed" = intel was wrong, "program_updated" = program page was edited to match intel, "external_verified" = admin checked externally and chose intel side, "false_positive" = detector was wrong.';
