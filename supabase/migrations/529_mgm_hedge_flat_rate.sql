-- Hedge flat 1-cent-per-point claim in intro and award_chart per LLM audit.

update programs set
  intro = replace(
    intro,
    'Each MGM Rewards point is worth exactly 1 cent toward hotel charges, dining, and entertainment on property.',
    'Each MGM Rewards point is worth 1 cent toward hotel charges, dining, and entertainment on property under current program terms.'
  ),
  award_chart = replace(
    award_chart,
    'Points redeem at a flat 1 cent per point toward any eligible charge at MGM Resorts properties -- no categories, no peak pricing, no partner booking tiers.',
    'Points redeem at a flat 1 cent per point under current program terms toward eligible charges at MGM Resorts properties -- no categories, no peak pricing, no partner booking tiers as of June 2026.'
  ),
  updated_at = now()
where slug = 'mgm';
