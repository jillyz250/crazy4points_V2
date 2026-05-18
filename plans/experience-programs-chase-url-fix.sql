-- Fix Chase Experiences URL — the experiences.chase.com subdomain redirects
-- to a Chase login wall. The /personal/events/experiences page is the
-- public-facing marketing/overview version that doesn't require login.
--
-- Trade-off: the public page is an overview/preview layer, not the actual
-- event browser. But anything that requires login is unusable for a public
-- card-reference site visitor who doesn't yet have a Chase card.
--
-- Verified 2026-05-18.

update experience_programs
   set official_url = 'https://www.chase.com/personal/events/experiences',
       description = 'Chase''s cardmember-exclusive events portal - dining series, chef collaborations, concerts, sports, cultural events. The public preview page is linked here; full event browsing + booking requires Chase login.',
       last_verified = current_date
 where slug = 'chase-experiences';

-- Sapphire Reserved coverage lives within the same Chase events page until
-- we identify a dedicated Sapphire-specific public URL. Same login caveat.
update experience_programs
   set official_url = 'https://www.chase.com/personal/events/experiences',
       description = 'Sapphire-exclusive VIP access program: presales, festival lounges, dining series, curated weekends. Available to Chase Sapphire Preferred and Sapphire Reserve cardholders only. The Chase events page (linked) covers Sapphire perks; full booking requires Chase login.',
       last_verified = current_date
 where slug = 'chase-sapphire-reserved';
