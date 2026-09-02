-- 652_org_lore.sql — the "Breakroom": fun, tasteful, FIREWALLED office lore for the AI
-- team (Jill, 2026-09-02). Internal-only morale/personality layer; NEVER surfaces in
-- published content. One beat per day, ideally tied to real events.
create table if not exists public.org_lore (
  id         uuid primary key default gen_random_uuid(),
  lore_date  date not null default current_date,
  headline   text not null,
  body       text,
  involves   jsonb not null default '[]'::jsonb,  -- employee slugs in the beat
  created_at timestamptz not null default now()
);
create index if not exists org_lore_date_idx on public.org_lore (lore_date desc);

-- Same posture as the org tables: admin-only. RLS on, no public policies = default-deny
-- to anon/authenticated; admin uses the service role which bypasses RLS.
alter table public.org_lore enable row level security;
