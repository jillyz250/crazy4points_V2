update programs set
  intro = replace(intro,
    'No US bank currency transfers to SUMA: Air Europa is an American Express transfer partner only for Spanish-issued Amex cards, and Chase, Citi, Capital One, Bilt, and Wells Fargo do not transfer to it at all.',
    'As of June 2026, no US bank currency transfers to SUMA: Air Europa is an American Express transfer partner only for Spanish-issued Amex cards, and Chase, Citi, Capital One, Bilt, and Wells Fargo do not currently transfer to it.'),
  quirks = replace(quirks,
    '**No US bank transfer access**: US American Express, Chase, Citi, Capital One, Bilt, and Wells Fargo do not transfer to SUMA.',
    '**No US bank transfer access**: As of June 2026, US American Express, Chase, Citi, Capital One, Bilt, and Wells Fargo do not transfer to SUMA.'),
  updated_at = now()
where slug = 'air-europa';
