-- Break LLM cycling: remove over-hedged intro/award_chart phrases + fix sweet_spots superlative.
-- The flat 1-cent redemption rate is a current observable fact, not speculative;
-- hedging it with "under current program terms" reads as false uncertainty.

update programs set
  intro = replace(
    intro,
    'No airline transfers, no award chart to game, no off-peak categories under current program terms -- just flat cash-equivalent value.',
    'No airline transfers, no award chart to game, no off-peak categories -- just flat cash-equivalent value.'
  ),
  sweet_spots = replace(
    sweet_spots,
    'Combined with MGM Gold resort fee waivers, this is the most useful dual-program unlock on the casino loyalty map.',
    'Combined with MGM Gold resort fee waivers, this is a strong dual-program unlock for Las Vegas travelers.'
  ),
  award_chart = replace(
    award_chart,
    'Points redeem at a flat 1 cent per point under current program terms toward eligible charges at MGM Resorts properties -- no categories, no peak pricing, no partner booking tiers.',
    'Points redeem at a flat 1 cent per point toward eligible charges at MGM Resorts properties -- no categories, no peak pricing, no partner booking tiers.'
  ),
  updated_at = now()
where slug = 'mgm';
