create table if not exists daily_briefs (
  id              uuid primary key default gen_random_uuid(),
  brief_date      date not null unique,
  editorial_plan  jsonb not null,
  intel_count     integer not null,
  sent_at         timestamptz not null default now(),
  actions         jsonb not null default '[]'::jsonb
);

create index if not exists daily_briefs_brief_date_idx on daily_briefs (brief_date desc);

comment on table  daily_briefs is 'One row per daily brief email. Stores the Sonnet editorial plan and a log of approve/reject actions taken via email one-click links.';
comment on column daily_briefs.editorial_plan is 'Full EditorialPlan JSON from generateEditorialPlan() — approve/reject/featured_slots/blog_ideas/today_intel_notes.';
comment on column daily_briefs.actions is 'Append-only log: [{action, intel_id|alert_id, taken_at}]. Used to prevent double-submit of one-click tokens.';
