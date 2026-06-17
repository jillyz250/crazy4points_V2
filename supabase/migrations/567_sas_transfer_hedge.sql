update programs set
  intro = replace(intro,
    'as of June 2026, no major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt). US transfer access runs through the niche Rove Miles program at 1:1, and not from the major US bank currencies.',
    'as of June 2026, no major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt) -- though transfer partnerships can shift. US transfer access currently runs through the niche Rove Miles program at 1:1.'),
  quirks = replace(quirks,
    'No Amex US, Chase, Citi, Capital One, or Bilt transfers to EuroBonus as of June 2026. The current US transfer route is Rove Miles at 1:1.',
    'No Amex US, Chase, Citi, Capital One, or Bilt transfers to EuroBonus as of June 2026 -- though transfer partnerships can shift. The current US transfer route is Rove Miles at 1:1.'),
  award_chart = replace(award_chart,
    'No major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt) as of June 2026. The current US transfer route is Rove Miles at 1:1;',
    'No major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt) as of June 2026 -- though transfer partnerships can shift. The current US transfer route is Rove Miles at 1:1;'),
  updated_at = now()
where slug = 'sas';
