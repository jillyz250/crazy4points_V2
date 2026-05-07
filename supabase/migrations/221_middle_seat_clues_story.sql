-- Middle Seat: support clues, story, and difficulty on DB-authored puzzles.
-- Without these, DB rows render with an empty "Case" panel and a hardcoded
-- 'medium' difficulty pill regardless of actual content.

alter table game_middleseat_puzzles
  add column if not exists clues_json jsonb,
  add column if not exists story      text,
  add column if not exists difficulty text check (difficulty in ('easy','medium','hard'));
