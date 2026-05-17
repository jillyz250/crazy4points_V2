-- Fix Amex experience program URLs that returned the "site help / technical
-- difficulties" page. Amex rebranded "By Invitation Only" to "Premium Events
-- Collection" and moved the entertainment hub to /en-us/benefits/entertainment/.
--
-- Verified 2026-05-18 via search results citing Amex's own current URLs.

-- 1. Amex Experiences (main entertainment hub)
update experience_programs
   set official_url = 'https://www.americanexpress.com/en-us/benefits/entertainment/',
       last_verified = current_date
 where slug = 'amex-experiences';

-- 2. By Invitation Only -> Premium Events Collection (renamed + URL changed)
update experience_programs
   set name = 'Premium Events Collection (formerly By Invitation Only)',
       official_url = 'https://www.americanexpress.com/en-us/benefits/entertainment/premium-events-collection/',
       description = 'Amex ultra-premium curated events portal: exclusive sports, fashion, cultural, and travel events. Available to Platinum, Business Platinum, and Centurion cardholders only. (Previously branded as By Invitation Only.)',
       last_verified = current_date
 where slug = 'amex-by-invitation-only';

-- 3. Resy URL stays the same: https://www.resy.com/amex (verified working)
update experience_programs
   set last_verified = current_date
 where slug = 'amex-resy-global-dining-access';
