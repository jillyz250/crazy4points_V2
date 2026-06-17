update programs set
  intro = replace(intro,
    'and you can always buy SUMA Miles outright (often with a bonus) if you have a specific redemption in mind.',
    'and you can also buy SUMA Miles outright (often with a bonus) if you have a specific redemption in mind.'),
  updated_at = now()
where slug = 'air-europa';
