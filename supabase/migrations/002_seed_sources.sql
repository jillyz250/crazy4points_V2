-- Seed sources for Claude Scout
insert into sources (name, url, type, tier, is_active, scrape_frequency, notes) values

-- Tier 1: Official program pages
('Chase Ultimate Rewards',    'https://creditcards.chase.com/travel-credit-cards',               'official_partner', 1, true,  'daily',  'Chase UR transfer partners + promos'),
('American Express MR',       'https://www.americanexpress.com/en-us/rewards/membership-rewards/', 'official_partner', 1, true,  'daily',  'Amex MR transfer partners + promos'),
('Citi ThankYou',             'https://www.citi.com/credit-cards/thankyou-rewards',               'official_partner', 1, true,  'daily',  'Citi TYP transfer partners + promos'),
('Capital One Miles',         'https://www.capitalone.com/credit-cards/rewards/miles/',           'official_partner', 1, true,  'daily',  'Capital One transfer partners'),
('World of Hyatt',            'https://world.hyatt.com/',                                         'official_partner', 1, true,  'daily',  'Hyatt award + promo news'),
('AA AAdvantage',             'https://www.aa.com/aadvantage/',                                   'official_partner', 1, true,  'daily',  'American Airlines miles program'),
('United MileagePlus',        'https://www.united.com/en/us/fly/mileageplus.html',                'official_partner', 1, true,  'daily',  'United miles program'),
('Delta SkyMiles',            'https://www.delta.com/us/en/skymiles/overview',                    'official_partner', 1, true,  'daily',  'Delta miles program'),
('Marriott Bonvoy',           'https://www.marriott.com/loyalty/',                               'official_partner', 1, true,  'daily',  'Marriott points + transfer promos'),

-- Tier 2: Blog RSS feeds
('The Points Guy',            'https://thepointsguy.com/feed/',         'blog', 2, true,  'daily',  'RSS feed'),
('Doctor of Credit',          'https://www.doctorofcredit.com/feed/',   'blog', 2, true,  'daily',  'RSS feed — best for data points + DPs'),
('Frequent Miler',            'https://frequentmiler.com/feed/',        'blog', 2, true,  'daily',  'RSS feed'),
('One Mile at a Time',        'https://onemileatatime.com/feed/',       'blog', 2, true,  'daily',  'RSS feed'),
('View from the Wing',        'https://viewfromthewing.com/feed/',      'blog', 2, true,  'daily',  'RSS feed'),

-- Tier 3: Reddit communities
('r/churning',       'https://www.reddit.com/r/churning/',       'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/awardtravel',    'https://www.reddit.com/r/awardtravel/',    'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/frequentflyers', 'https://www.reddit.com/r/frequentflyers/', 'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/amex',           'https://www.reddit.com/r/amex/',           'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/creditcards',    'https://www.reddit.com/r/creditcards/',    'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/hyatt',          'https://www.reddit.com/r/hyatt/',          'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/marriott',       'https://www.reddit.com/r/marriott/',       'community', 3, true,  'daily',  'Top 25 posts, last 24–48h'),
('r/hilton',         'https://www.reddit.com/r/hilton/',         'community', 3, true,  'daily',  'Top 25 posts, last 24–48h')

on conflict do nothing;
