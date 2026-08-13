-- 622 — Priority within a roadmap pillar.
-- Lets an idea be ranked High / Normal / Low so the roadmap surfaces the
-- highest-value slot to write next, not just the newest. Copilot feedback
-- 2026-08-13: "add prioritization within a pillar."
--
-- Encoding: 1 = high, 2 = normal, 3 = low. NULL is treated as normal (2)
-- everywhere, so existing rows need no backfill.

ALTER TABLE content_ideas
  ADD COLUMN IF NOT EXISTS priority smallint;

COMMENT ON COLUMN content_ideas.priority IS
  'Roadmap write-priority: 1=high, 2=normal, 3=low. NULL treated as normal.';
