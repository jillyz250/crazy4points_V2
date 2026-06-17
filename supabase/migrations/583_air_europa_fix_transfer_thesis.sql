-- MAJOR CORRECTION caught in the batch confidence audit. The page wrongly claimed SUMA transfers
-- 1:1 from Amex, Capital One, Bilt, Citi, and Wells Fargo ("the most US-accessible program").
-- That was based on a bad cheat sheet that conflated Air Europa with Flying Blue. The truth:
--   - US Amex does NOT transfer to SUMA (Air Europa is an Amex partner only for SPANISH-issued cards)
--   - Citi, Capital One, Bilt, Wells Fargo, Chase: NONE transfer to SUMA
-- Verified via per-issuer transfer-partner lists (Bilt support, WF list, Citi list, Capital One list,
-- Amex partner page + FlyerTalk on Spanish-only Amex). Air Europa is actually a LIMITED-access
-- SkyTeam program like SAS/China Eastern. The US route is booking Air Europa metal via Flying Blue
-- (which all major US cards transfer to). Official tier/miles/lounge data was correct and is unchanged.

update programs set
  transfer_partners = '[]'::jsonb,

  intro = 'Air Europa SUMA is the loyalty program of Air Europa, a Spanish SkyTeam carrier hubbed in Madrid. Miles redeem across the SkyTeam network -- Air Europa, Delta, Air France, KLM, Korean Air and others -- and SUMA is notable for low redemption floors, with some partner flights starting from about 1,500 SUMA Miles and SkyTeam awards from around 6,000.

The catch for US travelers is funding the program. No US bank currency transfers to SUMA: Air Europa is an American Express transfer partner only for Spanish-issued Amex cards, and Chase, Citi, Capital One, Bilt, and Wells Fargo do not transfer to it at all. The practical US angle is the reverse -- book Air Europa flights using a more accessible SkyTeam currency such as Flying Blue (Air France-KLM), which every major US card transfers to. SUMA itself earns its keep for travelers already flying Air Europa, who benefit from its low award floors and Madrid-hub SkyTeam connections, and you can always buy SUMA Miles outright (often with a bonus) if you have a specific redemption in mind.',

  how_to_spend = '- **SkyTeam award flights (low floors)**: Redeem SUMA Miles across SkyTeam -- Air Europa, Delta, Air France, KLM, Korean Air and others. Some partner flights start from about 1,500 SUMA Miles, and SkyTeam awards from around 6,000 -- low entry points for short-haul redemptions, if you have SUMA Miles to spend.
- **Air Europa business class to Latin America and Europe**: Air Europa''s own long-haul business product (Madrid to South America, and transatlantic to the US) is a common premium-cabin target.
- **Upgrades, hotels, and car rental**: SUMA Miles can be used toward upgrades and a range of hotel, car rental, and partner redemptions, which generally return less value than premium-cabin flights.',

  sweet_spots = '- **For US flyers, book Air Europa via Flying Blue**: Because no US bank currency transfers to SUMA, the practical way to fly Air Europa on points is to transfer to Flying Blue (Air France-KLM) -- a partner of every major US card -- and book Air Europa as a SkyTeam partner award. That sidesteps SUMA''s funding problem entirely.
- **Low redemption floors if you hold SUMA Miles**: Some partner awards start around 1,500 SUMA Miles and SkyTeam redemptions from about 6,000 -- genuinely useful for cheap short hops, but mainly for travelers who earn SUMA Miles by flying Air Europa.
- **Buy-miles bonuses are an accessible on-ramp**: Anyone can buy SUMA Miles with cash, and Air Europa frequently sells them with large bonuses (up to around 50% in recent promotions). With a specific redemption in mind, buying can occasionally be worthwhile -- one of the few US-accessible ways into the program.
- **Reality check**: SUMA has no US bank transfer access, so it behaves like other non-US SkyTeam programs -- best for people already flying Air Europa. US collectors are usually better off booking Air Europa metal through Flying Blue than trying to build a SUMA balance.',

  quirks = '- **No US bank transfer access**: US American Express, Chase, Citi, Capital One, Bilt, and Wells Fargo do not transfer to SUMA. Air Europa is an Amex transfer partner only for Spanish-issued Amex cards -- a common point of confusion, since some cheat sheets list "Amex" without the geographic caveat.
- **The US workaround**: To fly Air Europa on points, transfer to Flying Blue (Air France-KLM) -- which every major US card transfers to -- and book Air Europa as a SkyTeam partner award. You can also buy SUMA Miles outright, often with a bonus.
- **Two mile types**: SUMA Miles are the spendable currency, valid 24 months from earning; Tier Miles determine status and expire after 12 months. Tier Miles are not redeemable.
- **Four-flight requirement for status**: Reaching Silver, Gold, or Platinum requires hitting the Tier Mile (or flight-count) threshold and taking at least 4 flights on Air Europa within the period.
- **Low redemption floors**: Some partner awards start around 1,500 SUMA Miles and SkyTeam redemptions from about 6,000 -- useful for cheap short-haul if you have miles.
- **Buy-miles bonuses are common**: Air Europa frequently sells SUMA Miles with large bonuses (up to around 50% in recent promotions); occasionally worthwhile, but only buy with a redemption planned.',

  award_chart = 'Air Europa SUMA prices awards through its own redemption structure rather than a single fixed public chart, varying by route, cabin, and partner. Verify the cost for a specific route at aireuropa.com before committing.

**Redemption floors (official):** Some partner flights start from about 1,500 SUMA Miles; SkyTeam award flights start from around 6,000 SUMA Miles -- low entry points that make SUMA useful for short-haul redemptions. Air Europa''s own long-haul business class (Madrid to Latin America, and transatlantic) is the standout premium target.

**Earning:** On Air Europa flights you earn SUMA Miles for every euro spent, scaled by cabin and your SUMA level. SUMA Miles (the spendable currency) are valid 24 months; Tier Miles (status) expire after 12 months.

**Getting miles as a US traveler:** No US bank currency transfers to SUMA -- Air Europa''s Amex partnership is for Spanish-issued cards only. You can buy SUMA Miles outright (often with a bonus), or, more practically, book Air Europa flights via Flying Blue (Air France-KLM), which all major US cards transfer to, rather than building a SUMA balance directly.',

  updated_at = now()
where slug = 'air-europa';
