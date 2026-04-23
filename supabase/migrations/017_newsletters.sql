-- Ship 11a — weekly newsletter V1
-- Creates the newsletters table (one row per week), storing the Sonnet-generated
-- draft (structured JSON + rendered HTML), the 3 subject options, the Penny
-- comic, and send state. Manual-send model: status flows draft -> sent.

create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  week_of date not null unique,
  subject text,
  subject_options jsonb,
  body_html text,
  draft_json jsonb,
  comic_url text,
  comic_meta jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  recipient_count int,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletters_status_idx on newsletters(status);
create index if not exists newsletters_created_at_idx on newsletters(created_at desc);

create or replace function newsletters_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists newsletters_updated_at on newsletters;
create trigger newsletters_updated_at
  before update on newsletters
  for each row execute function newsletters_set_updated_at();
