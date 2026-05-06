-- Sonnet HIGH-only audit sweep across 20 previously-authored programs (2026-05-07).
--
-- 7 HIGH findings; 2 false positives (Sonnet flagged "no match in source"), 5 are
-- clean unhedged-absolute / stale-date issues fixed below. None were page-internal
-- contradictions, so per the Sonnet contradiction protocol nothing surfaces to user.
--
-- Programs touched: united, allegiant, hyatt.

-- united: hedge "one of the few non-elite paths" claim about Lufthansa First access
update programs set
  sweet_spots = replace(sweet_spots,
    'MileagePlus is one of the few non-elite paths.',
    'MileagePlus has historically been one of the few non-elite paths - verify current partner availability before booking.'
  ),
  updated_at = now()
where slug = 'united';

-- allegiant: hedge unhedged consequence of still-pending Sun Country acquisition
update programs set
  intro = replace(intro,
    'is acquiring Sun Country with a deal expected to close around May 13, 2026, which would significantly expand the leisure-focused footprint of both carriers',
    'is acquiring Sun Country with a deal expected to close around May 13, 2026, which could significantly expand the leisure-focused footprint of both carriers if the deal closes as anticipated'
  ),
  updated_at = now()
where slug = 'allegiant';

-- allegiant: flag Spirit-relief offer as expiring imminently (May 12, 2026)
update programs set
  sweet_spots = replace(sweet_spots,
    'Spirit closure relief offer (expires May 12, 2026)** - through May 12, 2026, Allegiant is rebating 50% of points spent on rebooked Spirit-passenger itineraries. If you had a Spirit ticket and need to rebook before that deadline, this rebate meaningfully boosts the value of your points on that booking.',
    'Spirit closure relief offer (expires May 12, 2026 - verify before booking)** - through May 12, 2026, Allegiant is rebating 50% of points spent on rebooked Spirit-passenger itineraries. This offer expires very soon; if you had a Spirit ticket and can rebook before that deadline, this rebate meaningfully boosts the value of your points on that booking. Verify availability before acting.'
  ),
  quirks = replace(quirks,
    'Spirit Airlines closure relief offer** through May 12, 2026: 50% Allways points rebate on rebooked Spirit-passenger itineraries.',
    'Spirit Airlines closure relief offer (expires May 12, 2026 - verify before booking)** through May 12, 2026: 50% Allways points rebate on rebooked Spirit-passenger itineraries.'
  ),
  updated_at = now()
where slug = 'allegiant';

-- hyatt: hedge Globalist "guaranteed availability with 72-hour advance booking"
-- (Hyatt's own T&C qualifies this as subject to program terms + property participation)
update programs set
  tier_benefits = replace(tier_benefits::text,
    'Guaranteed availability with 72-hour advance booking',
    'Guaranteed availability with 72-hour advance booking (subject to program terms and property participation)'
  )::jsonb,
  updated_at = now()
where slug = 'hyatt';
