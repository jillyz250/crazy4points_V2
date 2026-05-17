-- Fix Resy URL — /amex was a guess; the real cardholder-facing portal is the
-- Resy Global Dining Access directory of participating restaurants.
-- Verified 2026-05-18.

update experience_programs
   set official_url = 'https://resy.com/global-dining-access/directory',
       last_verified = current_date
 where slug = 'amex-resy-global-dining-access';
