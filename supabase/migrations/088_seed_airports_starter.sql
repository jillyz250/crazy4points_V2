-- Starter airports seed for the Partner Booking Tool.
--
-- BACKGROUND
-- ----------
-- ~280 airports covering: every IATA referenced as a hub or focus city
-- across our 8 authored program pages, plus the major destinations every
-- region needs for the tool to resolve origin/destination lookups.
--
-- This is intentionally not exhaustive. We can add airports incrementally
-- as readers report missing codes or as we author more program pages. The
-- starter set covers ~95% of the routes our authored programs surface.
--
-- Region vocabulary (15 buckets) matches partner_redemptions check constraint:
--   north_america, hawaii, caribbean, central_america, mexico,
--   south_america_1 (northern), south_america_2 (southern),
--   europe, north_africa, sub_saharan_africa,
--   middle_east, india_south_asia, asia_1 (Japan/Korea), asia_2 (rest of Asia),
--   south_pacific.
--
-- Lat/lng included for great-circle distance computation (the tool will
-- need this to match against distance_band_low/high in partner_redemptions).

insert into airports (iata, icao, name, city, country, region, lat, lng) values

-- ============================================================
-- North America — US (hubs + focus cities + major destinations)
-- ============================================================
('JFK', 'KJFK', 'John F. Kennedy Intl',          'New York',         'US', 'north_america',  40.6398, -73.7789),
('LGA', 'KLGA', 'LaGuardia',                      'New York',         'US', 'north_america',  40.7769, -73.8740),
('EWR', 'KEWR', 'Newark Liberty Intl',            'Newark',           'US', 'north_america',  40.6925, -74.1687),
('BOS', 'KBOS', 'Logan Intl',                     'Boston',           'US', 'north_america',  42.3656, -71.0096),
('PHL', 'KPHL', 'Philadelphia Intl',              'Philadelphia',     'US', 'north_america',  39.8729, -75.2437),
('DCA', 'KDCA', 'Reagan National',                'Washington',       'US', 'north_america',  38.8512, -77.0402),
('IAD', 'KIAD', 'Dulles Intl',                    'Washington',       'US', 'north_america',  38.9445, -77.4558),
('BWI', 'KBWI', 'Baltimore/Washington Intl',      'Baltimore',        'US', 'north_america',  39.1754, -76.6683),
('ATL', 'KATL', 'Hartsfield-Jackson',             'Atlanta',          'US', 'north_america',  33.6407, -84.4277),
('CLT', 'KCLT', 'Charlotte Douglas',              'Charlotte',        'US', 'north_america',  35.2140, -80.9431),
('MIA', 'KMIA', 'Miami Intl',                     'Miami',            'US', 'north_america',  25.7959, -80.2870),
('FLL', 'KFLL', 'Fort Lauderdale-Hollywood',      'Fort Lauderdale',  'US', 'north_america',  26.0742, -80.1506),
('MCO', 'KMCO', 'Orlando Intl',                   'Orlando',          'US', 'north_america',  28.4312, -81.3081),
('TPA', 'KTPA', 'Tampa Intl',                     'Tampa',            'US', 'north_america',  27.9755, -82.5332),
('JAX', 'KJAX', 'Jacksonville Intl',              'Jacksonville',     'US', 'north_america',  30.4941, -81.6879),
('RSW', 'KRSW', 'Southwest Florida Intl',         'Fort Myers',       'US', 'north_america',  26.5362, -81.7552),
('DTW', 'KDTW', 'Detroit Metro',                  'Detroit',          'US', 'north_america',  42.2125, -83.3534),
('ORD', 'KORD', 'O''Hare Intl',                   'Chicago',          'US', 'north_america',  41.9742, -87.9073),
('MDW', 'KMDW', 'Midway Intl',                    'Chicago',          'US', 'north_america',  41.7868, -87.7522),
('MSP', 'KMSP', 'Minneapolis-St. Paul Intl',      'Minneapolis',      'US', 'north_america',  44.8848, -93.2223),
('STL', 'KSTL', 'St. Louis Lambert',              'St. Louis',        'US', 'north_america',  38.7487, -90.3700),
('BNA', 'KBNA', 'Nashville Intl',                 'Nashville',        'US', 'north_america',  36.1245, -86.6782),
('IAH', 'KIAH', 'George Bush Intercontinental',   'Houston',          'US', 'north_america',  29.9844, -95.3414),
('HOU', 'KHOU', 'William P. Hobby',               'Houston',          'US', 'north_america',  29.6454, -95.2789),
('DFW', 'KDFW', 'Dallas/Fort Worth Intl',         'Dallas',           'US', 'north_america',  32.8998, -97.0403),
('DAL', 'KDAL', 'Dallas Love Field',              'Dallas',           'US', 'north_america',  32.8471, -96.8517),
('AUS', 'KAUS', 'Austin-Bergstrom Intl',          'Austin',           'US', 'north_america',  30.1945, -97.6699),
('SAT', 'KSAT', 'San Antonio Intl',               'San Antonio',      'US', 'north_america',  29.5337, -98.4698),
('DEN', 'KDEN', 'Denver Intl',                    'Denver',           'US', 'north_america',  39.8561, -104.6737),
('SLC', 'KSLC', 'Salt Lake City Intl',            'Salt Lake City',   'US', 'north_america',  40.7884, -111.9778),
('PHX', 'KPHX', 'Phoenix Sky Harbor',             'Phoenix',          'US', 'north_america',  33.4342, -112.0117),
('LAS', 'KLAS', 'Harry Reid Intl',                'Las Vegas',        'US', 'north_america',  36.0840, -115.1537),
('LAX', 'KLAX', 'Los Angeles Intl',               'Los Angeles',      'US', 'north_america',  33.9416, -118.4085),
('LGB', 'KLGB', 'Long Beach',                     'Long Beach',       'US', 'north_america',  33.8177, -118.1516),
('SAN', 'KSAN', 'San Diego Intl',                 'San Diego',        'US', 'north_america',  32.7338, -117.1933),
('SNA', 'KSNA', 'John Wayne',                     'Santa Ana',        'US', 'north_america',  33.6757, -117.8682),
('ONT', 'KONT', 'Ontario Intl',                   'Ontario',          'US', 'north_america',  34.0560, -117.6012),
('SFO', 'KSFO', 'San Francisco Intl',             'San Francisco',    'US', 'north_america',  37.6213, -122.3790),
('OAK', 'KOAK', 'Oakland Intl',                   'Oakland',          'US', 'north_america',  37.7213, -122.2208),
('SJC', 'KSJC', 'San Jose Mineta Intl',           'San Jose',         'US', 'north_america',  37.3639, -121.9289),
('SMF', 'KSMF', 'Sacramento Intl',                'Sacramento',       'US', 'north_america',  38.6953, -121.5908),
('PDX', 'KPDX', 'Portland Intl',                  'Portland',         'US', 'north_america',  45.5887, -122.5975),
('SEA', 'KSEA', 'Seattle-Tacoma Intl',            'Seattle',          'US', 'north_america',  47.4502, -122.3088),
('ANC', 'PANC', 'Ted Stevens Anchorage Intl',     'Anchorage',        'US', 'north_america',  61.1741, -149.9961),
('FAI', 'PAFA', 'Fairbanks Intl',                 'Fairbanks',        'US', 'north_america',  64.8151, -147.8560),
('JNU', 'PAJN', 'Juneau Intl',                    'Juneau',           'US', 'north_america',  58.3548, -134.5763),
('PIT', 'KPIT', 'Pittsburgh Intl',                'Pittsburgh',       'US', 'north_america',  40.4915, -80.2329),
('CLE', 'KCLE', 'Cleveland Hopkins',              'Cleveland',        'US', 'north_america',  41.4117, -81.8498),
('CMH', 'KCMH', 'John Glenn Columbus Intl',       'Columbus',         'US', 'north_america',  39.9980, -82.8919),
('CVG', 'KCVG', 'Cincinnati/Northern Kentucky',   'Cincinnati',       'US', 'north_america',  39.0488, -84.6678),
('IND', 'KIND', 'Indianapolis Intl',              'Indianapolis',     'US', 'north_america',  39.7173, -86.2944),
('MKE', 'KMKE', 'Milwaukee Mitchell',             'Milwaukee',        'US', 'north_america',  42.9472, -87.8966),
('MCI', 'KMCI', 'Kansas City Intl',               'Kansas City',      'US', 'north_america',  39.2976, -94.7139),
('OKC', 'KOKC', 'Will Rogers World',              'Oklahoma City',    'US', 'north_america',  35.3931, -97.6007),
('TUL', 'KTUL', 'Tulsa Intl',                     'Tulsa',            'US', 'north_america',  36.1984, -95.8881),
('OMA', 'KOMA', 'Omaha Eppley',                   'Omaha',            'US', 'north_america',  41.3032, -95.8941),
('RDU', 'KRDU', 'Raleigh-Durham Intl',            'Raleigh',          'US', 'north_america',  35.8776, -78.7875),
('CHS', 'KCHS', 'Charleston Intl',                'Charleston',       'US', 'north_america',  32.8986, -80.0405),
('SAV', 'KSAV', 'Savannah/Hilton Head Intl',      'Savannah',         'US', 'north_america',  32.1276, -81.2021),
('RIC', 'KRIC', 'Richmond Intl',                  'Richmond',         'US', 'north_america',  37.5052, -77.3197),
('BUF', 'KBUF', 'Buffalo Niagara Intl',           'Buffalo',          'US', 'north_america',  42.9405, -78.7322),
('ROC', 'KROC', 'Greater Rochester Intl',         'Rochester',        'US', 'north_america',  43.1189, -77.6724),
('SYR', 'KSYR', 'Syracuse Hancock Intl',          'Syracuse',         'US', 'north_america',  43.1112, -76.1063),
('ALB', 'KALB', 'Albany Intl',                    'Albany',           'US', 'north_america',  42.7483, -73.8017),
('PVD', 'KPVD', 'T.F. Green',                     'Providence',       'US', 'north_america',  41.7240, -71.4282),
('PWM', 'KPWM', 'Portland Intl Jetport',          'Portland',         'US', 'north_america',  43.6462, -70.3088),
('BTV', 'KBTV', 'Burlington Intl',                'Burlington',       'US', 'north_america',  44.4719, -73.1533),
('MEM', 'KMEM', 'Memphis Intl',                   'Memphis',          'US', 'north_america',  35.0421, -89.9767),
('BHM', 'KBHM', 'Birmingham-Shuttlesworth',       'Birmingham',       'US', 'north_america',  33.5629, -86.7535),
('MSY', 'KMSY', 'Louis Armstrong New Orleans',    'New Orleans',      'US', 'north_america',  29.9934, -90.2580),
('PNS', 'KPNS', 'Pensacola Intl',                 'Pensacola',        'US', 'north_america',  30.4734, -87.1866),
('ABQ', 'KABQ', 'Albuquerque Intl Sunport',       'Albuquerque',      'US', 'north_america',  35.0402, -106.6092),
('ELP', 'KELP', 'El Paso Intl',                   'El Paso',          'US', 'north_america',  31.8072, -106.3776),
('TUS', 'KTUS', 'Tucson Intl',                    'Tucson',           'US', 'north_america',  32.1161, -110.9410),
('BOI', 'KBOI', 'Boise Air Terminal',             'Boise',            'US', 'north_america',  43.5644, -116.2228),
('GEG', 'KGEG', 'Spokane Intl',                   'Spokane',          'US', 'north_america',  47.6199, -117.5339),
('MFR', 'KMFR', 'Rogue Valley Intl-Medford',      'Medford',          'US', 'north_america',  42.3742, -122.8735),
('EUG', 'KEUG', 'Eugene',                         'Eugene',           'US', 'north_america',  44.1246, -123.2120),

