-- KrisFlyer Sonnet audit polish (3 HIGH findings).
-- HIGH 1: "most exclusive premium cabin in the sky" - unhedged superlative.
-- HIGH 2: "unlike Aeroplan partner awards" - stale comparative; soften.
-- HIGH 3: "the only US carrier" - factually wrong. Singapore is a
--         Singaporean carrier. Reframe.

update programs set
  intro = replace(intro,
    'anchored by the Suites Class product on the A380 - the most exclusive premium cabin in the sky and one that no partner program can book.',
    'anchored by the Suites Class product on the A380 - widely regarded as one of the most exclusive premium cabins in the sky and one that no partner program can book.'
  ),
  how_to_spend = replace(how_to_spend,
    'partner awards through KrisFlyer DO incur partner-imposed fuel surcharges (Lufthansa, Swiss, etc.), unlike Aeroplan partner awards.',
    'partner awards through KrisFlyer DO incur partner-imposed fuel surcharges (Lufthansa, Swiss, etc.). Aeroplan has historically passed through fewer partner surcharges on the same flights, making it worth comparing before booking.'
  ),
  sweet_spots = replace(sweet_spots,
    'the only US carrier with a meaningful spend-only path to top-tier status that includes guaranteed Business class redemption seats. Requires SGD 50,000 in PPS Value annually (Business/Suites/Premium First fares only).',
    'one of the few programs accessible to US-based travelers (via flexible-currency transfer) that offers a meaningful spend-only path to top-tier status, including guaranteed Business class redemption seats. Requires SGD 50,000 in PPS Value annually (Business/Suites/Premium First fares only).'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'krisflyer';
