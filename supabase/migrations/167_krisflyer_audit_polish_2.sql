-- KrisFlyer audit polish round 2 - hedge "no partner program" absolutes.
-- Sonnet flagged the Suites-only-KrisFlyer claim as too absolute. The
-- claim is true today but the policy could change. Reframe with "currently"
-- to keep the page accurate without committing to a future-proof absolute.

update programs set
  intro = replace(intro,
    'and one that no partner program can book.',
    'and one that no partner program currently can book.'
  ),
  how_to_spend = replace(how_to_spend,
    'No Star Alliance partner (United, Aeroplan, ANA, Avianca LifeMiles) can book Suites. KrisFlyer is the only currency that opens this cabin.',
    'No Star Alliance partner (United, Aeroplan, ANA, Avianca LifeMiles) currently can book Suites - KrisFlyer is the only currency that opens this cabin as of May 2026.'
  ),
  quirks = replace(quirks,
    'However, you can designate up to **5 Redemption Nominees** and book award tickets for them with your miles.',
    'That said, you can designate up to **5 Redemption Nominees** and book award tickets for them with your miles.'
  ),
  award_chart = replace(award_chart,
    'No partner program (United, Aeroplan, Avianca LifeMiles, ANA Mileage Club) can book the Suites cabin.',
    'No partner program (United, Aeroplan, Avianca LifeMiles, ANA Mileage Club) currently can book the Suites cabin.'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'krisflyer';
