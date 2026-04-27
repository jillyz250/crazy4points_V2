-- Hyatt 2026 annual category review — pending changes effective 2026-05-20.
--
-- 136 World of Hyatt properties are changing category on May 20, 2026, per
-- World of Hyatt's annual review (members notified by email Apr 24, 2026;
-- public source: AwardWallet article "World of Hyatt Category Changes for
-- 2026" — https://awardwallet.com/blog/2026-world-hyatt-category-changes/).
--
-- This migration writes the *pending* category transition into hotel_properties
-- using the columns added in 042_hotel_properties_category_transition.sql
-- (category_next + category_changes_at). The existing `category` column keeps
-- reflecting the CURRENT category until 2026-05-20.
--
-- For rows that already exist (matched by lower(name) per the existing unique
-- index), we update category, category_next, category_changes_at only. Other
-- fields (city, brand, hotel_url, all_inclusive, notes, last_verified) are
-- preserved. For unmatched names, we insert new rows with minimal data.
--
-- Post-2026-05-20 cleanup will be a separate migration that copies category_next
-- → category and clears the transition columns.

with hyatt as (select id from programs where slug = 'hyatt' limit 1),
changes (name, region, current_cat, next_cat) as (values
  -- United States (72)
  ('Hyatt House Anchorage',                              'americas',           '3', '4'),
  ('Hyatt Place Tucson-Central',                         'americas',           '1', '2'),
  ('Hyatt Centric Delfina Santa Monica',                 'americas',           '6', '5'),
  ('Andaz West Hollywood',                               'americas',           '6', '5'),
  ('Hotel Figueroa',                                     'americas',           '4', '5'),
  ('Hyatt Place Santa Barbara',                          'americas',           '6', '5'),
  ('The Laurel Inn',                                     'americas',           '5', '6'),
  ('Hyatt Place Santa Cruz',                             'americas',           '4', '5'),
  ('Hyatt Centric Downtown Denver',                      'americas',           '4', '3'),
  ('Hyatt Regency Greenwich',                            'americas',           '3', '4'),
  ('Hyatt Regency Coral Gables',                         'americas',           '4', '5'),
  ('Hyatt Centric Las Olas Fort Lauderdale',             'americas',           '4', '5'),
  ('Hyatt House Orlando International',                  'americas',           '2', '3'),
  ('Hyatt Place Orlando/I-Drive/Convention Center',      'americas',           '2', '3'),
  ('Hyatt Place Across From Universal Orlando Resort',   'americas',           '2', '3'),
  ('Hyatt Place Sarasota/Bradenton Airport',             'americas',           '2', '3'),
  ('Hyatt Place Sarasota/Lakewood Ranch',                'americas',           '2', '3'),
  ('Hyatt Place Tampa/Busch Gardens',                    'americas',           '2', '3'),
  ('Hyatt Place Tampa/Wesley Chapel',                    'americas',           '2', '3'),
  ('Hyatt Place Lakeland Center',                        'americas',           '2', '3'),
  ('Hyatt Regency Grand Cypress Resort',                 'americas',           '4', '5'),
  ('Hyatt Lodge Oak Brook Chicago',                      'americas',           '2', '3'),
  ('Hyatt House Chicago / Oak Brook',                    'americas',           '2', '3'),
  ('Hyatt Place Chicago/Schaumburg',                     'americas',           '1', '2'),
  ('Hyatt Place at Wichita State University',            'americas',           '1', '2'),
  ('Hyatt Regency Wichita',                              'americas',           '1', '2'),
  ('Hyatt Place Cincinnati Airport/Florence',            'americas',           '1', '2'),
  ('Hyatt Regency Lexington',                            'americas',           '2', '3'),
  ('Hyatt Place Baton Rouge/I-10',                       'americas',           '1', '2'),
  ('Hyatt Regency New Orleans',                          'americas',           '3', '4'),
  ('Hyatt Place Baltimore/BWI Airport',                  'americas',           '1', '2'),
  ('Hyatt House Boston/Waltham',                         'americas',           '2', '3'),
  ('Hyatt Place Flint/Grand Blanc',                      'americas',           '1', '2'),
  ('Hyatt Place Lincoln/Downtown-Haymarket',             'americas',           '2', '3'),
  ('Hyatt Regency Lake Tahoe Resort, Spa and Casino',    'americas',           '5', '6'),
  ('Hyatt Regency New Brunswick',                        'americas',           '2', '3'),
  ('Hyatt House Jersey City',                            'americas',           '4', '5'),
  ('Hyatt Regency Jersey City on the Hudson',            'americas',           '4', '5'),
  ('Hyatt House Mt. Laurel',                             'americas',           '1', '2'),
  ('Hyatt Place Mt. Laurel',                             'americas',           '1', '2'),
  ('Hyatt Place Albany/Downtown',                        'americas',           '2', '3'),
  ('Hyatt Place Saratoga/Malta',                         'americas',           '2', '3'),
  ('Hyatt Place Buffalo/Amherst',                        'americas',           '2', '3'),
  ('Hyatt Place Garden City',                            'americas',           '3', '4'),
  ('The Time New York',                                  'americas',           '6', '5'),
  ('The Beekman, A Thompson Hotel',                      'americas',           '6', '7'),
  ('Andaz 5th Avenue',                                   'americas',           '7', '8'),
  ('The Carolina Inn',                                   'americas',           '4', '5'),
  ('Hyatt House Raleigh Durham Airport',                 'americas',           '1', '2'),
  ('Hyatt House Raleigh/RDU/Brier Creek',                'americas',           '1', '2'),
  ('Hyatt Place Chapel Hill / Southern Village',         'americas',           '2', '3'),
  ('Hyatt Place Durham/Southpoint',                      'americas',           '1', '2'),
  ('Hyatt Place Raleigh-Durham Airport',                 'americas',           '1', '2'),
  ('Hyatt Regency Columbus',                             'americas',           '2', '3'),
  ('Hyatt House Columbus OSU/Short North',               'americas',           '2', '3'),
  ('Hyatt Place Columbus/Dublin',                        'americas',           '1', '2'),
  ('Hyatt Place Columbus/OSU',                           'americas',           '2', '3'),
  ('Hyatt Place Columbus/Worthington',                   'americas',           '1', '2'),
  ('Hyatt House Pittsburgh/ Bloomfield/Shadyside',       'americas',           '2', '3'),
  ('Hyatt Place Sumter/Downtown',                        'americas',           '1', '2'),
  ('Dream Nashville',                                    'americas',           '5', '4'),
  ('Hyatt Place Memphis/Wolfchase Galleria',             'americas',           '2', '1'),
  ('Hyatt Centric Congress Avenue Austin',               'americas',           '5', '4'),
  ('Hyatt Place Waco - South',                           'americas',           '1', '2'),
  ('Hyatt Regency DFW International Airport',            'americas',           '3', '4'),
  ('Hyatt Place DFW',                                    'americas',           '2', '3'),
  ('Hyatt Place Houston NW Vintage Park',                'americas',           '1', '2'),
  ('Hyatt Place Blacksburg/University',                  'americas',           '2', '3'),
  ('Hyatt Regency Lake Washington at Seattle''s Southport','americas',         '3', '4'),
  ('Hyatt Regency Seattle',                              'americas',           '4', '5'),
  ('Hyatt Place Bayamón',                                'americas',           '2', '3'),
  ('Hyatt Place Manatí',                                 'americas',           '2', '3'),

  -- Canada, Caribbean, and Latin America (16)
  ('Hyatt Regency Aruba Resort Spa and Casino',          'americas',           '7', '8'),
  ('Hyatt Place Edmonton-West',                          'americas',           '1', '2'),
  ('Hyatt Place Windsor',                                'americas',           '1', '2'),
  ('Hyatt Place Moncton / Downtown',                     'americas',           '1', '2'),
  ('Hyatt Centric Las Condes Santiago',                  'americas',           '2', '3'),
  ('Hyatt Place Santiago/Vitacura',                      'americas',           '1', '2'),
  ('Hyatt Place San Jose/Pinares',                       'americas',           '1', '2'),
  ('Hyatt Centric Guatemala City',                       'americas',           '2', '3'),
  ('Hyatt Place San Pedro Sula',                         'americas',           '1', '2'),
  ('Hyatt Place Tegucigalpa',                            'americas',           '1', '2'),
  ('Hyatt Centric Playa Del Carmen',                     'americas',           '4', '3'),
  ('Alila Mayakoba',                                     'americas',           '6', '7'),
  ('Hyatt House Monterrey Valle/San Pedro',              'americas',           '1', '2'),
  ('Hyatt Place Monterrey Valle',                        'americas',           '1', '2'),
  ('Hyatt Place Saltillo',                               'americas',           '1', '2'),
  ('Secrets St. Lucia Resort & Spa',                     'americas',           'C', 'D'),

  -- Europe (16)
  ('Hyatt Place Rouen',                                  'europe',             '1', '2'),
  ('Hôtel du Louvre',                                    'europe',             '7', '8'),
  ('Me and All Hotel Ulm',                               'europe',             '1', '2'),
  ('Grand Hyatt Athens',                                 'europe',             '3', '4'),
  ('Hyatt Regency Thessaloniki',                         'europe',             '2', '3'),
  ('Hyatt Regency Lisbon',                               'europe',             '4', '5'),
  ('AluaSoul Ibiza',                                     'europe',             'A', 'B'),
  ('Dreams Lanzarote Playa Dorada',                      'europe',             'B', 'C'),
  ('Dreams Jardin Tropical Resort & Spa',                'europe',             'B', 'C'),
  ('The Standard, Ibiza',                                'europe',             '6', '7'),
  ('Hyatt Regency Hesperia Madrid',                      'europe',             '4', '5'),
  ('Secrets Lanzarote Resort & Spa',                     'europe',             'B', 'C'),
  ('Story Hotel Stockholm North',                        'europe',             '1', '2'),
  ('Hotel Fluela Davos',                                 'europe',             '7', '8'),
  ('Park Hyatt London River Thames',                     'europe',             '7', '8'),
  ('Hyatt Place London City East',                       'europe',             '4', '3'),

  -- Africa and Middle East (10)
  ('Hyatt Regency Addis Ababa',                          'middle_east_africa', '3', '4'),
  ('Grand Hyatt Kuwait Residences',                      'middle_east_africa', '4', '5'),
  ('Hyatt Regency Al Kout Mall',                         'middle_east_africa', '4', '3'),
  ('Jabal Omar Hyatt Regency Makkah',                    'middle_east_africa', '4', '5'),
  ('Grand Hyatt The Red Sea',                            'middle_east_africa', '7', '6'),
  ('Hyatt Regency Riyadh Olaya',                         'middle_east_africa', '4', '5'),
  ('Hyatt Place Riyadh Al Sulaimania',                   'middle_east_africa', '2', '3'),
  ('Hyatt Regency Cape Town',                            'middle_east_africa', '1', '2'),
  ('Andaz Capital Gate, Abu Dhabi',                      'middle_east_africa', '3', '4'),
  ('Hyatt Place Dubai Jumeirah',                         'middle_east_africa', '1', '2'),

  -- Asia and Pacific (22)
  ('Grand Hyatt Dalian',                                 'asia_pacific',       '4', '3'),
  ('Hyatt Regency Beijing Shiyuan',                      'asia_pacific',       '2', '1'),
  ('Andaz Nanjing Hexi',                                 'asia_pacific',       '3', '2'),
  ('Commune by the Great Wall',                          'asia_pacific',       '3', '2'),
  ('Hyatt Place Chongli',                                'asia_pacific',       '2', '1'),
  ('Park Hyatt Sanya Sunny Bay Resort',                  'asia_pacific',       '7', '6'),
  ('Grand Hyatt Shenzhou Peninsula',                     'asia_pacific',       '4', '3'),
  ('Grand Hyatt Sanya Haitang Bay Resort & Spa',         'asia_pacific',       '4', '3'),
  ('Hyatt Regency Sanya Tianli Bay',                     'asia_pacific',       '3', '2'),
  ('Hyatt Centric Hebbal Bengaluru',                     'asia_pacific',       '1', '2'),
  ('Hyatt Centric MG Road Bangalore',                    'asia_pacific',       '1', '2'),
  ('Hyatt Regency Dehradun Resort & Spa',                'asia_pacific',       '2', '3'),
  ('Hyatt Regency Dharamshala Resort',                   'asia_pacific',       '5', '4'),
  ('Ronil Goa',                                          'asia_pacific',       '1', '2'),
  ('Hyatt Place Goa Candolim',                           'asia_pacific',       '1', '2'),
  ('Hyatt Regency Tokyo Bay',                            'asia_pacific',       '3', '4'),
  ('Caption by Hyatt Namba Osaka',                       'asia_pacific',       '2', '3'),
  ('Hyatt Place Kyoto',                                  'asia_pacific',       '2', '3'),
  ('Hyatt House Tokyo Shibuya',                          'asia_pacific',       '5', '6'),
  ('Andaz Macau',                                        'asia_pacific',       '5', '4'),
  ('Hyatt Regency Kuantan Resort',                       'asia_pacific',       '1', '2'),
  ('The Standard, Singapore',                            'asia_pacific',       '5', '4')
)
insert into hotel_properties (
  program_id, name, region, category, category_next, category_changes_at, last_verified
)
select
  hyatt.id,
  c.name,
  c.region,
  c.current_cat,
  c.next_cat,
  '2026-05-20'::date,
  '2026-04-27'::date
from changes c, hyatt
on conflict (program_id, lower(name)) do update
set
  category            = excluded.category,
  category_next       = excluded.category_next,
  category_changes_at = excluded.category_changes_at,
  last_verified       = excluded.last_verified;
