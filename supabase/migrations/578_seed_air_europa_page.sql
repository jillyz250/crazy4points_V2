-- Seed Air Europa SUMA program page at /programs/air-europa (SkyTeam, Madrid).
-- Sourced from official aireuropa.com SUMA pages (main, cards-and-benefits, miles, partners) scraped
-- via Firecrawl 2026-06-17, plus 2026 WebSearch for transfer partners. Lean style.
-- STANDOUT: transfers 1:1 from Amex, Capital One, Bilt, Citi, AND Wells Fargo (every major US
-- transferable currency except Chase) -- the most US-accessible of the airline batch.
-- Amex -> Air Europa carries NO excise tax (Spanish/non-US carrier; the fee hits only Delta/JetBlue).

update programs set
  alliance = 'skyteam',
  hubs = '{MAD}',

  intro = 'Air Europa SUMA is the loyalty program of Air Europa, a Spanish SkyTeam carrier hubbed in Madrid. Among non-US frequent-flyer programs it is unusually easy for US travelers to fund: SUMA Miles transfer in at 1:1 from American Express, Capital One, Bilt, Citi, and Wells Fargo -- every major US transferable currency except Chase. That broad accessibility, combined with low redemption floors, is what makes SUMA worth knowing.

The program uses two mile types: SUMA Miles, the spendable currency (valid 24 months), and Tier Miles, which drive status over a 12-month period. Miles redeem across the SkyTeam network -- Air Europa, Delta, Air France, KLM, Korean Air and others -- with some partner flights starting from just 1,500 SUMA Miles and SkyTeam awards from around 6,000. Madrid makes a natural SkyTeam gateway between the Americas and Europe, and Air Europa''s own business class to Latin America is a common target. As a Spanish carrier, Air Europa awards also avoid the Amex federal excise tax that applies to US airlines.',

  transfer_partners = '[
    {"from_slug": "amex", "ratio": "1:1", "notes": "Amex Membership Rewards transfers to SUMA at 1:1 with no transfer fee -- as a Spanish (non-US) carrier, Air Europa is exempt from the Amex federal excise tax. Transfers are typically fast."},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "Capital One Miles transfer to SUMA at 1:1 with no fee."},
    {"from_slug": "citi", "ratio": "1:1", "notes": "Citi ThankYou transfers to SUMA at 1:1 with no fee."},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "Bilt Rewards transfer to SUMA at 1:1 with no fee."},
    {"from_slug": "wells-fargo", "ratio": "1:1", "notes": "Wells Fargo Rewards transfer to SUMA at 1:1 with no fee."}
  ]'::jsonb,

  how_to_spend = '- **SkyTeam award flights (low floors)**: Redeem SUMA Miles across SkyTeam -- Air Europa, Delta, Air France, KLM, Korean Air and others. Some partner flights start from about 1,500 SUMA Miles, and SkyTeam awards from around 6,000 -- low entry points for short-haul redemptions.
- **Air Europa business class to Latin America and Europe**: Air Europa''s own long-haul business product (Madrid to South America, and transatlantic to the US) is a common premium-cabin target.
- **Upgrades, hotels, and car rental**: SUMA Miles can be used toward upgrades and a range of hotel, car rental, and partner redemptions, which generally return less value than premium-cabin flights.',

  sweet_spots = '- **The broadest US transferability of any SkyTeam program**: SUMA accepts 1:1 transfers from Amex, Capital One, Bilt, Citi, and Wells Fargo -- five of the six major US currencies (only Chase is missing). That makes it one of the easiest non-US programs to fund from a US points stash, and a flexible SkyTeam booking tool.
