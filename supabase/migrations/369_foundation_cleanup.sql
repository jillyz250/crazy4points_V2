-- ============================================================================
-- 369 - Foundation cleanup (post slug/taxonomy audit).
--
-- Q2: Hard-delete the 4 deprecated duplicate currency rows left over from the
--     currency consolidation (the long loyalty_program slugs). They are
--     inactive, hold stale outbound copies, and 12 references still point at
--     them (alert_programs x10, alerts.primary_program_id x2). Repoint those to
--     the canonical short rows, then delete. FK sweep confirmed no other table
--     references them.
-- Q3: Add reference stubs for 3 airlines that are Accor transfer targets but
--     had no program row (links rendered dead).
--
-- Q1 (entity-vs-program canonicalization) is intentionally NOT here - it's a
-- scheduled per-carrier pass (see memory project_derive_inbound_from_outbound).
-- ============================================================================
set app.alerts_allow_direct_writes = 'on';

-- --- Q3: orphan airline stubs ----------------------------------------------
insert into programs (slug, name, type, is_active, is_reference_stub)
values
  ('air-europa', 'Air Europa SUMA', 'airline', true, true),
  ('juneyao',    'Juneyao Air',     'airline', true, true),
  ('smiles',     'GOL Smiles',      'airline', true, true)
on conflict (slug) do nothing;

-- --- Q2: repoint references long -> short, then delete ----------------------
-- alerts.primary_program_id (2 rows)
update alerts a set primary_program_id = sp.id
from programs lp join programs sp
  on (lp.slug, sp.slug) in (
    ('amex-membership-rewards','amex'),
    ('bilt-rewards','bilt'),
    ('chase-ultimate-rewards','chase'),
    ('citi-thankyou','citi'))
where a.primary_program_id = lp.id;

-- alert_programs.program_id - first drop collisions (alert already linked to the
-- short row), then repoint the rest.
delete from alert_programs ap
using programs lp join programs sp
  on (lp.slug, sp.slug) in (
    ('amex-membership-rewards','amex'),
    ('bilt-rewards','bilt'),
    ('chase-ultimate-rewards','chase'),
    ('citi-thankyou','citi'))
where ap.program_id = lp.id
  and exists (select 1 from alert_programs ap2 where ap2.alert_id = ap.alert_id and ap2.program_id = sp.id);

update alert_programs ap set program_id = sp.id
from programs lp join programs sp
  on (lp.slug, sp.slug) in (
    ('amex-membership-rewards','amex'),
    ('bilt-rewards','bilt'),
    ('chase-ultimate-rewards','chase'),
    ('citi-thankyou','citi'))
where ap.program_id = lp.id;

-- delete the now-unreferenced deprecated rows
delete from programs
where slug in ('amex-membership-rewards','bilt-rewards','chase-ultimate-rewards','citi-thankyou');

-- --- verify -----------------------------------------------------------------
select 'remaining_dead_rows' as check, count(*)::text as val from programs
  where slug in ('amex-membership-rewards','bilt-rewards','chase-ultimate-rewards','citi-thankyou')
union all
select 'orphan_stubs_present', count(*)::text from programs where slug in ('air-europa','juneyao','smiles')
union all
select 'amex_alerts_after', count(*)::text from alert_programs ap join programs p on p.id=ap.program_id where p.slug='amex';
