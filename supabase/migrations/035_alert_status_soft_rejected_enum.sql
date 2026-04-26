-- Phase 2 followup: alerts.status is a Postgres enum (alert_status), not plain
-- text. Migration 031 added columns + the AlertStatus TS type but never
-- extended the enum, so any UPDATE setting status='soft_rejected' fails with
-- 22P02 invalid_text_representation. This adds the missing enum value.

alter type alert_status add value if not exists 'soft_rejected';