- **Cheap short-haul partner redemptions**: With some partner awards starting around 1,500 SUMA Miles and SkyTeam redemptions from about 6,000, SUMA is useful for low-cost short hops where cash fares run high.
- **Madrid as a SkyTeam gateway**: Air Europa''s Madrid hub connects the Americas and Europe, and its own business class to Latin America is a recurring value target for transferred miles.
- **Frequent buy-miles bonuses**: Air Europa regularly sells SUMA Miles with large bonuses (recent promotions up to around 50%), which can occasionally beat transferring -- but only with a specific redemption in mind.
- **No Amex excise tax**: Because Air Europa is a Spanish carrier, Amex transfers avoid the federal excise tax that applies to US airlines like Delta and JetBlue -- a small but real edge over transferring to a US SkyTeam program.',

  tier_benefits = '[
    {
      "name": "Suma",
      "qualification": "Base level on joining (free); no tier requirement",
      "benefits": [
        "Earn SUMA Miles (spendable, valid 24 months) and Tier Miles (status, 12-month period) on Air Europa and SkyTeam flights and partners",
        "Redeem SUMA Miles across the SkyTeam network and partners",
        "10% discount on seat selection"
      ]
    },
    {
      "name": "Suma Silver",
      "qualification": "18,000 Tier Miles or 14 flights in 12 months (minimum 4 on Air Europa); maps to SkyTeam Elite",
      "benefits": [
        "SkyTeam Elite recognition",
        "One additional hold baggage allowance",
        "20% discount on XL seats, and standard seats free when reserved within 48 hours of departure",
        "Priority benefits on eligible flights"
      ]
    },
    {
      "name": "Suma Gold",
      "qualification": "32,000 Tier Miles or 26 flights in 12 months (minimum 4 on Air Europa); maps to SkyTeam Elite Plus",
      "benefits": [
        "All Silver benefits",
        "SkyTeam Elite Plus recognition -- lounge access, priority check-in/boarding, and extra baggage across the alliance",
        "Free reservation of all seat types",
        "Lounge access on international or same-day connecting SkyTeam flights, with a companion"
      ]
    },
    {
      "name": "Suma Platinum",
      "qualification": "60,000 Tier Miles or 50 flights in 12 months (minimum 4 on Air Europa); maps to SkyTeam Elite Plus",
      "benefits": [
        "All Gold benefits",
        "SkyTeam Elite Plus recognition",
        "Free reservation of all seat types",
        "Two intercontinental Business Class upgrades during the card validity (request up to 24 hours before the flight, subject to space)",
        "Complimentary checked sports equipment on request"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Air Europa SUMA lounge access is delivered through SkyTeam recognition:

- **Gold and Platinum (SkyTeam Elite Plus)** receive lounge access on international flights, or same-day connecting flights to/from an international flight, operated by Air Europa or any SkyTeam carrier -- and may bring a companion travelling on an alliance flight.
- **Silver (SkyTeam Elite)** does not include general lounge access.

Eligibility follows standard SkyTeam rules. Air Europa operates its own lounge at Madrid and uses partner lounges elsewhere across the SkyTeam network.',

  quirks = '- **The most US-accessible program in the airline set**: SUMA Miles transfer in at 1:1 from Amex, Capital One, Bilt, Citi, and Wells Fargo -- only Chase is absent. This is what sets Air Europa apart from SAS, China Eastern, and most other non-US SkyTeam programs.
- **No Amex excise tax**: Air Europa is a Spanish (non-US) carrier, so Amex transfers avoid the federal excise tax recovery fee that applies to US airlines (Delta, JetBlue).
- **Two mile types**: SUMA Miles are the spendable currency, valid 24 months from earning; Tier Miles determine status and expire after 12 months. Tier Miles are not redeemable.
- **Four-flight requirement for status**: Reaching Silver, Gold, or Platinum requires hitting the Tier Mile (or flight-count) threshold and taking at least 4 flights on Air Europa within the period.
- **Low redemption floors**: Some partner awards start around 1,500 SUMA Miles and SkyTeam redemptions from about 6,000 -- useful for cheap short-haul.
- **Buy-miles bonuses are common**: Air Europa frequently sells SUMA Miles with large bonuses (recently up to around 50%); occasionally cheaper than transferring, but only buy with a redemption planned.',

  award_chart = 'Air Europa SUMA prices awards through its own redemption structure rather than a single fixed public chart, varying by route, cabin, and partner. Verify the cost for a specific route at aireuropa.com before transferring in or committing.

**Redemption floors (official):** Some partner flights start from about 1,500 SUMA Miles; SkyTeam award flights start from around 6,000 SUMA Miles -- low entry points that make SUMA useful for short-haul redemptions. Air Europa''s own long-haul business class (Madrid to Latin America, and transatlantic) is the standout premium target.

**Earning:** On Air Europa flights you earn SUMA Miles for every euro spent, scaled by cabin and your SUMA level. SUMA Miles (the spendable currency) are valid 24 months; Tier Miles (status) expire after 12 months.

**Transfers in (all 1:1):** American Express, Capital One, Bilt, Citi, and Wells Fargo all transfer to SUMA at 1:1 (Chase does not). As a Spanish carrier, Air Europa awards avoid the Amex federal excise tax. Frequent buy-miles promotions (recently up to around 50% bonus) offer another way in.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'air-europa';
