-- ============================================================================
-- Currency-program consolidation - READ-ONLY DRY RUN (Phase 0)
--
-- Plan (2026-06-03 decision): each transferable currency exists as TWO
-- `programs` rows - a short credit_card row (canonical, KEEP) and an empty
-- loyalty_program "-rewards" row (duplicate, RETIRE). Standardize onto the
-- SHORT rows: NO `type` flips (no Resources-listing category moves), fewer
-- card repoints, matches how Wells Fargo was authored.
--
-- RETIRE long slug -> KEEP short slug:
--   amex-membership-rewards->amex, chase-ultimate-rewards->chase,
--   bilt-rewards->bilt, citi-thankyou->citi, wells-fargo-rewards->wells-fargo
--   (capital-one already has only the short row - nothing to retire)
--
-- ONE statement, uniform (section,label,detail,n) so the Supabase CLI (which
-- returns only the LAST result) shows everything. SELECT-only; changes nothing.
--   supabase db query --linked --file scripts/currency-consolidation-dryrun.sql
-- ============================================================================
with
pairs(retire_slug, keep_slug) as (
  values ('amex-membership-rewards','amex'),('chase-ultimate-rewards','chase'),
         ('bilt-rewards','bilt'),('citi-thankyou','citi'),('wells-fargo-rewards','wells-fargo')
),
retire as (select r.id, p.retire_slug slug, p.keep_slug from pairs p join programs r on r.slug=p.retire_slug),
keepmap as (select retire_slug any_slug, keep_slug from pairs union all select keep_slug, keep_slug from pairs),
refs as (
  select 'alert_history.primary_program_id' surface, primary_program_id id from alert_history
  union all select 'alert_programs.program_id', program_id from alert_programs
  union all select 'alerts.primary_program_id', primary_program_id from alerts
  union all select 'chart_snapshots.program_id', program_id from chart_snapshots
  union all select 'credit_cards.co_brand_program_id', co_brand_program_id from credit_cards
  union all select 'credit_cards.currency_program_id', currency_program_id from credit_cards
  union all select 'hotel_properties.program_id', program_id from hotel_properties
  union all select 'intel_items.conflicts_program_id', conflicts_program_id from intel_items
  union all select 'intel_raw.program_id', program_id from intel_raw
  union all select 'partner_redemptions.currency_program_id', currency_program_id from partner_redemptions
  union all select 'partner_redemptions.operating_carrier_id', operating_carrier_id from partner_redemptions
  union all select 'program_extractions.program_id', program_id from program_extractions
  union all select 'program_field_history.program_id', program_id from program_field_history
  union all select 'program_transfers.from_program_id', from_program_id from program_transfers
  union all select 'program_transfers.to_program_id', to_program_id from program_transfers
  union all select 'promo_rewards.program_id', program_id from promo_rewards
  union all select 'scrape_runs.program_id', program_id from scrape_runs
  union all select 'transfer_partners.from_program_id', from_program_id from transfer_partners
  union all select 'transfer_partners.to_program_id', to_program_id from transfer_partners
),
keep_p as (
  select p.keep_slug, e->>'from_slug' partner
  from pairs p join programs k on k.slug=p.keep_slug
  cross join lateral jsonb_array_elements(coalesce(k.transfer_partners_outbound,'[]'::jsonb)) e
),
retire_p as (
  select p.keep_slug, e->>'from_slug' partner
  from pairs p join programs r on r.slug=p.retire_slug
  cross join lateral jsonb_array_elements(coalesce(r.transfer_partners_outbound,'[]'::jsonb)) e
)

-- SECTION 0: pair sanity
select '0. PAIR SANITY' section,
       p.retire_slug label,
       'retire_exists='||(r.id is not null)||' retire_type='||coalesce(r.type::text,'?')||
       ' | keep_exists='||(k.id is not null)||' keep_type='||coalesce(k.type::text,'?')||
       ' keep_authored='||(k.content_updated_at is not null) detail,
       null::bigint n
