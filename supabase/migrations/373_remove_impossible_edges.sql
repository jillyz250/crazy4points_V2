-- ============================================================================
-- 373 - Remove "impossible" reverse transfer edges (data-integrity audit catch).
--
-- 10 outbound rows pointed from a hotel/loyalty_program TO a credit_card
-- currency (ba-avios/hyatt/marriott -> amex/chase/bilt/capital-one/wells-fargo).
-- That direction is impossible: currencies transfer INTO hotels/airlines, not
-- the reverse. Sources:
--   - ba-avios (5) + hyatt (2): pre-existing bad authoring (entire ba-avios
--     outbound was backwards).
--   - marriott-bonvoy (3): collateral from migration 368, which relocated stale
--     legacy inbound edges that themselves had the direction wrong.
-- The correct relationships already live in the currencies' own outbound and
-- render on the hotel/airline pages via the derive. Pure correction.
-- ============================================================================
update programs c set
  transfer_partners_outbound = (
    select coalesce(jsonb_agg(p), '[]'::jsonb)
    from jsonb_array_elements(c.transfer_partners_outbound) p
    where not exists (
      select 1 from programs t where t.slug = p->>'from_slug' and t.type = 'credit_card'
    )
  ),
  updated_at = now()
where c.type <> 'credit_card'
  and exists (
    select 1 from jsonb_array_elements(c.transfer_partners_outbound) p
    join programs t on t.slug = p->>'from_slug'
    where t.type = 'credit_card'
  );

-- verify: should be 0
select count(*) as remaining_impossible_edges
from programs c, jsonb_array_elements(c.transfer_partners_outbound) p
join programs t on t.slug = p->>'from_slug'
where c.type <> 'credit_card' and t.type = 'credit_card';
