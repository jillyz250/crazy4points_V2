-- Aeroplan post-publish fact-check patch (Copilot/ChatGPT round 2026-05-05).
--
-- Two ❌ INCORRECT findings + one ⚠️ NEEDS CLARIFICATION:
--
-- 1. ❌ "Partner award pricing is fixed by distance band (not a range)"
--    Correction: Aeroplan's partner chart uses BOTH region (Within North
--    America, North America to Atlantic, etc.) AND distance bands within
--    each region. The "fixed (not a range)" point still stands - cells are
--    a single point value, not a "starting from" range like Air Canada
--    metal - but the wording made it sound like it was distance-only.
--
-- 2. ⚠️ "5,000-15,000 points one-way" increase claim
--    Correction: some bands rose more than 15,000 points (up to ~20K on
--    ultra-long-haul first class). Reframe as a range that doesn't
--    suggest a hard ceiling.

update programs set
  intro = replace(replace(intro,
    'raising premium-cabin pricing across most transatlantic and transpacific bands by 5,000 to 15,000 points one-way - still competitive, but the cheapest-on-the-block reputation is no longer quite so cheap.',
    'raising premium-cabin pricing across most transatlantic and transpacific bands - some bands moved up by 5,000-15,000 points one-way, while a few first-class bands rose closer to 20,000 points. Still competitive overall, but the cheapest-on-the-block reputation is no longer quite so cheap.'
  ),
    'The Aeroplan award chart is distance-based for partner flights (with fixed values, not ranges), and dynamic for Air Canada-operated flights with a published "starting from" floor.',
    'The Aeroplan award chart for partner flights uses region pairs (e.g. North America to Atlantic) combined with distance bands within each region; each chart cell is a fixed point value rather than a range. Air Canada-operated flights use dynamic pricing with a published "starting from" floor that can rise based on demand.'
  ),
  award_chart = replace(award_chart,
    '- **Star Alliance partner flights** are priced from a **fixed distance-banded chart** (not a range). Same point cost for every route in the same distance band, same cabin.',
    '- **Star Alliance partner flights** are priced from a **fixed chart that combines region pairs (e.g. North America to Atlantic) with distance bands within each region**. Each chart cell is a single point value, not a "starting from" range. Same point cost for every route in the same region + distance band + cabin combination.'
  ),
  quirks = replace(quirks,
    '- **Partner award pricing is a fixed value, not a range** (unlike Air Canada-operated flights which use a "starting from" dynamic-pricing model).',
    '- **Partner award pricing is a fixed value per region + distance band cell** (unlike Air Canada-operated flights which use a "starting from" dynamic-pricing model). Aeroplan''s partner chart organizes routes by region pair first (e.g. North America to Atlantic), then by distance bands within that region.'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aeroplan';