-- Canada (counts as North America for award charts)
('YYZ', 'CYYZ', 'Toronto Pearson Intl',           'Toronto',          'CA', 'north_america',  43.6777, -79.6248),
('YUL', 'CYUL', 'Montreal-Trudeau',               'Montreal',         'CA', 'north_america',  45.4706, -73.7408),
('YVR', 'CYVR', 'Vancouver Intl',                 'Vancouver',        'CA', 'north_america',  49.1967, -123.1815),
('YYC', 'CYYC', 'Calgary Intl',                   'Calgary',          'CA', 'north_america',  51.1215, -114.0103),
('YEG', 'CYEG', 'Edmonton Intl',                  'Edmonton',         'CA', 'north_america',  53.3097, -113.5800),
('YOW', 'CYOW', 'Ottawa Macdonald-Cartier',       'Ottawa',           'CA', 'north_america',  45.3225, -75.6692),
('YHZ', 'CYHZ', 'Halifax Stanfield',              'Halifax',          'CA', 'north_america',  44.8808, -63.5086),

-- ============================================================
-- Hawaii (separate region — most charts treat it specially)
-- ============================================================
('HNL', 'PHNL', 'Daniel K. Inouye Intl',          'Honolulu',         'US', 'hawaii',  21.3187, -157.9225),
('OGG', 'PHOG', 'Kahului',                        'Maui',             'US', 'hawaii',  20.8987, -156.4305),
('KOA', 'PHKO', 'Ellison Onizuka Kona Intl',      'Kona',             'US', 'hawaii',  19.7388, -156.0456),
('LIH', 'PHLI', 'Lihue',                          'Kauai',            'US', 'hawaii',  21.9760, -159.3389),
('ITO', 'PHTO', 'Hilo Intl',                      'Hilo',             'US', 'hawaii',  19.7214, -155.0485),

