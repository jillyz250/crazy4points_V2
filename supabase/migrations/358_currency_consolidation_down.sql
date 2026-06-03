-- ============================================================================
-- 358 DOWN - revert the currency consolidation (Phase 1).
--
-- SUPPORTED ONLY BEFORE PHASE 2 deletion. This restores every touched row from
-- the snapshot table written by the UP migration. After Phase 2 hard-deletes
-- the long rows (and new data may assume the consolidated world), rollback is
-- best-effort / manual from the snapshot - do NOT rely on this script then.
--
-- Apply: supabase db query --linked --file supabase/migrations/358_currency_consolidation_down.sql
-- ============================================================================
begin;

-- Same alerts G6 bypass as the UP migration (structural FK restore, not content).
set local app.alerts_allow_direct_writes = 'on';

do $$
begin
  if to_regclass('public._currency_consolidation_snapshot_358') is null then
    raise exception 'ABORT: snapshot table _currency_consolidation_snapshot_358 not found - cannot revert';
  end if;
end $$;

-- programs: restore name, notes, is_active, and the transfer jsonb arrays.
update programs p set
  name = s.row_json->>'name',
  notes = s.row_json->>'notes',
  is_active = (s.row_json->>'is_active')::boolean,
  transfer_partners = s.row_json->'transfer_partners',
  transfer_partners_outbound = s.row_json->'transfer_partners_outbound'
from _currency_consolidation_snapshot_358 s
where s.source_table in ('programs','programs.transfer_jsonb') and p.id = s.row_id::uuid;

-- alert_programs: restore program_id on surviving rows...
update alert_programs ap set program_id = (s.row_json->>'program_id')::uuid
from _currency_consolidation_snapshot_358 s
where s.source_table = 'alert_programs' and ap.id = s.row_id::uuid;

-- ...and re-insert the collision rows the UP migration deleted.
insert into alert_programs (id, alert_id, program_id, role, created_at)
select (s.row_json->>'id')::uuid, (s.row_json->>'alert_id')::uuid,
       (s.row_json->>'program_id')::uuid, s.row_json->>'role',
       (s.row_json->>'created_at')::timestamptz
from _currency_consolidation_snapshot_358 s
where s.source_table = 'alert_programs'
  and not exists (select 1 from alert_programs ap where ap.id = s.row_id::uuid);

-- alerts / alert_history / credit_cards: restore the program-id columns.
update alerts a set primary_program_id = (s.row_json->>'primary_program_id')::uuid
from _currency_consolidation_snapshot_358 s where s.source_table='alerts' and a.id = s.row_id::uuid;

update alert_history h set primary_program_id = (s.row_json->>'primary_program_id')::uuid
from _currency_consolidation_snapshot_358 s where s.source_table='alert_history' and h.id = s.row_id::uuid;

update credit_cards c set currency_program_id = (s.row_json->>'currency_program_id')::uuid
from _currency_consolidation_snapshot_358 s where s.source_table='credit_cards' and c.id = s.row_id::uuid;

-- Snapshot table is left in place for audit. Drop manually once satisfied:
--   drop table _currency_consolidation_snapshot_358;
commit;
