-- Intel triage decoupling.
--
-- Previously /api/build-brief auto-wrote a full Sonnet alert (write → edit →
-- voice-check → fact-check → web-verify → up to 2 revisions) for EVERY item
-- the editorial planner approved. Cost: 20-30 API calls per brief run, most
-- of which Jill discards.
--
-- New model: the brief generates an editorial plan, persists each item's
-- approve/reject decision + reasoning to intel_items, and STOPS. The
-- expensive write pipeline only runs when Jill clicks "Write this" on the
-- new /admin/triage inbox.
--
-- triage_decision values:
--   - 'approved'         — planner picked it; ready for editor to write
--   - 'rejected'         — planner declined; not for writing (still surfaces if editor disagrees)
--   - 'blog_idea'        — planner routed to blog queue instead
--   - 'newsletter_idea'  — planner routed to newsletter queue instead
--   - NULL               — not yet triaged by any planner run
--
-- alert_id stays as the marker for "actually written" — when an alert row
-- exists for an intel_item, it's been promoted past triage.

alter table intel_items
  add column if not exists triage_decision text,
  add column if not exists triage_reasoning text,
  add column if not exists triage_decided_at timestamptz;

create index if not exists intel_items_triage_decision_idx
  on intel_items (triage_decision)
  where triage_decision is not null;

comment on column intel_items.triage_decision is
  'Editorial planner''s decision: approved | rejected | blog_idea | newsletter_idea | NULL. Set by /api/build-brief; surfaces in /admin/triage so Jill can click "Write this" for items she actually wants drafted. Decouples expensive Sonnet write from auto-fire on every planner approval.';

comment on column intel_items.triage_reasoning is
  'Plain-text reason from the editorial planner explaining why this decision was made. Shown next to each candidate in /admin/triage.';

comment on column intel_items.triage_decided_at is
  'Timestamp of the most-recent planner decision. NULL = never triaged.';