from pairs p left join programs r on r.slug=p.retire_slug left join programs k on k.slug=p.keep_slug

union all
-- SECTION 1: FK references BY ID to retire rows (each = a repoint to do)
select '1. FK-BY-ID -> retire', refs.surface, 'remap '||retire.slug||' -> '||retire.keep_slug, count(*)
from refs join retire on refs.id = retire.id
group by refs.surface, retire.slug, retire.keep_slug

union all
-- SECTION 2: jsonb from_slug refs to retire slugs (each = a jsonb rewrite)
select '2. JSONB from_slug -> retire', src.col,
       p.slug||' has from_slug='||(e->>'from_slug'), null::bigint
from programs p
cross join lateral (values ('transfer_partners_outbound', p.transfer_partners_outbound),
                           ('transfer_partners', p.transfer_partners)) src(col, arr)
cross join lateral jsonb_array_elements(coalesce(src.arr,'[]'::jsonb)) e
where e->>'from_slug' in (select slug from retire)

union all
-- SECTION 3: scalar/array slug columns
select '3. slug-col -> retire', '3a programs.parent_program_slug', p.slug||' -> '||p.parent_program_slug, null::bigint
  from programs p where p.parent_program_slug in (select slug from retire)
union all
select '3. slug-col -> retire', '3b programs.member_programs', p.slug||' -> '||mp, null::bigint
  from programs p cross join lateral jsonb_array_elements_text(coalesce(p.member_programs,'[]'::jsonb)) mp
  where mp in (select slug from retire)
union all
select '3. slug-col -> retire', '3c content_ideas.primary_program_slug', ci.id::text||' -> '||ci.primary_program_slug, null::bigint
  from content_ideas ci where ci.primary_program_slug in (select slug from retire)
union all
select '3. slug-col -> retire', '3d content_ideas.secondary_program_slugs', ci.id::text||' -> '||s, null::bigint
  from content_ideas ci cross join lateral unnest(coalesce(ci.secondary_program_slugs, array[]::text[])) s
  where s in (select slug from retire)

union all
-- SECTION 4: outbound transfer-list drift (partner only on the retire row = would be lost)
select '4. OUTBOUND DRIFT', rp.keep_slug, 'LOST unless merged: partner '||rp.partner, null::bigint
from retire_p rp left join keep_p kp on kp.keep_slug=rp.keep_slug and kp.partner=rp.partner
where kp.partner is null

union all
-- SECTION 5: alert_programs collisions (alert links BOTH the retire and keep row).
-- Must read 0 after migration. Pre-migration these are resolved role-aware.
select '5. alert_programs COLLISION', pp.keep_slug,
       'alert '||ka.alert_id||' links keep(role='||coalesce(ka.role,'?')||') + retire(role='||coalesce(ra.role,'?')||')', null::bigint
from pairs pp
join programs k on k.slug=pp.keep_slug join alert_programs ka on ka.program_id=k.id
join programs r on r.slug=pp.retire_slug join alert_programs ra on ra.program_id=r.id and ra.alert_id=ka.alert_id

union all
-- SECTION 6: jsonb payload CONFLICT (same currency, differing ratio/notes after
-- normalization). Hard-stop in the migration. Must be 0 to dedupe safely.
select '6. jsonb payload CONFLICT', p.slug,
       src.col||' currency='||km.keep_slug||': '||count(*)||' entries / '||count(distinct jsonb_set(e,'{from_slug}',to_jsonb(km.keep_slug)))||' payloads', null::bigint
from programs p
cross join lateral (values ('transfer_partners', p.transfer_partners),('transfer_partners_outbound', p.transfer_partners_outbound)) src(col, arr)
cross join lateral jsonb_array_elements(coalesce(src.arr,'[]'::jsonb)) e
join keepmap km on km.any_slug = e->>'from_slug'
group by p.slug, src.col, km.keep_slug
having count(*) > 1 and count(distinct jsonb_set(e,'{from_slug}',to_jsonb(km.keep_slug))) > 1

order by section, label, detail;
