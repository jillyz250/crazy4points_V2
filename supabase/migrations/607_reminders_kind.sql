-- Separate experience-auction reminders from real to-dos on the admin dashboard.
--
-- The experiences watch cron (createBidReminders) auto-inserts one "Bidding
-- closes ..." reminder per closing auction. Those flooded the reminders board
-- and buried the handful of real to-dos. This column lets the dashboard render
-- them in their own collapsed section, and lets the cron tag new ones.
--
-- kind:
--   'todo'       - a real to-do / reminder the admin (or triage) added
--   'experience' - an auto-generated experience-auction "bidding closes" nudge
--
-- Additive + backfilled; nothing else changes. Default 'todo' so hand-added
-- reminders and every existing non-experience row stay to-dos.

alter table reminders
  add column if not exists kind text not null default 'todo'
    check (kind in ('todo', 'experience'));

-- Backfill: everything the watch cron created is an experience bid reminder.
-- Match on the title prefix it always uses ("Bidding closes YYYY-MM-DD: ...").
update reminders
   set kind = 'experience'
 where kind <> 'experience'
   and title like 'Bidding closes %';

-- Dashboard queries filter by kind + status; index the pair.
create index if not exists reminders_kind_status_idx on reminders (kind, status);
