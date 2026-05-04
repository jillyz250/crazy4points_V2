-- Final Sonnet-suggested fixes for Marriott Bonvoy. Stops here regardless
-- of further audit findings - Sonnet self-iterates indefinitely on
-- transitional phrases ("flip side" -> "trade-off" -> "consequence" ->
-- "implication"...). Pinning the language at "consequence" which
-- accurately describes the relationship (dynamic pricing IS a consequence
-- of program management at Marriott's scale, not an exchange).
--
-- Also hedges the third-party cpp valuation with a Q1 2026 anchor.
update programs set
  intro = replace(intro,
    'The trade-off for that scale: Marriott killed the fixed-price award chart',
    'One consequence of that scale: Marriott killed the fixed-price award chart'),
  sweet_spots = replace(sweet_spots,
    'TPG''s mid-2026 valuation puts Bonvoy points around 0.7 cpp on average',
    'Third-party valuations (e.g. TPG) have pegged Bonvoy points around 0.7 cpp on average as of Q1 2026'),
  last_verified = now(),
  content_updated_at = now(),
  updated_at = now()
where slug = 'marriott-bonvoy';