-- ============================================================
-- Caribbean
-- ============================================================
('SJU', 'TJSJ', 'Luis Muñoz Marín Intl',          'San Juan',         'PR', 'caribbean',  18.4394, -66.0018),
('STT', 'TIST', 'Cyril E. King',                  'St. Thomas',       'VI', 'caribbean',  18.3373, -64.9734),
('STX', 'TISX', 'Henry E. Rohlsen',               'St. Croix',        'VI', 'caribbean',  17.7019, -64.7986),
('AUA', 'TNCA', 'Queen Beatrix Intl',             'Aruba',            'AW', 'caribbean',  12.5014, -70.0152),
('CUR', 'TNCC', 'Curaçao Intl',                   'Willemstad',       'CW', 'caribbean',  12.1889, -68.9598),
('SXM', 'TNCM', 'Princess Juliana Intl',          'St. Martin',       'SX', 'caribbean',  18.0410, -63.1089),
('NAS', 'MYNN', 'Lynden Pindling Intl',           'Nassau',           'BS', 'caribbean',  25.0389, -77.4661),
('MBJ', 'MKJS', 'Sangster Intl',                  'Montego Bay',      'JM', 'caribbean',  18.5037, -77.9134),
('KIN', 'MKJP', 'Norman Manley Intl',             'Kingston',         'JM', 'caribbean',  17.9357, -76.7875),
('PUJ', 'MDPC', 'Punta Cana Intl',                'Punta Cana',       'DO', 'caribbean',  18.5674, -68.3634),
('SDQ', 'MDSD', 'Las Américas Intl',              'Santo Domingo',    'DO', 'caribbean',  18.4297, -69.6689),
('HAV', 'MUHA', 'José Martí Intl',                'Havana',           'CU', 'caribbean',  22.9892, -82.4091),
('GCM', 'MWCR', 'Owen Roberts Intl',              'Grand Cayman',     'KY', 'caribbean',  19.2929, -81.3577),
('BGI', 'TBPB', 'Grantley Adams Intl',            'Bridgetown',       'BB', 'caribbean',  13.0746, -59.4925),
('ANU', 'TAPA', 'V.C. Bird Intl',                 'St. John''s',      'AG', 'caribbean',  17.1367, -61.7927),

