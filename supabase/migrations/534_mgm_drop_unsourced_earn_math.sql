-- Drop unsourced earn-rate math from sweet_spots.
-- The "~4 TCs per $1" base rate came from a single WebSearch summary blurb (not an
-- official MGM page), and the derived "$18,750 to hit Gold" figure was manufactured
-- precision off that thin input. mgmresorts.com is Firecrawl-blocked so the base TC
-- earn rate cannot be confirmed. Replacing with a qualitative statement.

update programs set
  sweet_spots = replace(
    sweet_spots,
    'Members earn an estimated 4 TCs per $1 on hotel stays and dining, meaning roughly $18,750 in on-property spend to hit Gold organically. The MGM Rewards Iconic Mastercard (6x TCs at MGM) shortens that path considerably.',
    'Reaching Gold takes substantial on-property spend or play -- the exact Tier Credit earn rate on stays and dining is not published on MGM''s public pages (verify at mgmresorts.com/en/loyalty.html). The MGM Rewards Iconic Mastercard, which earns 6 Tier Credits per $1 at MGM properties, is the fastest documented path to building Tier Credits.'
  ),
  updated_at = now()
where slug = 'mgm';
