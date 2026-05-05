-- Brand-tier category + points estimate for Marriott Bonvoy properties.
--
-- BACKGROUND
-- Marriott eliminated public category visibility in 2022. The actual
-- per-property category data is not exposed on:
--   - Destination listing pages (we scrape these for property names/codes)
--   - Individual property pages on marriott.com (verified - no metadata)
--   - Any free third-party tracker (verified Frequent Miler, Sealthedeal,
--     Milesopedia, Awardtravelfinder, Flytrippers - all are blog articles
--     ABOUT categories, not structured property->category data)
--
-- The actual category data lives only behind Marriott's booking-flow API
-- which requires per-property date+room searches (~10K-50K credits to
-- extract for full inventory - way over our 800-credit budget).
--
-- DECISION ENGINE NEEDS
-- User explicitly requires redemption-rate display per property. Without
-- per-property category data, we provide a brand-tier-based estimate:
-- each Marriott brand clusters into a typical category band, so we can
-- give an honest "this brand's properties typically fall in Cat X-Y" range.
--
-- BRAND-TIER MAPPING (estimates based on observed industry distribution)
--
-- BUDGET (Cat 1-4 typical):
--   Fairfield, Aloft, Element, Four Points, Four Points Flex, AC Hotels,
--   Moxy, City Express, Protea Hotels, SpringHill Suites, TownePlace
--   Suites, Residence Inn, Apartments by Marriott Bonvoy
--   Range: 5K (Cat 1 off-peak) - 65K (Cat 4 peak)
--
-- MID (Cat 3-6 typical):
--   Courtyard, Sheraton, Westin, Renaissance, Delta Hotels, Le Meridien,
--   Tribute Portfolio, Design Hotels, Gaylord, Sheraton Grand
--   Range: 15K (Cat 3 off-peak) - 105K (Cat 6 peak)
--
-- PREMIUM (Cat 4-7 typical):
--   Marriott, JW Marriott, Autograph Collection, W Hotels, The Luxury
--   Collection, Marriott Vacation Club
--   Range: 22K (Cat 4 off-peak) - 125K (Cat 7 peak)
--
-- LUXURY (Cat 6-8 typical):
--   Ritz-Carlton, Ritz-Carlton Reserve, St. Regis, EDITION, Bvlgari
--   Range: 40K (Cat 6 off-peak) - 175K (Cat 8 peak)
--
-- Standard ("typical day") points use the middle category in each band.
--
-- DECISION ENGINE UI CONTRACT
-- Per the 2026-05-04 user feedback, redemption-rate display shows:
--   "Aloft Tokyo - estimated Cat 1-4 (5K-65K points/night)"
-- with an inline (i) tooltip:
--   "Estimated from Aloft brand category distribution. Marriott no
--    longer publishes static categories; confirm actual cost on
--    marriott.com before booking."
--
-- This migration runs AFTER scrape-properties.mjs has populated rows with
-- the brand field. Re-runnable - subsequent property scrapes just need
-- to re-run this UPDATE.

update hotel_properties set
  category = case
    when brand in ('Fairfield', 'Aloft', 'Element', 'Four Points', 'Four Points Flex', 'AC Hotels', 'Moxy', 'City Express', 'Protea Hotels', 'SpringHill Suites', 'TownePlace Suites', 'Residence Inn', 'Apartments by Marriott Bonvoy')
      then '1-4 (estimated)'
    when brand in ('Courtyard', 'Sheraton', 'Westin', 'Renaissance', 'Delta Hotels', 'Le Meridien', 'Tribute Portfolio', 'Design Hotels', 'Gaylord', 'Sheraton Grand')
      then '3-6 (estimated)'
    when brand in ('Marriott', 'JW Marriott', 'Autograph Collection', 'W Hotels', 'The Luxury Collection', 'Marriott Vacation Club')
      then '4-7 (estimated)'
    when brand in ('Ritz-Carlton', 'Ritz-Carlton Reserve', 'St. Regis', 'EDITION', 'Bvlgari')
      then '6-8 (estimated)'
    else null
  end,
  off_peak_points = case
    when brand in ('Fairfield', 'Aloft', 'Element', 'Four Points', 'Four Points Flex', 'AC Hotels', 'Moxy', 'City Express', 'Protea Hotels', 'SpringHill Suites', 'TownePlace Suites', 'Residence Inn', 'Apartments by Marriott Bonvoy')
      then 5000
    when brand in ('Courtyard', 'Sheraton', 'Westin', 'Renaissance', 'Delta Hotels', 'Le Meridien', 'Tribute Portfolio', 'Design Hotels', 'Gaylord', 'Sheraton Grand')
      then 15000
    when brand in ('Marriott', 'JW Marriott', 'Autograph Collection', 'W Hotels', 'The Luxury Collection', 'Marriott Vacation Club')
      then 22000
    when brand in ('Ritz-Carlton', 'Ritz-Carlton Reserve', 'St. Regis', 'EDITION', 'Bvlgari')
      then 40000
    else null
  end,
  standard_points = case
    when brand in ('Fairfield', 'Aloft', 'Element', 'Four Points', 'Four Points Flex', 'AC Hotels', 'Moxy', 'City Express', 'Protea Hotels', 'SpringHill Suites', 'TownePlace Suites', 'Residence Inn', 'Apartments by Marriott Bonvoy')
      then 28000
    when brand in ('Courtyard', 'Sheraton', 'Westin', 'Renaissance', 'Delta Hotels', 'Le Meridien', 'Tribute Portfolio', 'Design Hotels', 'Gaylord', 'Sheraton Grand')
      then 55000
    when brand in ('Marriott', 'JW Marriott', 'Autograph Collection', 'W Hotels', 'The Luxury Collection', 'Marriott Vacation Club')
      then 76000
    when brand in ('Ritz-Carlton', 'Ritz-Carlton Reserve', 'St. Regis', 'EDITION', 'Bvlgari')
      then 105000
    else null
  end,
  peak_points = case
    when brand in ('Fairfield', 'Aloft', 'Element', 'Four Points', 'Four Points Flex', 'AC Hotels', 'Moxy', 'City Express', 'Protea Hotels', 'SpringHill Suites', 'TownePlace Suites', 'Residence Inn', 'Apartments by Marriott Bonvoy')
      then 65000
    when brand in ('Courtyard', 'Sheraton', 'Westin', 'Renaissance', 'Delta Hotels', 'Le Meridien', 'Tribute Portfolio', 'Design Hotels', 'Gaylord', 'Sheraton Grand')
      then 105000
    when brand in ('Marriott', 'JW Marriott', 'Autograph Collection', 'W Hotels', 'The Luxury Collection', 'Marriott Vacation Club')
      then 125000
    when brand in ('Ritz-Carlton', 'Ritz-Carlton Reserve', 'St. Regis', 'EDITION', 'Bvlgari')
      then 175000
    else null
  end,
  notes = case
    when brand is not null and notes is null then 'Brand-tier estimate: ' || brand || ' typically falls in this category band. Marriott does not publish static categories; verify nightly cost on marriott.com before booking.'
    when brand is not null then notes
    else notes
  end,
  last_verified = current_date,
  updated_at = now()
where program_id = (select id from programs where slug = 'marriott-bonvoy');