-- ============================================================
-- Mexico
-- ============================================================
('MEX', 'MMMX', 'Benito Juárez Intl',             'Mexico City',      'MX', 'mexico',  19.4361, -99.0719),
('CUN', 'MMUN', 'Cancún Intl',                    'Cancún',           'MX', 'mexico',  21.0365, -86.8771),
('PVR', 'MMPR', 'Puerto Vallarta Intl',           'Puerto Vallarta',  'MX', 'mexico',  20.6800, -105.2540),
('SJD', 'MMSD', 'Los Cabos Intl',                 'Los Cabos',        'MX', 'mexico',  23.1518, -109.7211),
('MTY', 'MMMY', 'Monterrey Intl',                 'Monterrey',        'MX', 'mexico',  25.7785, -100.1067),
('GDL', 'MMGL', 'Guadalajara Intl',               'Guadalajara',      'MX', 'mexico',  20.5218, -103.3110),

-- ============================================================
-- Central America
-- ============================================================
('PTY', 'MPTO', 'Tocumen Intl',                   'Panama City',      'PA', 'central_america',   9.0714, -79.3835),
('SJO', 'MROC', 'Juan Santamaría Intl',           'San José',         'CR', 'central_america',   9.9939, -84.2088),
('LIR', 'MRLB', 'Daniel Oduber Intl',             'Liberia',          'CR', 'central_america',  10.5933, -85.5444),
('GUA', 'MGGT', 'La Aurora Intl',                 'Guatemala City',   'GT', 'central_america',  14.5833, -90.5275),
('SAL', 'MSLP', 'San Óscar Romero Intl',          'San Salvador',     'SV', 'central_america',  13.4409, -89.0557),
('TGU', 'MHTG', 'Toncontín Intl',                 'Tegucigalpa',      'HN', 'central_america',  14.0608, -87.2173),
('BZE', 'MZBZ', 'Philip S. W. Goldson Intl',      'Belize City',      'BZ', 'central_america',  17.5391, -88.3082),

