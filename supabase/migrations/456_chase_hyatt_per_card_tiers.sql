-- Chase UR -> World of Hyatt is now CARD-SPECIFIC (2026): Sapphire Reserve keeps 1:1;
-- Sapphire Preferred + Ink Business Preferred drop to 4:3 (1,000 UR = 750 Hyatt),
-- effective immediately for new applicants (2026-06-15) and 2026-10-01 for existing
-- holders. Reserve spared. Uses the existing (previously unpopulated) `tiers[]`
-- mechanism on programs.transfer_partners_outbound - no schema change.
--
-- Only the 3 transferable Chase cards render the ratio table per-card (Reserve,
-- Preferred, Ink Preferred); pool-to-unlock cards show a sibling-unlock path instead,
-- so all rendering cards are enumerated below and none fall back to "Not eligible".
-- The base `ratio` stays "1:1" as a fallback; when `tiers` is present the renderer
-- ignores it (card page picks the matching tier; program page stacks both). ASCII-only.

update programs p set transfer_partners_outbound = (
  select jsonb_agg(
    case when e->>'from_slug' = 'hyatt'
      then e || jsonb_build_object(
        'ratio', '1:1',
        'notes', 'World of Hyatt transfers are card-specific as of 2026: Sapphire Reserve keeps 1:1 (1,000 UR = 1,000 Hyatt); Sapphire Preferred and Ink Business Preferred transfer at 4:3 (1,000 UR = 750 Hyatt). The 4:3 cut applies immediately to new applicants (2026-06-15) and from 2026-10-01 for existing cardholders. Cash-earner Chase cards (Freedom, Ink Cash/Unlimited) reach Hyatt by pooling into a premium card first.',
        'tiers', jsonb_build_array(
          jsonb_build_object('tier','reserve','ratio','1:1','eligible_card_slugs', jsonb_build_array('chase-sapphire-reserve')),
          jsonb_build_object('tier','preferred','ratio','4:3','eligible_card_slugs', jsonb_build_array('chase-sapphire-preferred','chase-ink-business-preferred'))
        )
      )
      else e end
    order by ord
  )
  from jsonb_array_elements(p.transfer_partners_outbound) with ordinality as t(e, ord)
)
where p.slug = 'chase';
