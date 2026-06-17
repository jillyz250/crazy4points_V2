update programs set
  intro = replace(intro,
    'every major US transferable currency except Chase',
    'five of the six major US transferable currencies (only Chase is absent)'),
  quirks = replace(quirks,
    '**The most US-accessible program in the airline set**: SUMA Miles transfer in at 1:1 from Amex, Capital One, Bilt, Citi, and Wells Fargo -- only Chase is absent. This is what sets Air Europa apart from SAS, China Eastern, and most other non-US SkyTeam programs.',
    '**Unusually broad US transferability**: SUMA Miles transfer in at 1:1 from Amex, Capital One, Bilt, Citi, and Wells Fargo -- five of the six major US currencies, with only Chase absent. That sets Air Europa apart from SAS, China Eastern, and most other non-US SkyTeam programs.'),
  updated_at = now()
where slug = 'air-europa';
