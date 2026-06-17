update programs set
  intro = replace(intro,
    'as of June 2026 no major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt).',
    'as of June 2026, no major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt).'),
  quirks = replace(quirks,
    'No Amex US, Chase, Citi, Capital One, or Bilt transfers to EuroBonus. The US transfer route as of June 2026 is Rove Miles at 1:1; the major US bank programs do not transfer.',
    'No Amex US, Chase, Citi, Capital One, or Bilt transfers to EuroBonus as of June 2026. The current US transfer route is Rove Miles at 1:1.'),
  award_chart = replace(award_chart,
    'No major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt). The US transfer route as of June 2026 is Rove Miles at 1:1;',
    'No major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt) as of June 2026. The current US transfer route is Rove Miles at 1:1;'),
  updated_at = now()
where slug = 'sas';
