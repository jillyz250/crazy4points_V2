-- Daily-ritual resume tracker. The ritual is 25 phases (26 on Thursdays) and often
-- doesn't get finished in one sitting; this persists progress across sessions so the
-- next session can resume at the exact phase instead of restarting (Jill, 2026-09-01
-- "I don't get past 11 sometimes; pick up where we left off each night").
-- One row per ritual day (ET). scripts/ritual-progress.mjs reads/writes it; the
-- daily-ritual skill checks it at start and stamps it after each phase receipt.
CREATE TABLE IF NOT EXISTS ritual_progress (
  ritual_date  date PRIMARY KEY,
  last_phase   int NOT NULL DEFAULT 0,        -- highest phase completed
  completed    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{phase, note, at}] audit trail
  started_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz                     -- set when the whole ritual is done
);
