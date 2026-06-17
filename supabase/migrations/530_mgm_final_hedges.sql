-- Final two MEDIUM hedges: intro no-transfer claim + sweet_spots cash-back comparison.

update programs set
  intro = replace(
    intro,
    'No airline transfers, no award chart to game, no off-peak categories -- just flat cash-equivalent value.',
    'No airline transfers, no award chart to game, no off-peak categories under current program terms -- just flat cash-equivalent value.'
  ),
  sweet_spots = replace(
    sweet_spots,
    'The value is entirely in status benefits -- redemption math does not, under current program terms, beat a solid cash-back card.',
    'The value is primarily in status benefits -- flat 1-cent redemptions mean point-based redemption math typically favors cash-back alternatives under current program terms.'
  ),
  updated_at = now()
where slug = 'mgm';