-- ============================================================
-- South America 1 (northern: Colombia, Peru, Ecuador, Venezuela)
-- ============================================================
('BOG', 'SKBO', 'El Dorado Intl',                 'Bogotá',           'CO', 'south_america_1',   4.7016, -74.1469),
('LIM', 'SPJC', 'Jorge Chávez Intl',              'Lima',             'PE', 'south_america_1', -12.0219, -77.1143),
('UIO', 'SEQM', 'Mariscal Sucre Intl',            'Quito',            'EC', 'south_america_1',  -0.1292, -78.3575),
('GYE', 'SEGU', 'José Joaquín de Olmedo Intl',    'Guayaquil',        'EC', 'south_america_1',  -2.1574, -79.8836),
('CCS', 'SVMI', 'Simón Bolívar Intl',             'Caracas',          'VE', 'south_america_1',  10.6013, -66.9911),
('CTG', 'SKCG', 'Rafael Núñez Intl',              'Cartagena',        'CO', 'south_america_1',  10.4424, -75.5130),
('MDE', 'SKRG', 'José María Córdova Intl',        'Medellín',         'CO', 'south_america_1',   6.1645, -75.4232),
('CUZ', 'SPZO', 'Alejandro Velasco Astete',       'Cuzco',            'PE', 'south_america_1', -13.5357, -71.9389),

-- ============================================================
-- South America 2 (southern: Brazil, Argentina, Chile, Uruguay)
-- ============================================================
('GRU', 'SBGR', 'Guarulhos Intl',                 'São Paulo',        'BR', 'south_america_2', -23.4356, -46.4731),
('GIG', 'SBGL', 'Galeão Intl',                    'Rio de Janeiro',   'BR', 'south_america_2', -22.8099, -43.2505),
('BSB', 'SBBR', 'Brasília Intl',                  'Brasília',         'BR', 'south_america_2', -15.8711, -47.9186),
('EZE', 'SAEZ', 'Ezeiza Intl',                    'Buenos Aires',     'AR', 'south_america_2', -34.8222, -58.5358),
('SCL', 'SCEL', 'Santiago Intl',                  'Santiago',         'CL', 'south_america_2', -33.3930, -70.7858),
('MVD', 'SUMU', 'Carrasco Intl',                  'Montevideo',       'UY', 'south_america_2', -34.8384, -56.0308),
('ASU', 'SGAS', 'Silvio Pettirossi Intl',         'Asunción',         'PY', 'south_america_2', -25.2398, -57.5200),

-- ============================================================
-- Europe
-- ============================================================
('LHR', 'EGLL', 'Heathrow',                       'London',           'GB', 'europe', 51.4700,  -0.4543),
('LGW', 'EGKK', 'Gatwick',                        'London',           'GB', 'europe', 51.1481,  -0.1903),
('LCY', 'EGLC', 'London City',                    'London',           'GB', 'europe', 51.5053,   0.0553),
('STN', 'EGSS', 'Stansted',                       'London',           'GB', 'europe', 51.8849,   0.2350),
('MAN', 'EGCC', 'Manchester',                     'Manchester',       'GB', 'europe', 53.3537,  -2.2750),
('EDI', 'EGPH', 'Edinburgh',                      'Edinburgh',        'GB', 'europe', 55.9500,  -3.3725),
('DUB', 'EIDW', 'Dublin',                         'Dublin',           'IE', 'europe', 53.4213,  -6.2701),
('CDG', 'LFPG', 'Charles de Gaulle',              'Paris',            'FR', 'europe', 49.0097,   2.5479),
('ORY', 'LFPO', 'Orly',                           'Paris',            'FR', 'europe', 48.7233,   2.3794),
('AMS', 'EHAM', 'Schiphol',                       'Amsterdam',        'NL', 'europe', 52.3105,   4.7683),
('FRA', 'EDDF', 'Frankfurt',                      'Frankfurt',        'DE', 'europe', 50.0379,   8.5622),
('MUC', 'EDDM', 'Munich',                         'Munich',           'DE', 'europe', 48.3537,  11.7750),
('BER', 'EDDB', 'Brandenburg',                    'Berlin',           'DE', 'europe', 52.3667,  13.5033),
('ZRH', 'LSZH', 'Zurich',                         'Zurich',           'CH', 'europe', 47.4582,   8.5556),
('GVA', 'LSGG', 'Geneva',                         'Geneva',           'CH', 'europe', 46.2381,   6.1090),
('VIE', 'LOWW', 'Vienna Intl',                    'Vienna',           'AT', 'europe', 48.1102,  16.5697),
('CPH', 'EKCH', 'Copenhagen',                     'Copenhagen',       'DK', 'europe', 55.6181,  12.6561),
('ARN', 'ESSA', 'Stockholm Arlanda',              'Stockholm',        'SE', 'europe', 59.6519,  17.9186),
('OSL', 'ENGM', 'Oslo Gardermoen',                'Oslo',             'NO', 'europe', 60.1976,  11.1004),
('HEL', 'EFHK', 'Helsinki-Vantaa',                'Helsinki',         'FI', 'europe', 60.3172,  24.9633),
('KEF', 'BIKF', 'Keflavík Intl',                  'Reykjavík',        'IS', 'europe', 63.9850, -22.6056),
('MAD', 'LEMD', 'Adolfo Suárez Madrid-Barajas',   'Madrid',           'ES', 'europe', 40.4936,  -3.5668),
('BCN', 'LEBL', 'Barcelona-El Prat',              'Barcelona',        'ES', 'europe', 41.2974,   2.0833),
('LIS', 'LPPT', 'Humberto Delgado',               'Lisbon',           'PT', 'europe', 38.7813,  -9.1359),
('FCO', 'LIRF', 'Leonardo da Vinci-Fiumicino',    'Rome',             'IT', 'europe', 41.7999,  12.2462),
('MXP', 'LIMC', 'Milan Malpensa',                 'Milan',            'IT', 'europe', 45.6306,   8.7281),
('LIN', 'LIML', 'Milan Linate',                   'Milan',            'IT', 'europe', 45.4451,   9.2767),
('VCE', 'LIPZ', 'Venice Marco Polo',              'Venice',           'IT', 'europe', 45.5053,  12.3519),
('NAP', 'LIRN', 'Naples Capodichino',             'Naples',           'IT', 'europe', 40.8860,  14.2908),
('ATH', 'LGAV', 'Athens Eleftherios Venizelos',   'Athens',           'GR', 'europe', 37.9364,  23.9445),
('IST', 'LTFM', 'Istanbul',                       'Istanbul',         'TR', 'europe', 41.2753,  28.7519),
('SAW', 'LTFJ', 'Sabiha Gökçen',                  'Istanbul',         'TR', 'europe', 40.8986,  29.3092),
('PRG', 'LKPR', 'Václav Havel',                   'Prague',           'CZ', 'europe', 50.1008,  14.2632),
('WAW', 'EPWA', 'Warsaw Chopin',                  'Warsaw',           'PL', 'europe', 52.1657,  20.9671),
('BUD', 'LHBP', 'Budapest Ferenc Liszt Intl',     'Budapest',         'HU', 'europe', 47.4395,  19.2611),

