-- intel_items: raw intelligence inbox for Claude Scout
create table if not exists intel_items (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  source_url      text,
  source_type     text not null check (source_type in ('official', 'blog', 'reddit', 'social')),
  source_name     text not null,
  raw_text        text,
  headline        text not null,
  confidence      text not null check (confidence in ('high', 'medium', 'low')),
  alert_type      text,
  programs        text[],
  expires_at      timestamptz,
  processed       boolean not null default false,
  alert_id        uuid references alerts(id) on delete set null
);

-- alerts table additions
alter table alerts
  add column if not exists source_intel_id uuid references intel_items(id) on delete set null,
  add column if not exists approved_at     timestamptz;
