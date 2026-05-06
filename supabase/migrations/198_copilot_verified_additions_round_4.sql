-- Verified-additions round 4 (final batch of backfill Copilot fact sheets):
-- atmos, hyatt, oneworld, skyteam, star_alliance, ba-avios.
--
-- Each claim WebSearch-verified against official + reputable sources before
-- applying. Two Copilot claims corrected mid-flight:
--   - Skyteam doc said ITA "exited Feb 3, 2025"; that was the announcement
--     date. Actual exit was April 30, 2025 (per skyteam.com press release).
--     Fixed in the bullet below.
--   - Skyteam doc gave member count as 18 active in section 2 but 19 in
--     section 9; we use 18 active (Aeroflot suspended since 2022).
--
-- Sources verified:
--   atmos: thepointsguy + frequentmiler + dailydrop + milesmate + alaskaair
--     news (Choose Your Earn launches later 2026; distance/revenue/segment;
--     switchable once per calendar year; defaults to revenue)
--   hyatt: newsroom.hyatt.com/awardchartupdates + nerdwallet + onemileatatime
--     (5-tier chart May 20, 2026: Lowest/Low/Moderate/Upper/Top; 136 hotels
--     shifting in 2026 - 112 up, 24 down; Cat 8 top reaches 75K up to +67%;
--     low end -8 to -14%)
--   oneworld: oneworld.com + alaska news + executive traveller (Hawaiian
--     joined April 22, 2026 as 16th member; Oman Air June 30, 2025; Fiji
--     Airways April 1, 2025)
--   skyteam: skyteam.com press releases + theflightclub + loyaltylobby (SAS
--     joined Sept 1, 2024; ITA announced exit Feb 3, 2025 / officially
--     exited April 30, 2025; Volare loyalty ended March 30, 2026)
--   star_alliance: loyaltylobby + onemileatatime + business traveller +
--     roamingcactus (ITA joined April 1, 2026 as 26th member; Volare ended
--     March 30, 2026; not-auto-transferred to Miles & More per Italian law)
--   ba-avios: awardwallet + simpleflying + onemileatatime + business
--     traveller (Executive Club rebranded to "The British Airways Club"
--     April 1, 2025; revenue-based Tier Points 1 TP per GBP 1 eligible
--     spend; thresholds Bronze 3,500 / Silver 7,500 / Gold 20,000 / GGL
--     65,000)

-- ============================================================
-- HYATT - 5-tier award chart structural change
-- ============================================================
update programs set
  quirks = quirks || '
- **5-tier award chart launches May 20, 2026.** The 3-tier model (Off-Peak / Standard / Peak) becomes 5 tiers: **Lowest / Low / Moderate / Upper / Top**. The Top tier on Cat 8 properties reaches 75,000 points/night - up to +67% from the prior 45K Cat 8 peak. The Lowest tier on Cat 1-3 properties drops 500-1,000 points/night versus prior off-peak. Net effect skews price hikes, especially at the high end.
- **136 hotels shift category in 2026** alongside the chart change: 112 properties move up, 24 move down. About 90% of the portfolio is unchanged this year. The new 5-tier framework adds capacity for Hyatt to surface Upper / Top pricing on demand peaks without broad future category resets.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'hyatt';

-- ============================================================
-- ONEWORLD - lock in Hawaiian / Oman Air / Fiji join dates + member count
-- ============================================================
update programs set
  quirks = quirks || '
- **Hawaiian Airlines joined oneworld April 22, 2026** as the alliance''s 16th member - third US-based oneworld carrier alongside American and Alaska. Hawaiian uses Atmos Rewards as its loyalty program (the Alaska / Hawaiian merged currency).
- **Oman Air joined oneworld June 30, 2025**; **Fiji Airways promoted from oneworld Connect to full member April 1, 2025**. Brought current oneworld membership to 16 active carriers.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'oneworld';

-- ============================================================
-- SKYTEAM - SAS joined / ITA exited / Volare ended
-- ============================================================
update programs set
  quirks = quirks || '
- **SAS joined SkyTeam September 1, 2024**, after ~30 years as a Star Alliance founding member. Reciprocal earning, redemption, and elite recognition between SAS and SkyTeam carriers (Delta, Air France-KLM, Korean Air, etc.) became active that day.
- **ITA Airways announced its SkyTeam exit February 3, 2025**, officially exited April 30, 2025, and joined Star Alliance on April 1, 2026. ITA''s Volare loyalty program ended March 30, 2026 - balances did NOT auto-transfer to Miles & More (Italian law restriction); affected Volare members got a complimentary Miles & More status match through February 28, 2027.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'skyteam';

-- ============================================================
-- STAR ALLIANCE - ITA officially joined as 26th member April 1, 2026
-- ============================================================
update programs set
  quirks = quirks || '
- **ITA Airways officially joined Star Alliance April 1, 2026** as the alliance''s 26th member. ITA''s prior Volare loyalty program closed March 30, 2026; ITA now uses Miles & More. Existing Volare balances did NOT auto-transfer (Italian law restriction); Miles & More extended a complimentary status match for affected Volare members through February 28, 2027.
- **SAS departed Star Alliance August 31, 2024** (founding member since 1997) and joined SkyTeam September 1, 2024. Star Alliance lost SAS''s Scandinavian network footprint to SkyTeam in the same window it gained ITA via Lufthansa Group integration.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'star_alliance';

-- ============================================================
-- BA-AVIOS - Executive Club rebrand + revenue-based Tier Points
-- ============================================================
update programs set
  quirks = quirks || '
- **Executive Club rebranded to "The British Airways Club" April 1, 2025.** Same loyalty program; new branding alongside a structural Tier Points overhaul.
- **Tier Points became revenue-based April 1, 2025.** Earning shifted from fare-class + distance to **1 Tier Point per GBP 1 of eligible spend** (fare + carrier-imposed surcharges + ancillaries like seat selection / excess baggage / Holidays packages). New thresholds: Bronze 3,500 TP, Silver 7,500 TP, Gold 20,000 TP, Gold Guest List (GGL) 65,000 TP first-time / 40,000 TP renewal.
- **BA Amex cards earn TPs from spend (UK product)**: up to 2,500 TP per year via the British Airways American Express Premium Plus on UK-issued Amex - unusual non-flight TP path. Sustainable Aviation Fuel contributions also earn up to 1,000 TP/year.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ba-avios';

-- ============================================================
-- ATMOS - Choose Your Earn launching 2026
-- ============================================================
update programs set
  quirks = quirks || '
- **Choose Your Earn launching later in 2026.** Members will pick how to earn both points and status credit from three options: **distance** (1 status point per 1 mile flown), **revenue** (5 status points per $1 spent on flights), or **segment** (500 status points per segment). One change per calendar year; revenue is the default if no choice is made. Reproduced as an industry-first by multiple sources (TPG, Frequent Miler, AwardFares).',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'atmos';
