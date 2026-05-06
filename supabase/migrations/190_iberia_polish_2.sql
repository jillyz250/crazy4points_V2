-- Iberia final polish - hedge "across the board" + "instantly".
update programs set
  award_chart = replace(award_chart,
    'Iberia keeps surcharges low across the board - typically **€30-€80 per one-way to the US**',
    'Iberia generally keeps surcharges low - typically **€30-€80 per one-way to the US** as of mid-2026'
  ),
  quirks = replace(quirks,
    'Combine My Avios lets you transfer Avios 1:1 instantly between Club Iberia Plus, BA Club, AerClub, Vueling Club, Loganair,',
    'Combine My Avios lets you transfer Avios 1:1 between Club Iberia Plus, BA Club, AerClub, Vueling Club, Loganair (typically near-instant in-family),'
  ),
  updated_at = now()
where slug = 'iberia';
