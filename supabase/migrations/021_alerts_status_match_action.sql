-- Add 'status_match' as an alert action_type. Status matches are a
-- distinct action from credit card applications — different reader flow,
-- different urgency, different CTA. Previously bucketed under 'apply'.
--
-- The alerts.action_type column uses the enum type named `action_type`
-- (not `alert_action_type`). Handles both enum and text+check shapes.
do $$
begin
  if exists (select 1 from pg_type where typname = 'action_type') then
    alter type action_type add value if not exists 'status_match';
  end if;
end$$;
