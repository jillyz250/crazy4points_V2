-- Scrub specific third-party publication names from program pages.
--
-- Per user feedback 2026-05-05: don't reference specific blogs/publications
-- by name (TPG, Frequent Miler, OMAAT, Thrifty Traveler, Upgraded Points,
-- AwardWallet, NerdWallet) in user-facing program content. Generic phrasing
-- like "third-party trackers" is fine; named-source attribution belongs in
-- plans/sources/<slug>.md, not on the public page.
--
-- Affected programs: marriott-bonvoy, frontier, jetblue, southwest, sun-country.

update programs set
  sweet_spots = replace(sweet_spots,
    'Third-party valuations (e.g. TPG) have pegged Bonvoy points',
    'Third-party valuations have pegged Bonvoy points'
  ),
  award_chart = replace(award_chart,
    'Observed point ranges per category (third-party - Frequent Miler empirical observations as of early 2026, NOT Marriott-published):',
    'Observed point ranges per category (third-party empirical observations as of early 2026, NOT Marriott-published):'
  ),
  updated_at = now()
where slug = 'marriott-bonvoy';

update programs set
  award_chart = replace(award_chart,
    'Average mile value sat around 1.0-1.1 cpp per third-party trackers (e.g., TPG mid-2026 valuations);',
    'Average mile value sat around 1.0-1.1 cpp per third-party trackers (mid-2026 valuations);'
  ),
  updated_at = now()
where slug = 'frontier';

update programs set
  award_chart = replace(award_chart,
    'TPG''s recent 2026 valuation pegs TrueBlue at 1.35 cpp.',
    'Recent third-party 2026 valuations peg TrueBlue around 1.35 cpp.'
  ),
  updated_at = now()
where slug = 'jetblue';

update programs set
  intro = replace(intro,
    'Most redemptions yield ~1.3 cents per point per TPG''s May 2026 valuation',
    'Most redemptions yield ~1.3 cents per point per third-party May 2026 valuations'
  ),
  award_chart = replace(award_chart,
    'Expect 1.3 cents per point on average per TPG May 2026 valuation',
    'Expect 1.3 cents per point on average per third-party May 2026 valuations'
  ),
  updated_at = now()
where slug = 'southwest';

update programs set
  quirks = replace(quirks,
    'Public reporting (Thrifty Traveler, The Points Guy) suggested',
    'Public reporting suggested'
  ),
  updated_at = now()
where slug = 'sun-country';
