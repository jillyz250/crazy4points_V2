-- ============================================================================
-- 376 - Normalize Marriott outbound ratios + bonus story (audit follow-up).
-- The ratio field was inconsistent: most rows bare "3:1", a couple carried inline
-- "3:1 with 5K bonus..." text. Make the RATIO field clean and uniform, and move
-- the bonus structure into the per-row NOTES (consistent + renders in the table):
--   - air-new-zealand: 200:1 (Airpoints are dollar-denominated) - kept.
--   - American (aa) / Delta / Avianca: flat 3:1, NO bonus (Marriott excludes them).
--   - United: enhanced bonus (10,000 per 60,000).
--   - everyone else: base 3:1 + 5,000-mile bonus per 60,000 (~2.4:1 in 60K chunks).
-- Verified via Marriott terms (Copilot + ChatGPT both confirmed the exclusions).
-- ============================================================================
update programs set
  transfer_partners_outbound = (
    select jsonb_agg(
      jsonb_build_object(
        'from_slug', p->>'from_slug',
        'ratio', case when p->>'from_slug' = 'air-new-zealand' then '200:1' else '3:1' end,
        'bonus_active', false,
        'notes', case
          when p->>'from_slug' in ('aa', 'delta', 'avianca')
            then 'Flat 3:1 - excluded from the 5,000-mile transfer bonus.'
          when p->>'from_slug' = 'united'
            then 'Base 3:1 with an enhanced 10,000-mile bonus per 60,000 points transferred.'
          when p->>'from_slug' = 'air-new-zealand'
            then 'Airpoints are dollar-denominated; transfers at 200:1, not a standard mile ratio.'
          else 'Base 3:1 with a 5,000-mile bonus per 60,000 points transferred (effectively ~2.4:1 in 60K increments).'
        end
      )
      order by p->>'from_slug'
    )
    from jsonb_array_elements(transfer_partners_outbound) p
  ),
  updated_at = now()
where slug = 'marriott-bonvoy';

-- verify: no ratio should be non-numeric now
select count(*) filter (where (p->>'ratio') !~ '\d+(\.\d+)?:\d+(\.\d+)?') as nonnumeric_ratios,
       count(*) as total
from programs, jsonb_array_elements(transfer_partners_outbound) p where slug = 'marriott-bonvoy';