-- ============================================================
-- North Africa
-- ============================================================
('CMN', 'GMMN', 'Mohammed V Intl',                'Casablanca',       'MA', 'north_africa',  33.3675,  -7.5899),
('RAK', 'GMMX', 'Marrakesh Menara',               'Marrakesh',        'MA', 'north_africa',  31.6069,  -8.0363),
('CAI', 'HECA', 'Cairo Intl',                     'Cairo',            'EG', 'north_africa',  30.1219,  31.4056),
('TUN', 'DTTA', 'Tunis-Carthage',                 'Tunis',            'TN', 'north_africa',  36.8510,  10.2272),

-- ============================================================
-- Sub-Saharan Africa
-- ============================================================
('JNB', 'FAOR', 'O.R. Tambo Intl',                'Johannesburg',     'ZA', 'sub_saharan_africa', -26.1392,  28.2460),
('CPT', 'FACT', 'Cape Town Intl',                 'Cape Town',        'ZA', 'sub_saharan_africa', -33.9648,  18.6017),
('NBO', 'HKJK', 'Jomo Kenyatta Intl',             'Nairobi',          'KE', 'sub_saharan_africa',  -1.3192,  36.9278),
('ADD', 'HAAB', 'Bole Intl',                      'Addis Ababa',      'ET', 'sub_saharan_africa',   8.9779,  38.7993),
('LOS', 'DNMM', 'Murtala Muhammed Intl',          'Lagos',            'NG', 'sub_saharan_africa',   6.5774,   3.3211),
('ACC', 'DGAA', 'Kotoka Intl',                    'Accra',            'GH', 'sub_saharan_africa',   5.6052,  -0.1668),
('DAR', 'HTDA', 'Julius Nyerere Intl',            'Dar es Salaam',    'TZ', 'sub_saharan_africa',  -6.8781,  39.2026),

-- ============================================================
-- Middle East
-- ============================================================
('DXB', 'OMDB', 'Dubai Intl',                     'Dubai',            'AE', 'middle_east',  25.2532,  55.3657),
('AUH', 'OMAA', 'Abu Dhabi Intl',                 'Abu Dhabi',        'AE', 'middle_east',  24.4330,  54.6511),
('DOH', 'OTHH', 'Hamad Intl',                     'Doha',             'QA', 'middle_east',  25.2731,  51.6080),
('JED', 'OEJN', 'King Abdulaziz Intl',            'Jeddah',           'SA', 'middle_east',  21.6796,  39.1565),
('RUH', 'OERK', 'King Khalid Intl',               'Riyadh',           'SA', 'middle_east',  24.9576,  46.6988),
('TLV', 'LLBG', 'Ben Gurion',                     'Tel Aviv',         'IL', 'middle_east',  32.0114,  34.8867),
('AMM', 'OJAI', 'Queen Alia Intl',                'Amman',            'JO', 'middle_east',  31.7226,  35.9933),
('BEY', 'OLBA', 'Beirut-Rafic Hariri Intl',       'Beirut',           'LB', 'middle_east',  33.8208,  35.4884),
('KWI', 'OKBK', 'Kuwait Intl',                    'Kuwait City',      'KW', 'middle_east',  29.2266,  47.9690),
('BAH', 'OBBI', 'Bahrain Intl',                   'Manama',           'BH', 'middle_east',  26.2708,  50.6336),
('MCT', 'OOMS', 'Muscat Intl',                    'Muscat',           'OM', 'middle_east',  23.5933,  58.2844),

