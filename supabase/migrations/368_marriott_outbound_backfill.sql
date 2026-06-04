-- ============================================================================
-- 368 - Relocate Marriott Bonvoy's transfer edges into the outbound model.
-- Marriott had 50 "ways to earn" edges stored inbound (on each airline's legacy
-- transfer_partners) but only 3 rows in its own transfer_partners_outbound.
-- The site is moving to a single source of truth: each SOURCE program holds its
-- outbound list, and destination pages DERIVE their "Ways to earn more" from it.
-- This relocates Marriott's authored 3:1 edges into marriott-bonvoy.outbound so
-- nothing is lost when the render switches to derive-from-outbound.
-- Slugs/ratios preserved as-is (entity-vs-program slug canonicalization is a
-- separate follow-up). Dedupes against the 3 existing outbound rows.
-- ============================================================================
update programs m set
  transfer_partners_outbound = (
    select jsonb_agg(r.row order by r.dest)
    from (
      select distinct on (dest) dest,
        jsonb_build_object(
          'from_slug', dest,
          'ratio', ratio,
          'bonus_active', false,
          'notes', notes
        ) as row
      from (
        -- existing outbound rows (priority 0)
        select 0 as prio, p->>'from_slug' as dest, p->>'ratio' as ratio,
          coalesce(p->>'notes', 'Marriott Bonvoy points transfer to airline miles.') as notes
        from programs, jsonb_array_elements(transfer_partners_outbound) p
        where slug = 'marriott-bonvoy'
        union all
        -- relocated legacy inbound edges (priority 1)
        select 1 as prio, d.slug as dest, e->>'ratio' as ratio,
          coalesce(e->>'notes', 'Marriott Bonvoy points transfer to airline miles (3:1; 5,000-mile bonus per 60,000 transferred).') as notes
        from programs d, jsonb_array_elements(d.transfer_partners) e
        where e->>'from_slug' = 'marriott-bonvoy'
      ) u
      order by dest, prio
    ) r
  ),
  last_verified = now(), updated_at = now()
where slug = 'marriott-bonvoy';

select slug, jsonb_array_length(transfer_partners_outbound) outbound_count
from programs where slug = 'marriott-bonvoy';
