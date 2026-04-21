-- destinations: travel destinations for the Decision Engine slot machine.
-- Seeded from IATA commercial airports + UNESCO World Heritage sites,
-- enriched with Claude-generated tags, weather, and sassy summaries.

create table if not exists destinations (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Identity
  slug              text not null unique,
  title             text not null,
  country           text not null,
  region            text,
  continent         text not null check (continent in (
                      'north_america', 'central_america', 'south_america',
                      'caribbean', 'europe', 'asia', 'middle_east',
                      'africa', 'south_pacific'
                    )),

  -- Future feature hooks (hotels, flights, redemptions)
  iata_code         text,
  latitude          double precision,
  longitude         double precision,
  is_unesco         boolean not null default false,

  -- Claude-generated content
  summary_short     text,                 -- 1-2 sentences for the winner card
  summary_long      text,                 -- 1-2 paragraphs for the detail page

  -- Filter tags (validated at insert time by seed script)
  vibe              text[] not null default '{}',
  trip_length       text[] not null default '{}',
  who_is_going      text[] not null default '{}',

  -- Month -> 'great' | 'good' | 'mixed' | 'poor'
  weather_by_month  jsonb not null default '{}'::jsonb
);

-- Indexes for filter queries (strict-AND matching in /api/decision-engine)
create index if not exists destinations_continent_idx    on destinations (continent);
create index if not exists destinations_vibe_gin         on destinations using gin (vibe);
create index if not exists destinations_trip_length_gin  on destinations using gin (trip_length);
create index if not exists destinations_who_going_gin    on destinations using gin (who_is_going);
create index if not exists destinations_weather_gin      on destinations using gin (weather_by_month);

-- Keep updated_at fresh
create or replace function destinations_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists destinations_updated_at on destinations;
create trigger destinations_updated_at
  before update on destinations
  for each row execute function destinations_set_updated_at();

-- RLS: public read-only (anonymous visitors use the Decision Engine)
alter table destinations enable row level security;

drop policy if exists "destinations are publicly readable" on destinations;
create policy "destinations are publicly readable"
  on destinations for select
  to anon, authenticated
  using (true);
