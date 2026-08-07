-- Expand sweepstakes_sources after the 2026-08-07 verification pass.
--
-- The American AAdvantage "Perks" program runs a NETWORK of team microsites
-- (<team>perks.com) that each host real AAdvantage member sweepstakes - many
-- giving away 100,000 AAdvantage miles (pure points, exactly the Wyndham-style
-- giveaway that performs best on social). aa.com itself is Firecrawl-blocked, so
-- these microsites ARE the American source. All URLs below were verified live +
-- scrapable on 2026-08-07 (Firecrawl+Haiku returned real dated sweeps).
--
-- Also: swap the Wyndham source to its durable first-party travel-sweepstakes
-- page, and add Delta SkyMiles Experiences (SkyMiles member sweeps/Group Drops).
--
-- Deliberately NOT added (documented so we don't re-litigate):
--   * Marriott Bonvoy Moments - page is ~176k chars; the scraper's window can't
--     reliably reach the sweeps, so it would mostly miss. Revisit if we add
--     per-source content windows.
--   * World of Hyatt, Amex/Chase/Capital One - could not verify they run their
--     OWN member points sweepstakes (only bonus-point promos / partner sweeps).
--   * Aggregator catch-alls (Sweeps Advantage) - high-yield but low-precision
--     (they list third-party travel giveaways, not just loyalty-program sweeps);
--     needs a program-filter before we wire it in. Left as a product decision.

INSERT INTO sweepstakes_sources (program, url, notes) VALUES
  -- American AAdvantage "Perks" team microsites (network; each has own end dates)
  ('Cowboys Perks (AAdvantage)',      'https://www.cowboysperks.com/',      'AAdvantage x Dallas Cowboys - 100k-mile sweeps verified live 2026-08-07'),
  ('Rangers Perks (AAdvantage)',      'https://www.rangersperks.com/',      'AAdvantage x Texas Rangers - 100k-mile + first pitch verified live'),
  ('Eagles Perks (AAdvantage)',       'https://www.eaglesperks.com/',       'AAdvantage x Philadelphia Eagles - first-class flyaways verified live'),
  ('Chargers Perks (AAdvantage)',     'https://www.chargersperks.com/',     'AAdvantage x LA Chargers - verified live'),
  ('Panthers Perks (AAdvantage)',     'https://www.panthersperks.com/',     'AAdvantage x Carolina Panthers - 100k-mile sweeps verified live'),
  ('Rams Perks (AAdvantage)',         'https://www.ramsperks.com/',         'AAdvantage x LA Rams - 100k-mile + flyaways verified live'),
  ('Charlotte FC Perks (AAdvantage)', 'https://www.charlottefcperks.com/',  'AAdvantage x Charlotte FC - 100k-mile sweeps verified live'),
  ('US Soccer Perks (AAdvantage)',    'https://www.ussoccerperks.com/',     'AAdvantage x U.S. Soccer - USWNT/USMNT flyaways verified live'),
  ('Longhorns Perks (AAdvantage)',    'https://www.longhornsperks.com/',    'AAdvantage x Texas Longhorns - 100k-mile sweeps verified live'),
  ('Mavs Perks (AAdvantage)',         'https://www.mavsperks.com/',         'AAdvantage x Dallas Mavericks - scrapable, cycles (empty between sweeps)'),
  ('Cubs Perks (AAdvantage)',         'https://www.cubsperks.com/',         'AAdvantage x Chicago Cubs - scrapable, cycles (empty between sweeps)'),
  -- Delta SkyMiles member sweeps / Group Drops (durable first-party)
  ('Delta SkyMiles Experiences',      'https://www.skymilesexperiences.com/', 'SkyMiles member sweeps / Group Drops - durable first-party')
ON CONFLICT (url) DO NOTHING;

-- Swap Wyndham to its durable, first-party sweepstakes page (the /promotions page
-- carries bonus-point offers, not the sweepstakes). Keep it active.
UPDATE sweepstakes_sources
   SET url   = 'https://www.wyndhamhotels.com/wyndham-rewards/hotel-deals/travel-sweepstakes',
       notes = 'Wyndham Rewards durable travel-sweepstakes page (first-party; recurring member sweeps)'
 WHERE url = 'https://www.wyndhamrewards.com/promotions';
