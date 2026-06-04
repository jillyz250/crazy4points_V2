-- ============================================================================
-- 374 - Marriott outbound: 3 zero-doubt removals (hotel-ratio audit, 2026-06-04).
--   - jetsmart: not a Marriott partner; carried a garbage "3:1.1" ratio.
--   - alaska + hawaiian: both merged into Atmos Rewards (2025); `atmos` is
--     already in the roster at 3:1, so these were triple-listing one program.
-- The riskier ghost removals (korean-air/eva-air/china-airlines/garuda/flydubai)
-- and adds (china-southern/hainan) are held for a Copilot/ChatGPT cross-check
-- first - destructive + third-party-sourced (official Marriott page was 403).
-- ============================================================================
update programs set
  transfer_partners_outbound = (
    select coalesce(jsonb_agg(p), '[]'::jsonb)
    from jsonb_array_elements(transfer_partners_outbound) p
    where p->>'from_slug' not in ('jetsmart', 'alaska', 'hawaiian')
  ),
  updated_at = now()
where slug = 'marriott-bonvoy';

select jsonb_array_length(transfer_partners_outbound) as marriott_outbound_after
from programs where slug = 'marriott-bonvoy';
