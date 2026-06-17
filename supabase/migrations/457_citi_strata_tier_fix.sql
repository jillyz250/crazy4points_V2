-- BUG FIX: the no-annual-fee "Citi Strata Card" (slug citi-strata) is flagged
-- points_transferable_to_partners=true, so its card page renders the transfer table
-- per-card - but it was MISSING from every tier's eligible_card_slugs, so all 38
-- partners showed "Not eligible". Per multiple 2026 sources (AwardWallet, UpgradedPoints,
-- NerdWallet), the no-AF Citi Strata transfers to partners at the reduced no-AF ratio
-- (1:0.7 for airlines), same as its no-AF peers (Double Cash / Custom Cash / Rewards+).
--
-- Fix: add 'citi-strata' to the same tier that already lists 'citi-double-cash' (the
-- "standard" no-AF tier) on every Citi partner that has one. Strata stays correctly
-- "Not eligible" for any premium-only partner with no standard tier. ASCII-only.

update programs p set transfer_partners_outbound = (
  select jsonb_agg(
    case when e ? 'tiers'
      then jsonb_set(e, '{tiers}', (
        select jsonb_agg(
          case when (t->'eligible_card_slugs') @> '"citi-double-cash"'::jsonb
                and not (t->'eligible_card_slugs') @> '"citi-strata"'::jsonb
            then jsonb_set(t, '{eligible_card_slugs}', (t->'eligible_card_slugs') || '["citi-strata"]'::jsonb)
            else t end
          order by ord2
        )
        from jsonb_array_elements(e->'tiers') with ordinality as tt(t, ord2)
      ))
      else e end
    order by ord
  )
  from jsonb_array_elements(p.transfer_partners_outbound) with ordinality as ee(e, ord)
)
where p.slug = 'citi';
