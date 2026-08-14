-- 624 — "Jill's Takes": a zero-friction capture inbox for real-life travel
-- experiences that feed the biweekly newsletter. The newsletter ships every
-- 2 weeks, so takes back up; this is the backlog queue so good stories aren't
-- lost to the gap. Raw + personal by design — graduates to a written piece
-- when it's ready.

CREATE TABLE IF NOT EXISTS jills_takes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note          text NOT NULL,
  program_slug  text,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'used', 'archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  used_at       timestamptz
);

-- Backlog view: newest unused first.
CREATE INDEX IF NOT EXISTS jills_takes_status_created_idx
  ON jills_takes (status, created_at DESC);

COMMENT ON TABLE jills_takes IS
  'First-person travel experiences captured for the biweekly newsletter. status: new (backlog) / used / archived.';
