-- Track scheduled cron runs so the admin dashboard can show
-- "Next scheduled refresh" + "Last run status" widget.
--
-- Each row = one execution of a scheduled job. Used by:
--   - /api/cron/quarterly-rotating-refresh (rotating-category card refresh)
--   - Future scheduled jobs (newsletter generation, alerts pipeline, etc.)

create table if not exists cron_runs (
  id              uuid primary key default gen_random_uuid(),
  job_name        text not null,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  status          text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  cards_attempted integer,
  cards_succeeded integer,
  cards_failed    integer,
  error_message   text,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists cron_runs_job_started_idx on cron_runs (job_name, started_at desc);

alter table cron_runs enable row level security;
drop policy if exists "cron_runs are publicly readable" on cron_runs;
create policy "cron_runs are publicly readable"
  on cron_runs for select to anon, authenticated using (true);

comment on table cron_runs is
  'Audit log for scheduled jobs. Each row tracks one execution: when it started, when it finished, what it did, and whether it succeeded. Powers the "Next refresh / Last run" admin widget.';
