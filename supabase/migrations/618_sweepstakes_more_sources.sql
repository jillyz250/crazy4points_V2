-- Broaden sweepstakes coverage beyond AA + Delta (research pass 2026-08-10).
--
-- Findings: the big programs run sweeps in BURSTS, not continuously. Right now
-- United has nothing live (its Shopping-sweeps page is JS-gated + between
-- editions), but there are stable recurring URLs + airline NEWSROOMS that
-- announce member sweeps first (Frontier's is especially active). Newsrooms are
-- seeded as 'aggregator' so the loyalty-program filter keeps only the actual
-- sweep announcements and drops the rest of the press feed.

INSERT INTO sweepstakes_sources (program, url, kind, notes) VALUES
  ('United MileagePlus Shopping',   'https://shopping.mileageplus.com/sweeps____.htm', 'program',    'Recurring MileagePlus Shopping sweeps (100k miles + cash). JS-rendered; Firecrawl waitFor handles it. Nothing live as of 2026-08-10.'),
  ('United MileagePlus (newsroom)', 'https://news.united.com/',                        'aggregator', 'United newsroom - catches member sweep announcements (co-promos land here first).'),
  ('Frontier Miles (newsroom)',     'https://news.flyfrontier.com/',                   'aggregator', 'Frontier newsroom - HIGH-YIELD (Miles Millionaire 1M-mile sweeps etc.).'),
  ('JetBlue TrueBlue (newsroom)',   'https://news.jetblue.com/latest-news',            'aggregator', 'JetBlue newsroom - TrueBlue member sweeps announced here.'),
  ('Hilton Grand Vacations Sweepstakes', 'https://hgvsweepstakesamoe.com/',            'program',    'HGV AMOE sweeps - up to 2,000,000 Honors points + monthly winners; appears live 2026-08.'),
  ('AwardWallet Hotel Promotions',  'https://awardwallet.com/news/hotels/current-hotel-promotions/', 'aggregator', 'Structured hotel-program promo tracker; loyalty filter keeps the sweeps-entry ones.')
ON CONFLICT (url) DO NOTHING;