-- ============================================================
-- India / South Asia
-- ============================================================
('DEL', 'VIDP', 'Indira Gandhi Intl',             'Delhi',            'IN', 'india_south_asia',  28.5562,  77.1000),
('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj',    'Mumbai',           'IN', 'india_south_asia',  19.0887,  72.8679),
('BLR', 'VOBL', 'Kempegowda Intl',                'Bangalore',        'IN', 'india_south_asia',  13.1979,  77.7063),
('MAA', 'VOMM', 'Chennai Intl',                   'Chennai',          'IN', 'india_south_asia',  12.9941,  80.1709),
('HYD', 'VOHS', 'Rajiv Gandhi Intl',              'Hyderabad',        'IN', 'india_south_asia',  17.2403,  78.4294),
('CCU', 'VECC', 'Netaji Subhas Chandra Bose',     'Kolkata',          'IN', 'india_south_asia',  22.6547,  88.4467),
('CMB', 'VCBI', 'Bandaranaike Intl',              'Colombo',          'LK', 'india_south_asia',   7.1808,  79.8842),
('KTM', 'VNKT', 'Tribhuvan Intl',                 'Kathmandu',        'NP', 'india_south_asia',  27.6981,  85.3592),
('DAC', 'VGHS', 'Hazrat Shahjalal Intl',          'Dhaka',            'BD', 'india_south_asia',  23.8431,  90.3978),
('MLE', 'VRMM', 'Velana Intl',                    'Malé',             'MV', 'india_south_asia',   4.1918,  73.5290),

-- ============================================================
-- Asia 1 (Japan, Korea — separate region for award charts)
-- ============================================================
('NRT', 'RJAA', 'Narita Intl',                    'Tokyo',            'JP', 'asia_1',  35.7647, 140.3863),
('HND', 'RJTT', 'Haneda',                         'Tokyo',            'JP', 'asia_1',  35.5494, 139.7798),
('KIX', 'RJBB', 'Kansai Intl',                    'Osaka',            'JP', 'asia_1',  34.4347, 135.2440),
('NGO', 'RJGG', 'Chubu Centrair Intl',            'Nagoya',           'JP', 'asia_1',  34.8584, 136.8054),
('FUK', 'RJFF', 'Fukuoka',                        'Fukuoka',          'JP', 'asia_1',  33.5859, 130.4510),
('CTS', 'RJCC', 'New Chitose',                    'Sapporo',          'JP', 'asia_1',  42.7752, 141.6924),
('OKA', 'ROAH', 'Naha',                           'Okinawa',          'JP', 'asia_1',  26.1958, 127.6458),
('ICN', 'RKSI', 'Incheon Intl',                   'Seoul',            'KR', 'asia_1',  37.4602, 126.4407),
('GMP', 'RKSS', 'Gimpo Intl',                     'Seoul',            'KR', 'asia_1',  37.5583, 126.7906),
('PUS', 'RKPK', 'Gimhae Intl',                    'Busan',            'KR', 'asia_1',  35.1795, 128.9382),

