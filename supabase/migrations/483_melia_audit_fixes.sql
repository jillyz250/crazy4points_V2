-- Clear 3 audit-program.mjs findings on Melia Rewards page:
-- 1x absolute_best: "the best positions" -> "strong positions"
-- 2x absolute_always: "Always search" -> "Search" (instruction, not an assertion)

update programs set
  intro = replace(intro,
    'Melia Hotels often occupy the best positions in those markets,',
    'Melia Hotels often occupy strong positions in those markets,'),
  quirks = replace(quirks,
    'Always search melia.com with your specific dates to see the actual award cost before planning around a specific point range.',
    'Search melia.com with your specific dates to see the actual award cost before planning around a specific point range.'),
  award_chart = replace(award_chart,
    'Always search melia.com with your specific travel dates to see the actual award cost.',
    'Search melia.com with your specific travel dates to see the actual award cost.'),
  updated_at = now()
where slug = 'melia';
