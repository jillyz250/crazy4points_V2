-- Add 'activate' as an alert action_type for shopping-portal click-throughs,
-- dining program registrations, retention offer activations, and other
-- "opt in then earn from normal spending" patterns that don't fit
-- book / transfer / apply / status_match / buy_miles / monitor / learn.
--
-- Surface label: "Activate & Earn".
--
-- Mirrors 021 / 045 — alerts.action_type uses the enum named `action_type`.
-- Idempotent + safe under both enum and text+check shapes.
do $$
begin
  if exists (select 1 from pg_type where typname = 'action_type') then
    alter type action_type add value if not exists 'activate';
  end if;
end$$;
