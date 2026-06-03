-- ============================================================================
-- 358 - Currency-program consolidation (Phase 1: repoint + rename + deprecate)
--
-- Each transferable currency had TWO `programs` rows: a SHORT credit_card row
-- (canonical, KEEP) and a duplicate LONG loyalty_program "-rewards" row
-- (RETIRE). Dry-run + probes proved: alerts point at the LONG rows, cards at
-- the SHORT rows. We standardize onto the SHORT rows. NO type/slug/id changes
-- to survivors (so the Resources listing - which routes on `type` - is
-- unaffected). Full investigation: scripts/currency-consolidation-dryrun.sql.
--
-- This is PHASE 1 only: repoint every reference, rename survivors to the
-- currency name, then DEPRECATE (not delete) the long rows. Phase 2 (a later
-- migration) hard-deletes them after a clean verification window.
--
-- Evidence baked into this migration (all read-only-verified pre-write):
--   * 38 FK-by-id refs to retire rows (23 alert_programs, 10 alerts,
--     2 alert_history, 3 credit_cards). Zero in the other 15 FK columns.
--   * 49 jsonb from_slug refs (transfer_partners + transfer_partners_outbound).
--     No array holds both a short+long entry for one currency => clean in-place
--     rewrite, order preserved, NO dedupe of partner lists needed.
--   * 0 outbound partner drift, 0 jsonb payload conflicts (re-asserted below).
--   * 3 alert_programs collisions (alert links both rows) - resolved role-aware.
--   * Editorial/historical jsonb blobs (fact_check_claims, revision_log,
--     fact_ledger, draft_json, metadata, program_facts.sources) deliberately
--     LEFT AS-IS: bare string mentions, no links, no FK - records of history.
--
-- Apply: supabase db query --linked --file supabase/migrations/358_currency_consolidation.sql
-- ============================================================================
begin;

-- alerts has a trigger (G6) blocking direct writes to force content through
-- content_variants. We are only repointing the structural primary_program_id
-- FK (not content), so enable the sanctioned bypass for THIS transaction only.
set local app.alerts_allow_direct_writes = 'on';

-- The retire->keep mapping (+ the currency name each survivor adopts).
create temporary table _cc_map on commit drop as
select pp.retire_slug, pp.keep_slug, pp.keep_name, r.id retire_id, k.id keep_id
from (values
  ('amex-membership-rewards','amex','American Express Membership Rewards'),
  ('chase-ultimate-rewards','chase','Chase Ultimate Rewards'),
  ('bilt-rewards','bilt','Bilt Rewards'),
  ('citi-thankyou','citi','Citi ThankYou Rewards'),
  ('wells-fargo-rewards','wells-fargo','Wells Fargo Rewards')
) pp(retire_slug, keep_slug, keep_name)
join programs r on r.slug = pp.retire_slug
join programs k on k.slug = pp.keep_slug;

-- Safety: all 5 pairs must resolve, or abort.
do $$
declare n int;
begin
  select count(*) into n from _cc_map;
  if n <> 5 then raise exception 'ABORT: expected 5 currency pairs, found %', n; end if;
end $$;

-- ---------------------------------------------------------------------------
-- STEP 1 - SNAPSHOT every row we are about to touch (rollback source for
-- Phase 2, when the long rows no longer exist).
-- ---------------------------------------------------------------------------
create table if not exists _currency_consolidation_snapshot_358 (
  captured_at timestamptz not null default now(),
  source_table text not null,
  row_id text not null,
  row_json jsonb not null
);

insert into _currency_consolidation_snapshot_358 (source_table, row_id, row_json)
select 'programs', p.id::text, to_jsonb(p.*) from programs p
  where p.id in (select retire_id from _cc_map) or p.id in (select keep_id from _cc_map)
union all
select 'alert_programs', ap.id::text, to_jsonb(ap.*) from alert_programs ap
  where ap.program_id in (select retire_id from _cc_map)
union all
select 'alerts', a.id::text, to_jsonb(a.*) from alerts a
  where a.primary_program_id in (select retire_id from _cc_map)
union all
select 'alert_history', h.id::text, to_jsonb(h.*) from alert_history h
  where h.primary_program_id in (select retire_id from _cc_map)
union all
select 'credit_cards', c.id::text, to_jsonb(c.*) from credit_cards c
  where c.currency_program_id in (select retire_id from _cc_map)
union all
select 'programs.transfer_jsonb', p.id::text, to_jsonb(p.*) from programs p
  where exists (
    select 1 from jsonb_array_elements(coalesce(p.transfer_partners,'[]'::jsonb)
                                       || coalesce(p.transfer_partners_outbound,'[]'::jsonb)) e
    where e->>'from_slug' in (select retire_slug from _cc_map));

-- ---------------------------------------------------------------------------
-- STEP 2 - HARD STOP: re-assert zero jsonb payload conflicts (same currency,
-- different ratio/notes after normalization). Aborts the whole transaction if
-- data drifted since the dry-run.
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from (
    select p.id, src.col, km.keep_slug
    from programs p
    cross join lateral (values ('a', p.transfer_partners), ('b', p.transfer_partners_outbound)) src(col, arr)
    cross join lateral jsonb_array_elements(coalesce(src.arr,'[]'::jsonb)) e
    join (select retire_slug any_slug, keep_slug from _cc_map
          union all select keep_slug, keep_slug from _cc_map) km on km.any_slug = e->>'from_slug'
    group by p.id, src.col, km.keep_slug
    having count(*) > 1 and count(distinct jsonb_set(e, '{from_slug}', to_jsonb(km.keep_slug))) > 1
  ) x;
  if n > 0 then raise exception 'ABORT: % jsonb payload conflict(s) (same currency, differing ratio/notes). Resolve manually.', n; end if;
