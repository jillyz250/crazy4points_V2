-- Sweep cleanup of the sources table:
--   1. Deactivate redundant or broken rows
--   2. Add "Programs: <slug>" tags to every program-specific source (newsrooms,
--      marketing pages, subreddits) so Scout's program-tagging links alerts
--      to the right /programs/[slug] page
--   3. Fix mismatched / underscore-slug notes
--
-- Aggregator blogs (TPG, OMAAT, Frequent Miler, AwardWallet, Doctor of Credit,
-- BoardingArea, View From The Wing, Upgraded Points, Live and Let's Fly,
-- LoyaltyLobby, Miles Talk, Prince of Travel, GodSaveThePoints, etc.) cover
-- ALL programs by design and are intentionally NOT tagged - Scout's per-alert
-- tagging logic infers program from content, not from source.
--
-- Slug convention reference (per feedback_program_slug_convention): kebab-case.
-- Currently-seeded slugs touched here: alaska, hawaiian, atmos, aa, delta,
-- united, jetblue, southwest, klm, hyatt, marriott-bonvoy,
-- amex-membership-rewards, chase-ultimate-rewards, capital-one, citi-thankyou.
-- Slugs NOT yet seeded but tagged for future authoring: air-canada, british-
-- airways, hilton-honors, ihg-one-rewards, flying-blue.

-- ============================================================
-- 1. Deactivate redundant / broken / obsolete rows
-- ============================================================

-- Marriott `/loyalty/marriott-bonvoy.mi` is a weekly-cadence official_partner
-- row that overlaps `/loyalty/` (daily, same surface). Newsroom feed at
-- news.marriott.com (added in the Marriott authoring session) covers fresh
-- headlines; `/loyalty/` covers transfer-bonus / promo announcements.
-- This row burns Firecrawl credits without unique signal.
update sources set is_active = false,
  notes = coalesce(notes || ' | ', '') || 'Deactivated 2026-05-05: redundant with /loyalty/ daily and news.marriott.com.'
where url = 'https://www.marriott.com/loyalty/marriott-bonvoy.mi';

-- world.of.hyatt.com is a typo / non-canonical URL. Real domain is world.hyatt.com.
update sources set is_active = false,
  notes = coalesce(notes || ' | ', '') || 'Deactivated 2026-05-05: typo URL (correct domain is world.hyatt.com).'
where url = 'https://world.of.hyatt.com';

-- Alaska Mileage Plan was replaced by Atmos Rewards in 2025. URL likely 404s
-- or redirects. The atmos / alaska / hawaiian newsrooms cover the program;
-- this marketing-page row is obsolete.
update sources set is_active = false,
  notes = coalesce(notes || ' | ', '') || 'Deactivated 2026-05-05: Mileage Plan replaced by Atmos Rewards 2025.'
where url = 'https://www.alaskaair.com/content/mileage-plan';

-- ============================================================
-- 2. Add Programs: <slug> tags to program-specific sources
-- ============================================================

-- Alaska + Hawaiian + Atmos joint program (per project_carrier_vs_loyalty_program_split)
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: alaska,hawaiian,atmos'
where url in (
  'https://news.alaskaair.com/',
  'https://news.alaskaair.com/feed/'
) and (notes is null or notes !~ 'Programs:');

-- KLM newsroom — fix the mis-pasted "AF corporate press room" note on the RSS row,
-- and replace underscore slug `flying_blue` with kebab `flying-blue` everywhere
update sources set notes = 'KLM corporate newsroom RSS. Programs: klm,flying-blue.'
where url = 'https://news.klm.com/rss-feed-en/';

update sources set notes = 'KLM corporate newsroom (HTML, JS-rendered). Programs: klm,flying-blue.'
where url = 'https://news.klm.com/' and (notes is null or notes !~ 'Programs:');

-- Existing rows that mention `flying_blue` (underscore) get migrated to kebab `flying-blue`
update sources set notes = replace(notes, 'flying_blue', 'flying-blue')
where notes is not null and notes ~ 'flying_blue';

-- Hyatt
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: hyatt'
where url in (
  'https://newsroom.hyatt.com/awardchartupdates',
  'https://newsroom.hyatt.com/news-releases?pagetemplate=rss',
  'https://world.hyatt.com/'
) and (notes is null or notes !~ 'Programs:');

-- AA marketing pages (newsroom feed already tagged per mig 080+)
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: aa'
where url in (
  'https://www.aa.com/aadvantage/',
  'https://www.aa.com/aadvantageoverview'
) and (notes is null or notes !~ 'Programs:');

-- Air Canada Aeroplan (slug not yet seeded; tag for future)
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: air-canada'
where url = 'https://www.aircanada.com/us/en/aco/home/aeroplan.html'
  and (notes is null or notes !~ 'Programs:');

-- Amex Membership Rewards
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: amex-membership-rewards'
where url = 'https://www.americanexpress.com/en-us/rewards/membership-rewards/'
  and (notes is null or notes !~ 'Programs:');

-- British Airways (slug not yet seeded; tag for future)
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: british-airways'
where url = 'https://www.britishairways.com/en-us/executive-club'
  and (notes is null or notes !~ 'Programs:');

-- Capital One
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: capital-one'
where url in (
  'https://www.capitalone.com/credit-cards/rewards/',
  'https://www.capitalone.com/credit-cards/rewards/miles/'
) and (notes is null or notes !~ 'Programs:');

-- Citi ThankYou
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: citi-thankyou'
where url = 'https://www.citi.com/credit-cards/thankyou-rewards'
  and (notes is null or notes !~ 'Programs:');

-- Delta
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: delta'
where url = 'https://www.delta.com/us/en/skymiles/overview'
  and (notes is null or notes !~ 'Programs:');

-- Chase Ultimate Rewards (two marketing surfaces)
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: chase-ultimate-rewards'
where url in (
  'https://creditcards.chase.com/rewards-credit-cards/points',
  'https://creditcards.chase.com/travel-credit-cards'
) and (notes is null or notes !~ 'Programs:');

-- Marriott Bonvoy — append to /loyalty/ note (already has "Marriott points + transfer promos")
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: marriott-bonvoy'
where url = 'https://www.marriott.com/loyalty/'
  and (notes is null or notes !~ 'Programs:');

-- Subreddits — program-specific community signal
update sources set notes = coalesce(notes || ' | ', '') || 'Programs: marriott-bonvoy'
where url = 'https://www.reddit.com/r/marriott/'
  and (notes is null or notes !~ 'Programs:');

update sources set notes = coalesce(notes || ' | ', '') || 'Programs: hyatt'
where url = 'https://www.reddit.com/r/hyatt/'
  and (notes is null or notes !~ 'Programs:');

update sources set notes = coalesce(notes || ' | ', '') || 'Programs: hilton-honors'
where url = 'https://www.reddit.com/r/hilton/'
  and (notes is null or notes !~ 'Programs:');
