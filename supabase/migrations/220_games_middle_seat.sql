-- Middle Seat game: daily puzzles + anonymous results.
--
-- Puzzles are admin-authored. If no row exists for a given date the app
-- falls back to a hardcoded rotation in lib/games/middle-seat/seed.ts.

create table if not exists game_middleseat_puzzles (
  date            date primary key,
  layout_json     jsonb not null,
  passengers_json jsonb not null,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists game_middleseat_results (
  id             bigserial primary key,
  date           date not null,
  anon_id        text not null,
  time_seconds   int not null,
  tier_key       text not null,
  completed_at   timestamptz not null default now()
);

create index if not exists game_middleseat_results_date_idx
  on game_middleseat_results (date);
