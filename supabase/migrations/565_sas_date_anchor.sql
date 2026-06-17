-- Anchor the transfer-access point-in-time claims to "June 2026" per LLM audit.
update programs set
  intro = replace(intro,
    'The headline change US travelers must know', 'The headline change US travelers must know'),
  updated_at = now()
where slug = 'sas';

update programs set
  intro = replace(intro,
    'as of 2026 no major US bank currency transfers to EuroBonus',
    'as of June 2026 no major US bank currency transfers to EuroBonus'),
  quirks = replace(quirks,
    'The US transfer route as of 2026 is Rove Miles at 1:1; the major US bank programs do not transfer.',
    'The US transfer route as of June 2026 is Rove Miles at 1:1; the major US bank programs do not transfer.'),
  award_chart = replace(award_chart,
    'The US transfer route as of 2026 is Rove Miles at 1:1; European SAS co-brand Amex cards earn EuroBonus directly.',
    'The US transfer route as of June 2026 is Rove Miles at 1:1; European SAS co-brand Amex cards earn EuroBonus directly.'),
  updated_at = now()
where slug = 'sas';
