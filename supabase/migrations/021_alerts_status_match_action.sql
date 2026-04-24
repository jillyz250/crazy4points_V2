-- Add 'status_match' as an alert action_type. Status matches are a
-- distinct action from credit card applications — different reader flow,
-- different urgency, different CTA. Previously bucketed under 'apply'.
--
-- Handles both schema shapes: postgres enum OR text+check constraint.
do $$
begin
  if exists (select 1 from pg_type where typname = 'alert_action_type') then
    alter type alert_action_type add value if not exists 'status_match';
  end if;
end$$;
