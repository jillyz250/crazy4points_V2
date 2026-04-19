-- Content ideas pipeline — blog post ideas and weekly newsletter candidates
-- produced by the daily editorial plan, with manual status management in admin.

create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('newsletter', 'blog')),
  title text not null,
  pitch text not null,
  status text not null default 'new' check (status in ('new', 'queued', 'drafted', 'published', 'dismissed')),
  source text not null default 'editorial_plan' check (source in ('editorial_plan', 'manual')),
  source_brief_id uuid references daily_briefs(id) on delete set null,
  source_intel_id uuid references intel_items(id) on delete set null,
  source_alert_id uuid references alerts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_ideas_status_idx on content_ideas(status);
create index if not exists content_ideas_type_idx on content_ideas(type);
create index if not exists content_ideas_created_at_idx on content_ideas(created_at desc);

-- Dedupe helper: keep only one open idea per (type, source_intel_id) and
-- per (type, lower(title)) so repeated daily briefs don't duplicate the queue.
create unique index if not exists content_ideas_type_intel_open_uq
  on content_ideas(type, source_intel_id)
  where source_intel_id is not null and status in ('new', 'queued');

create unique index if not exists content_ideas_type_title_open_uq
  on content_ideas(type, lower(title))
  where status in ('new', 'queued');
