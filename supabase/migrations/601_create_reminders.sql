-- Admin personal reminders / to-do list, surfaced on the admin dashboard.
-- Free-text items the admin types in; optional due date; sortable by date.
-- Not public-facing (admin app uses the service-role client, which bypasses RLS).
create table if not exists reminders (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,                    -- the free-text item
  notes         text,                             -- optional detail / checklist
  due_date      date,                             -- NULL = undated to-do
  status        text not null default 'open',     -- open | done
  link          text,                             -- optional deep-link into admin
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists reminders_status_due_idx on reminders (status, due_date);