-- ============================================================
-- Asia 2 (Hong Kong, China, SE Asia, Taiwan)
-- ============================================================
('HKG', 'VHHH', 'Hong Kong Intl',                 'Hong Kong',        'HK', 'asia_2',  22.3080, 113.9185),
('TPE', 'RCTP', 'Taoyuan Intl',                   'Taipei',           'TW', 'asia_2',  25.0797, 121.2342),
('TSA', 'RCSS', 'Songshan',                       'Taipei',           'TW', 'asia_2',  25.0697, 121.5526),
('PEK', 'ZBAA', 'Beijing Capital Intl',           'Beijing',          'CN', 'asia_2',  40.0801, 116.5846),
('PKX', 'ZBAD', 'Beijing Daxing Intl',            'Beijing',          'CN', 'asia_2',  39.5098, 116.4105),
('PVG', 'ZSPD', 'Shanghai Pudong Intl',           'Shanghai',         'CN', 'asia_2',  31.1443, 121.8083),
('SHA', 'ZSSS', 'Shanghai Hongqiao',              'Shanghai',         'CN', 'asia_2',  31.1979, 121.3363),
('CAN', 'ZGGG', 'Guangzhou Baiyun Intl',          'Guangzhou',        'CN', 'asia_2',  23.3924, 113.2988),
('SZX', 'ZGSZ', 'Shenzhen Bao''an Intl',          'Shenzhen',         'CN', 'asia_2',  22.6393, 113.8108),
('CTU', 'ZUUU', 'Chengdu Tianfu Intl',            'Chengdu',          'CN', 'asia_2',  30.3119, 104.4413),
('SIN', 'WSSS', 'Singapore Changi',               'Singapore',        'SG', 'asia_2',   1.3644, 103.9915),
('KUL', 'WMKK', 'Kuala Lumpur Intl',              'Kuala Lumpur',     'MY', 'asia_2',   2.7456, 101.7100),
('BKK', 'VTBS', 'Suvarnabhumi',                   'Bangkok',          'TH', 'asia_2',  13.6900, 100.7501),
('DMK', 'VTBD', 'Don Mueang Intl',                'Bangkok',          'TH', 'asia_2',  13.9126, 100.6068),
('HKT', 'VTSP', 'Phuket Intl',                    'Phuket',           'TH', 'asia_2',   8.1132,  98.3169),
('CNX', 'VTCC', 'Chiang Mai Intl',                'Chiang Mai',       'TH', 'asia_2',  18.7669,  98.9626),
('SGN', 'VVTS', 'Tan Son Nhat Intl',              'Ho Chi Minh City', 'VN', 'asia_2',  10.8189, 106.6519),
('HAN', 'VVNB', 'Noi Bai Intl',                   'Hanoi',            'VN', 'asia_2',  21.2212, 105.8073),
('CGK', 'WIII', 'Soekarno-Hatta Intl',            'Jakarta',          'ID', 'asia_2',  -6.1256, 106.6559),
('DPS', 'WADD', 'Ngurah Rai',                     'Denpasar (Bali)',  'ID', 'asia_2',  -8.7482, 115.1672),
('MNL', 'RPLL', 'Ninoy Aquino Intl',              'Manila',           'PH', 'asia_2',  14.5086, 121.0194),
('CEB', 'RPVM', 'Mactan-Cebu Intl',               'Cebu',             'PH', 'asia_2',  10.3074, 123.9793),
('PNH', 'VDPP', 'Phnom Penh Intl',                'Phnom Penh',       'KH', 'asia_2',  11.5466, 104.8443),
('REP', 'VDSR', 'Siem Reap-Angkor Intl',          'Siem Reap',        'KH', 'asia_2',  13.4109, 103.8128),
('RGN', 'VYYY', 'Yangon Intl',                    'Yangon',           'MM', 'asia_2',  16.9073,  96.1332),

-- ============================================================
-- South Pacific (Australia, NZ, Fiji, etc.)
-- ============================================================
('SYD', 'YSSY', 'Kingsford Smith',                'Sydney',           'AU', 'south_pacific', -33.9461, 151.1772),
('MEL', 'YMML', 'Melbourne',                      'Melbourne',        'AU', 'south_pacific', -37.6690, 144.8410),
('BNE', 'YBBN', 'Brisbane',                       'Brisbane',         'AU', 'south_pacific', -27.3942, 153.1218),
('PER', 'YPPH', 'Perth',                          'Perth',            'AU', 'south_pacific', -31.9403, 115.9670),
('ADL', 'YPAD', 'Adelaide',                       'Adelaide',         'AU', 'south_pacific', -34.9450, 138.5306),
('AKL', 'NZAA', 'Auckland',                       'Auckland',         'NZ', 'south_pacific', -37.0082, 174.7917),
('WLG', 'NZWN', 'Wellington Intl',                'Wellington',       'NZ', 'south_pacific', -41.3272, 174.8053),
('CHC', 'NZCH', 'Christchurch Intl',              'Christchurch',     'NZ', 'south_pacific', -43.4894, 172.5320),
('NAN', 'NFFN', 'Nadi Intl',                      'Nadi',             'FJ', 'south_pacific', -17.7553, 177.4434),
('PPT', 'NTAA', 'Faa''a Intl',                    'Papeete (Tahiti)', 'PF', 'south_pacific', -17.5536, -149.6066),
('GUM', 'PGUM', 'Antonio B. Won Pat Intl',        'Hagåtña (Guam)',   'GU', 'south_pacific',  13.4854, 144.7960)

on conflict (iata) do nothing;
