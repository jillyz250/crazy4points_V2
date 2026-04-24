-- Hot Alerts bar: manual editorial feature flag. Pairs with the "fresh"
-- window (alerts published within last 48h) in selectHotAlerts on the
-- homepage. Evergreen sweet-spot wins can stay pinned via is_hot when
-- they fall out of the freshness window.
alter table alerts
  add column if not exists is_hot boolean not null default false;
