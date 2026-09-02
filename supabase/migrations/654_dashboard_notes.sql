-- 654_dashboard_notes.sql — Jill's quick-capture Notepad on the person-first
-- dashboard (Devon, 2026-09-02). Zero-friction jots that persist; a note can be
-- promoted to /admin/takes. Admin-only, same posture as the org tables.
create table if not exists public.dashboard_notes (
  id             uuid primary key default gen_random_uuid(),
  body           text not null,
  sent_to_takes  boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists dashboard_notes_created_idx on public.dashboard_notes (created_at desc);

-- RLS on, no public policies = default-deny to anon/authenticated; admin uses the
-- service role which bypasses RLS.
alter table public.dashboard_notes enable row level security;
