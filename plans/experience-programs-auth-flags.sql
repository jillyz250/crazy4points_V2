-- Correct the requires_cardholder_auth flag per program.
--
-- Default in the schema is true (assume login required). For programs whose
-- URL we pointed at a publicly-browsable page (no login wall), flip to false.
--
-- Programs where the URL is the actual public events portal (no login needed
-- to browse upcoming events):
--   - Citi Entertainment
--   - Capital One Entertainment
--   - Capital One Dining
--   - Capital One Lounges (the public locations page; specific booking via app)
--   - BoA Preferred Seating
--   - Alaska Mileage Plan Unlocked
--   - Marriott Bonvoy Moments (public browse, points to redeem)
--   - IHG One Rewards Experiences (public auction listings)
--   - Hilton Honors Experiences (public auction listings)
--   - Hyatt FIND (mostly public)
--
-- Programs where the URL is a preview/marketing page only (login required for
-- current event inventory and booking):
--   - Chase Experiences
--   - Sapphire Reserved
--   - United Card Events from Chase
--   - Southwest Rapid Rewards Access
--   - Amex Experiences (preview ok, booking requires login)
--   - Premium Events Collection (cardholder-only)
--   - Resy Global Dining Access (cardholder-only)
--   - U.S. Bank PGA Access

update experience_programs
   set requires_cardholder_auth = false
 where slug in (
   'citi-entertainment',
   'capital-one-entertainment',
   'capital-one-dining',
   'capital-one-lounges',
   'boa-preferred-seating',
   'alaska-mileage-plan-unlocked',
   'marriott-bonvoy-moments',
   'ihg-experiences',
   'hilton-honors-experiences',
   'hyatt-find-experiences'
 );

-- The remaining 8 stay at requires_cardholder_auth = true (schema default).
-- No-op for completeness — explicit set so audit query reflects intent.

update experience_programs
   set requires_cardholder_auth = true
 where slug in (
   'chase-experiences',
   'chase-sapphire-reserved',
   'united-card-events-chase',
   'southwest-rapid-rewards-access',
   'amex-experiences',
   'amex-by-invitation-only',
   'amex-resy-global-dining-access',
   'us-bank-pga-access'
 );
