-- Hedge Laurel Lounge access in Diamond tier_benefits and lounge_access.
-- The official benefits table has two separate rows:
--   "Access to VIP Laurel Lounge" -- 4 bullets
--   "Complimentary access to VIP Laurel Lounge" -- 3 bullets
-- Column mapping is ambiguous from the scrape; exact tier cutoff for complimentary
-- vs. paid access (Platinum paid? Diamond paid? Diamond Plus complimentary?)
-- is not definitively resolvable without rendering the full HTML table.
-- Hedging with verify link rather than committing to either wrong answer.

update programs set
  tier_benefits = replace(
    tier_benefits::text,
    'Complimentary access to VIP Laurel Lounge where available',
    'Access to VIP Laurel Lounge where available (complimentary access begins at Diamond or Diamond Plus -- verify exact tier cutoff at caesars.com/myrewards/benefits-overview)'
  )::jsonb,
  lounge_access = replace(
    lounge_access,
    'complimentary access is confirmed for Diamond-tier members and above. The official benefits overview at caesars.com/myrewards/benefits-overview has the full tier-by-tier lounge access matrix.',
    'complimentary access begins at Diamond or Diamond Plus -- verify exact tier cutoff at caesars.com/myrewards/benefits-overview, which has the full paid-vs-complimentary breakdown per tier.'
  ),
  updated_at = now()
where slug = 'caesars';
