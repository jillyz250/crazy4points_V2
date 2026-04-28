-- Add 'buy_miles' as an alert action_type for buy-points/miles promos.
-- These have a distinct reader flow from "transfer" (no source program to
-- pull from) and "book" (you're not booking travel yet) — they're a
-- recurring category with their own playbook (United, Aeroplan, AA,
-- Avianca, Alaska, Avios run them on cycle).
--
-- Mirrors 021_alerts_status_match_action.sql — the alerts.action_type
-- column uses the enum type named `action_type` (not `alert_action_type`).
-- Idempotent + safe under both enum and text+check shapes.
do $$
begin
  if exists (select 1 from pg_type where typname = 'action_type') then
    alter type action_type add value if not exists 'buy_miles';
  end if;
end$$;
