-- Phase 3 — field upgrades.
--
-- alerts.why_this_matters — one short editorial reason this alert deserves
-- a reader's attention. Auto-filled by build-brief from Sonnet's
-- editorial-plan why_publish. Manually editable. Reused as the public
-- subhead, the newsletter "Quick Wins" blurb source, and Decision Engine
-- context — single source of truth.
--
-- alerts.override_reason / content_ideas.override_reason — when set, signals
-- "I'm pushing this through despite a blocker (low confidence, soft source,
-- failed fact-check, etc)." Provides a paper trail + lets the content_ideas
-- publish gate be bypassed for blog drafts.

alter table alerts
  add column if not exists why_this_matters text,
  add column if not exists override_reason text;

alter table content_ideas
  add column if not exists override_reason text;
