-- Final consistency anchor: time-anchor the Citi ratio in quirks to match intro. ASCII-only.
update programs set
  quirks = replace(quirks,
    'the ratio is unfavorable (premium Citi cards: 1,000 ThankYou = 200 points; no-annual-fee Citi cards earn less)',
    'the ratio is unfavorable (as of mid-2026, premium Citi cards: 1,000 ThankYou = 200 points; no-annual-fee Citi cards earn less)'),
  updated_at = now()
where slug = 'leading-hotels';
