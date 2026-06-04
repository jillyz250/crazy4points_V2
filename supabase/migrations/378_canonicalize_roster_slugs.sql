-- ============================================================================
-- 378 - Canonicalize transfer-roster slugs (the Q1 cleanup, roster portion).
-- Marriott + Accor stored airline partners under ENTITY slugs where they should
-- use the loyalty-PROGRAM slug the rest of the site (and the currencies) use.
-- This caused (a) reverify monitor noise and (b) a real display bug: Marriott
-- pointed to air-france/klm/british-airways, so it never appeared on the
-- flying-blue/ba-avios "Ways to earn more" even though you CAN transfer there.
--
-- Remap + dedupe (collapses the now-duplicate rows, keeping the first/its ratio):
--   air-canada            -> aeroplan
--   air-france, klm       -> flying-blue   (Air France-KLM share one program)
--   british-airways       -> ba-avios      (BA Executive Club uses Avios)
--   austrian, swiss, lufthansa -> miles-and-more  (all credit Miles & More)
-- Only marriott-bonvoy + accor have these slugs. (alaska/hawaiian already gone.)
-- The page-redirect side of Q1 (301'ing the entity PAGES) remains a separate task.
-- ============================================================================
update programs c set
  transfer_partners_outbound = (
    select jsonb_agg(elem order by ord)
    from (
      select distinct on (elem->>'from_slug') elem, ord
      from (
        select jsonb_set(p, '{from_slug}', to_jsonb(
          (case p->>'from_slug'
            when 'air-canada' then 'aeroplan'
            when 'air-france' then 'flying-blue'
            when 'klm' then 'flying-blue'
            when 'british-airways' then 'ba-avios'
            when 'austrian' then 'miles-and-more'
            when 'swiss' then 'miles-and-more'
            when 'lufthansa' then 'miles-and-more'
            else p->>'from_slug'
          end)::text)) as elem, ord
        from jsonb_array_elements(c.transfer_partners_outbound) with ordinality as t(p, ord)
      ) m
      order by elem->>'from_slug', ord
    ) d
  ),
  updated_at = now()
where c.slug in ('marriott-bonvoy', 'accor');

-- verify: entity slugs gone; canonical present; marriott now on flying-blue's inbound
select
  (select count(*) from programs c, jsonb_array_elements(c.transfer_partners_outbound) p
     where p->>'from_slug' in ('air-canada','air-france','klm','british-airways','austrian','swiss','lufthansa')) as entity_slugs_remaining,
  (select jsonb_array_length(transfer_partners_outbound) from programs where slug='marriott-bonvoy') as marriott_count,
  (select exists(select 1 from programs c, jsonb_array_elements(c.transfer_partners_outbound) p
     where c.slug='marriott-bonvoy' and p->>'from_slug'='flying-blue')) as marriott_has_flying_blue;
