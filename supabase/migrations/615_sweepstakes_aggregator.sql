-- Add aggregator sources to the sweepstakes watcher.
--
-- Program pages only surface their OWN sweeps, and many great giveaways (Hilton
-- 500k points, Best Western 250k, Choice 1M, Marriott point drops) live on
-- one-off microsites with no durable page - impossible to watch directly.
-- Sweepstakes-directory sites list them all in one place. We add a couple as
-- catch-all nets, but they also list third-party/charity travel giveaways, so
-- the watcher treats `kind='aggregator'` sources specially: a stricter prompt
-- keeps ONLY loyalty-program-run sweeps and records each sweep's OWN program.

ALTER TABLE sweepstakes_sources
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'program';  -- 'program' | 'aggregator'

COMMENT ON COLUMN sweepstakes_sources.kind IS
  'program = a single program''s own page; aggregator = a directory listing many programs'' sweeps (filtered to loyalty-program sweeps at extract time).';

INSERT INTO sweepstakes_sources (program, url, kind, notes) VALUES
  ('Sweeps Advantage (hotels)',   'https://www.sweepsadvantage.com/hotels-sweepstakes',   'aggregator', 'Directory - loyalty-hotel sweeps filtered at extract (caught Wyndham 1M-pt sweep). Verified 2026-08-07.'),
  ('Sweeps Advantage (airlines)', 'https://www.sweepsadvantage.com/airlines-sweepstakes', 'aggregator', 'Directory - loyalty-airline sweeps filtered at extract. Verified 2026-08-07.')
ON CONFLICT (url) DO NOTHING;
