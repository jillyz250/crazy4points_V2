-- Fix LLM-audit findings (round 9):
-- 1. tier_benefits (HIGH): Remove Laurel Lounge from Platinum bullet (contradicts lounge_access Diamond+).
-- 2. lounge_access: Clarify Diamond+ complimentary access and link to official benefits page.
-- 3. quirks: Capitalize "Tier Score" in sportsbook TC bullet heading.

update programs set
  tier_benefits = replace(tier_benefits::text,
    '"Access to VIP Laurel Lounge where available (verify fee vs complimentary status at caesars.com/myrewards/benefits-overview)",',
    '')::jsonb,

  lounge_access = replace(lounge_access,
    'Caesars Rewards operates Laurel Lounges at select properties and Seven Stars Lounges at certain flagship destinations.

**Laurel Lounges** are available to Diamond members and above at properties where they exist. Access may be complimentary at Diamond and above (per the official benefits table at caesars.com/myrewards/benefits-overview); verify current lounge availability at your destination before your trip, as not all Caesars properties have a Laurel Lounge.',
    'Caesars Rewards operates Laurel Lounges at select properties and Seven Stars Lounges at certain flagship destinations.

**Laurel Lounges** are available to Diamond members and above at properties where they exist; complimentary access is confirmed for Diamond-tier members and above. The official benefits overview at caesars.com/myrewards/benefits-overview has the full tier-by-tier lounge access matrix. Not all Caesars properties have a Laurel Lounge -- verify availability at your destination before your trip.'),

  quirks = replace(quirks,
    E'- **Sportsbook TCs earn toward your annual Tier Score.** Online sports betting',
    E'- **Sportsbook TCs count toward Tier Score (with limits).** Online sports betting'),

  updated_at = now()
where slug = 'caesars';