end $$;

-- ---------------------------------------------------------------------------
-- STEP 3 - rename survivors to the currency name (so alerts repointed off the
-- long rows keep their currency-style display name). slug/type/id unchanged.
-- ---------------------------------------------------------------------------
update programs p set name = m.keep_name
from _cc_map m where p.id = m.keep_id and p.name is distinct from m.keep_name;

-- ---------------------------------------------------------------------------
-- STEP 4 - repoint FK references retire_id -> keep_id.
-- alert_programs has no UNIQUE(alert_id,program_id), so an UPDATE won't error,
-- but 3 alerts link BOTH rows. Collapse each to ONE link, keeping the STRONGER
-- role (primary > secondary); tie -> drop the retire-side row. (Known cases:
-- chase alert keeps primary via the retire row; citi keeps primary via keep
-- row; amex both-secondary collapses to one.)
-- ---------------------------------------------------------------------------
with role_pri(role, pri) as (values ('primary',2),('secondary',1)),
collide as (
  select ka.id keep_row, ra.id retire_row,
         coalesce(kp.pri,0) keep_pri, coalesce(rp.pri,0) retire_pri
  from _cc_map m
  join alert_programs ka on ka.program_id = m.keep_id
  join alert_programs ra on ra.program_id = m.retire_id and ra.alert_id = ka.alert_id
  left join role_pri kp on kp.role = ka.role
  left join role_pri rp on rp.role = ra.role
)
delete from alert_programs ap
using collide c
where ap.id = case when c.keep_pri >= c.retire_pri then c.retire_row else c.keep_row end;

-- Bulk repoint the remaining references (junction survivors keep their role).
update alert_programs ap set program_id = m.keep_id from _cc_map m where ap.program_id = m.retire_id;
update alerts        a  set primary_program_id = m.keep_id from _cc_map m where a.primary_program_id = m.retire_id;
update alert_history h  set primary_program_id = m.keep_id from _cc_map m where h.primary_program_id = m.retire_id;
update credit_cards  c  set currency_program_id = m.keep_id from _cc_map m where c.currency_program_id = m.retire_id;

-- ---------------------------------------------------------------------------
-- STEP 5 - rewrite jsonb from_slug long->short IN PLACE (order preserved via
-- WITH ORDINALITY). Probe proved no array holds both short+long for a currency,
-- so no duplicates are created and no partner-list dedupe is needed.
-- ---------------------------------------------------------------------------
update programs p set transfer_partners = sub.arr
from (
  select p2.id, jsonb_agg(
           case when m.keep_slug is not null
                then jsonb_set(e.elem, '{from_slug}', to_jsonb(m.keep_slug))
                else e.elem end
           order by e.ord) arr
  from programs p2
  cross join lateral jsonb_array_elements(coalesce(p2.transfer_partners,'[]'::jsonb)) with ordinality e(elem, ord)
  left join _cc_map m on m.retire_slug = e.elem->>'from_slug'
  group by p2.id
) sub
where p.id = sub.id
  and exists (select 1 from jsonb_array_elements(coalesce(p.transfer_partners,'[]'::jsonb)) x
              where x->>'from_slug' in (select retire_slug from _cc_map));

update programs p set transfer_partners_outbound = sub.arr
from (
  select p2.id, jsonb_agg(
           case when m.keep_slug is not null
                then jsonb_set(e.elem, '{from_slug}', to_jsonb(m.keep_slug))
                else e.elem end
           order by e.ord) arr
  from programs p2
  cross join lateral jsonb_array_elements(coalesce(p2.transfer_partners_outbound,'[]'::jsonb)) with ordinality e(elem, ord)
  left join _cc_map m on m.retire_slug = e.elem->>'from_slug'
  group by p2.id
) sub
where p.id = sub.id
  and exists (select 1 from jsonb_array_elements(coalesce(p.transfer_partners_outbound,'[]'::jsonb)) x
              where x->>'from_slug' in (select retire_slug from _cc_map));

-- ---------------------------------------------------------------------------
-- STEP 6 - DEPRECATE (not delete) the long rows. is_active already false; mark
-- them so any stray consumer is obvious and Phase 2 can verify zero hits.
-- ---------------------------------------------------------------------------
update programs p
  set is_active = false,
      notes = 'DEPRECATED ' || to_char(now(),'YYYY-MM-DD') || ' -> consolidated into /programs/' || m.keep_slug
              || coalesce('. Prior notes: ' || nullif(p.notes,''), '')
from _cc_map m where p.id = m.retire_id;

-- ---------------------------------------------------------------------------
-- STEP 7 - post-conditions: every retire row must now have ZERO inbound refs
-- (the deprecated rows are orphaned and safe for Phase 2 deletion).
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select
    (select count(*) from alert_programs where program_id in (select retire_id from _cc_map))
  + (select count(*) from alerts where primary_program_id in (select retire_id from _cc_map))
  + (select count(*) from alert_history where primary_program_id in (select retire_id from _cc_map))
  + (select count(*) from credit_cards where currency_program_id in (select retire_id from _cc_map))
  + (select count(*) from programs p
       where exists (select 1 from jsonb_array_elements(
              coalesce(p.transfer_partners,'[]'::jsonb) || coalesce(p.transfer_partners_outbound,'[]'::jsonb)) e
              where e->>'from_slug' in (select retire_slug from _cc_map)))
    into n;
  if n > 0 then raise exception 'ABORT: % residual reference(s) to retire rows after repoint', n; end if;
end $$;

commit;
