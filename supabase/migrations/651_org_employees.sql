-- 651_org_employees.sql — the "team of AI employees" org model (Jill, 2026-09-02).
-- Supabase is the single source of truth; .claude/agents/<slug>.md files are GENERATED
-- from these rows (one-way flow), and the /admin/org dashboard reads these tables.
-- Design reviewed by Copilot: 2 tables, platforms as JSON (no per-platform migrations),
-- correlation_id + last_regenerated_at for auditability/drift, explicit indexes.

create table if not exists public.employees (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,               -- kebab-case; drives the .md filename + routing
  name                text not null,                      -- display name (e.g. "Kesha")
  role_title          text,                               -- "Head of Social" (null for the human owner)
  kind                text not null default 'agent'
                        check (kind in ('owner','chief','agent')),  -- owner = Jill, chief = Morgan, agent = dept heads
  emoji               text,
  persona             text,                               -- who they are (character/voice)
  mission             text,                               -- one-line purpose
  rules               jsonb not null default '[]'::jsonb, -- operating constraints (array of strings)
  responsibilities    jsonb not null default '[]'::jsonb, -- daily tasks / owned ritual phases (array)
  skills              jsonb not null default '[]'::jsonb, -- owned skills (array of skill names)
  allowed_scopes      jsonb not null default '[]'::jsonb, -- least-privilege: systems/tables/pages they may touch
  platforms           jsonb not null default '[]'::jsonb, -- [{platform, status, notes}] — add platforms w/o migration
  reports_to_id       uuid references public.employees(id) on delete set null,  -- self-ref org chart (owner = null)
  status              text not null default 'planned'
                        check (status in ('active','paused','planned','retired')),
  last_regenerated_at timestamptz,                        -- when this row was last written to its .md (drift check)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.employee_logs (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.employees(id) on delete cascade,
  type           text not null check (type in ('improvement','shortcoming','review')),
  note           text not null,
  actor          text,                                   -- who logged it ("jill", "morgan", "system")
  correlation_id text,                                    -- optional: tie to a campaign / run / incident
  created_at     timestamptz not null default now()
);

-- performance-log queries are always "this employee, newest first"
create index if not exists employee_logs_employee_created_idx
  on public.employee_logs (employee_id, created_at desc);

-- SECURITY: these are internal, admin-only tables. Admin pages use the service-role
-- client (createAdminClient), which BYPASSES RLS. Enabling RLS with NO public policies
-- = default-deny for the anon + authenticated roles (no public page can ever read the
-- org). This is stricter than per-op policies and fits our auth model (admin is a
-- separate cookie system + service role, not a Supabase-Auth user). If we later expose
-- any of this to signed-in users, add explicit narrow SELECT policies then.
alter table public.employees     enable row level security;
alter table public.employee_logs enable row level security;
