-- Clear 6 audit-program.mjs findings on GHA Discovery page:
-- 4x absolute_always: "always" -> fixed phrasing
-- 2x absolute_best: "the best available rate" -> "the published direct rate"

update programs set
  intro = replace(intro,
    'where D$1 = USD 1, always.',
    'where D$1 = USD 1 (fixed value per program terms).'),
  how_to_spend = replace(
    replace(how_to_spend,
      'the soonest-expiring balance is always used first.',
      'the soonest-expiring balance is applied first.'),
    'off the best available rate on direct channels',
    'off the published direct rate on direct channels'),
  sweet_spots = replace(
    replace(sweet_spots,
      'Since D$1 always redeems at USD 1 of hotel spend',
      'Since D$1 redeems at USD 1 of hotel spend'),
    '5-10% off the best available rate. Earn D$',
    '5-10% off the published direct rate. Earn D$'),
  quirks = replace(quirks,
    '**D$1 = USD 1, always.**',
    '**D$1 = USD 1 (fixed value).**'),
  updated_at = now()
where slug = 'gha-discovery';
