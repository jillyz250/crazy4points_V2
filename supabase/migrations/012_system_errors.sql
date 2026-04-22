-- Background-job error log. Surfaced in admin banner + /admin/errors page.
create table if not exists system_errors (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  stack text,
  context jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists system_errors_unresolved_idx
  on system_errors (created_at desc)
  where resolved_at is null;
