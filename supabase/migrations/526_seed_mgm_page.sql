-- Seed MGM Rewards program page at /programs/mgm.
-- mgmresorts.com is Firecrawl-blocked and Claude Code cannot WebFetch it.
-- Tier thresholds, benefits, and earn rates sourced from:
--   - upgradedpoints.com/travel/hotels/m-life-rewards-program-mgm/ (comprehensive 2026 guide)
--   - thepointsguy.com/news/mgm-rewards-tier-benefits-changes/ (2025 benefit changes: celebration credits, cruise, FreePlay)
--   - awardwallet.com/hotels/mgm-status-match/ (Marriott Bonvoy tier match table)
--   - card.fnbo.com/landing/mgmrewards/mgm-card-compare (official FNBO card compare -- fetched directly)
-- Casino gaming TC earn rates not available from official source; omitted.
-- Marriott Bonvoy booking of MGM Collection properties confirmed from multiple sources.

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'MGM Rewards is the loyalty program for MGM Resorts International -- Bellagio, Aria, Park MGM, Mandalay Bay, MGM Grand, New York-New York, Luxor, Excalibur, and others across Las Vegas, regional US markets, and international destinations. Like Caesars Rewards, it runs on Tier Credits for status and a separate points balance for redemptions. What sets MGM apart: a direct account-linking partnership with Marriott Bonvoy that grants Gold members Marriott Gold Elite status -- a meaningful crossover for travelers who already run hotel stays through Marriott.

The points play here is blunt. Each MGM Rewards point is worth exactly 1 cent toward hotel charges, dining, and entertainment on property. No airline transfers, no award chart to game, no off-peak categories -- just flat cash-equivalent value. The real angle is status: Gold (75,000 Tier Credits) waives resort fees at Las Vegas properties and unlocks Marriott Gold Elite. Platinum (200,000 TCs) adds a $600 annual air travel credit and a complimentary cruise. The MGM Rewards Iconic Mastercard from FNBO ($249/year) fast-tracks earning at 6 Tier Credits per dollar at MGM properties.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Hotel stays at MGM properties**: Apply points at checkout toward your room rate at a flat 1 cent per point. No minimum stay, no blackout dates on point redemptions (though cash rate availability still applies). Book direct at mgmresorts.com for the best rates and resort-fee waiver if you have Gold or above.
- **On-property dining, entertainment, and spa**: Redeem points at any MGM-owned restaurant, bar, show, or spa on property. Same 1-cent flat value -- useful for rounding out a bill or offsetting a big dinner tab.
- **MGM Rewards Moments**: Experiential packages curated for members -- concerts, sporting events, backstage access, chef''s table dinners. Inventory varies and sells out; check the Moments catalog in the MyMGM app or at the Rewards desk on property.
- **Royal Caribbean / Celebrity Cruises voyages**: Gold+ members receive complimentary annual cruise voyages as a status benefit (not a point redemption). Gold gets up to a 5-night oceanview cabin or $750 cruise credit; Platinum gets up to 7 nights in a balcony cabin or $1,500; NOIR gets up to 10 nights in a junior suite or $3,000. Coordinate through MGM Rewards -- blackout dates apply.
- **Marriott Bonvoy booking at MGM hotels**: Select MGM Collection properties can be booked using Marriott Bonvoy points through the Marriott system. This is Marriott Bonvoy spending, not MGM Rewards point spending -- but it means Marriott loyalists can use existing Bonvoy points at Bellagio, Aria, and others. Verify current property availability at marriott.com.',

  sweet_spots = '- **Gold status + Las Vegas resort fee waiver**: Vegas resort fees run $35-50+/night. Gold status (75,000 Tier Credits) waives them on direct bookings -- that is $245-350+ saved on a 7-night trip. Members earn an estimated 4 TCs per $1 on hotel stays and dining, meaning roughly $18,750 in on-property spend to hit Gold organically. The MGM Rewards Iconic Mastercard (6x TCs at MGM) shortens that path considerably.
- **Pearl + Marriott Silver Elite link**: Pearl is achievable at 20,000 TCs and links to Marriott Silver Elite -- 10% bonus Marriott points on stays, priority late checkout request, and welcome gift at 8,000+ Marriott properties worldwide. Low threshold, free benefit.
- **Gold + Marriott Gold Elite link**: The bigger crossover play. Gold Elite at Marriott gives room upgrades (when available), enhanced late checkout, and 25% bonus Marriott points. Combined with MGM Gold resort fee waivers, this is the most useful dual-program unlock on the casino loyalty map.
- **Annual cruise benefit at Gold+**: The complimentary Royal Caribbean / Celebrity Cruises voyage is a genuine add-on if you were already considering a cruise. Gold gets up to 5 nights oceanview; Platinum gets up to 7 nights balcony; NOIR gets up to 10 nights junior suite -- or cash cruise credits ($750/$1,500/$3,000) if you prefer to apply them to a different sailing.
- **No outsized award-chart sweet spots**: MGM Rewards points are flat 1 cent/point with no partner booking arbitrage, no airline transfer plays, and no off-peak categories. The value is entirely in status benefits -- redemption math will never beat a solid cash-back card.',

  tier_benefits = '[
    {
      "name": "Sapphire",
      "qualification": "0 to 19,999 Tier Credits in a calendar year (entry level -- all members start here)",
      "benefits": [
        "Earn MGM Rewards points and Tier Credits on hotel stays, dining, gaming, and entertainment at MGM Resorts properties",
        "5% retail discount at MGM property shops",
        "$25 Onboard FreePlay credit on qualifying Royal Caribbean and Celebrity Cruises sailings",
        "MGM Rewards points expire after 6 months of account inactivity (no earning of Slot Dollars or Tier Credits)"
      ]
    },
    {
      "name": "Pearl",
      "qualification": "20,000 to 74,999 Tier Credits in a calendar year; automatic with any MGM Rewards Mastercard",
      "benefits": [
        "All Sapphire benefits",
        "MGM Rewards points and Slot Dollars never expire (as long as you maintain Pearl or above)",
        "10% Slot Dollar bonus on gaming",
        "10% retail discount at MGM property shops",
        "Dedicated buffet line where available",
        "Complimentary self-parking at MGM Resorts destinations",
        "Select complimentary concert tickets at MGM Resorts Las Vegas venues (availability and inventory vary)",
        "$100 tier celebration credit redeemable toward hotel, dining, spa, or entertainment at MGM properties",
        "$50 Onboard FreePlay credit on qualifying Royal Caribbean and Celebrity Cruises sailings",
        "Marriott Bonvoy Silver Elite status via account linking (verify at marriott.com/en-us/hotel-search -- requires linking MGM Rewards and Marriott accounts)"
      ]
    },
    {
      "name": "Gold",
      "qualification": "75,000 to 199,999 Tier Credits in a calendar year",
      "benefits": [
        "All Pearl benefits",
        "20% Slot Dollar bonus on gaming",
        "Waived resort fees on direct hotel bookings at MGM Resorts Las Vegas properties",
        "Priority check-in",
        "Room upgrade at check-in (subject to availability -- not guaranteed)",
        "Complimentary valet parking at MGM Resorts destinations",
        "$100 tier celebration credit redeemable toward hotel, dining, spa, or entertainment (same dollar amount as Pearl)",
        "$75 Onboard FreePlay credit on qualifying Royal Caribbean and Celebrity Cruises sailings",
        "Annual Royal Caribbean or Celebrity Cruises voyage: oceanview cabin on qualifying sailings up to 5 nights, or up to $750 toward a qualifying cruise",
        "Marriott Bonvoy Gold Elite status via account linking"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "200,000+ Tier Credits in a calendar year",
      "benefits": [
        "All Gold benefits",
        "30% Slot Dollar bonus on gaming",
        "4 p.m. late checkout",
        "1 p.m. early check-in",
        "Annual suite upgrade award: up to 3 nights in a suite (subject to availability)",
        "$600 annual air travel credit",
        "$200 tier celebration credit redeemable toward hotel, dining, spa, or entertainment",
        "$100 Onboard FreePlay credit on qualifying Royal Caribbean and Celebrity Cruises sailings",
        "Annual Royal Caribbean or Celebrity Cruises voyage: balcony cabin on qualifying sailings up to 7 nights, or up to $1,500 toward a qualifying cruise",
        "Marriott Bonvoy Gold Elite status via account linking (same as Gold)"
      ]
    },
    {
      "name": "NOIR",
      "qualification": "Invitation only -- no published Tier Credit threshold",
      "benefits": [
        "All Platinum benefits",
        "40% Slot Dollar bonus on gaming",
        "$1,200 annual air travel credit",
        "VIP check-in lounge access at select MGM properties",
        "Guaranteed reservations at MGM Resorts restaurants and hotels",
        "Complimentary airport transportation",
        "$500 tier celebration credit redeemable toward hotel, dining, spa, or entertainment",
        "$200 Onboard FreePlay credit on qualifying Royal Caribbean and Celebrity Cruises sailings",
        "Annual Royal Caribbean or Celebrity Cruises voyage: junior suite cabin on qualifying sailings up to 10 nights, or up to $3,000 toward a qualifying cruise",
        "Marriott Bonvoy Ambassador Elite status via account linking"
      ]
    }
  ]'::jsonb,

  lounge_access = 'MGM Rewards does not include airport lounge access at any tier.

**On-property VIP lounges:** NOIR members have access to a dedicated VIP check-in lounge at select MGM properties where the lounge exists. No other tier receives a dedicated MGM lounge perk.

**Priority Pass via co-brand card:** The MGM Rewards Iconic World Elite Mastercard ($249/year, issued by FNBO) includes a Priority Pass Digital membership, granting access to a network of airport lounges worldwide. This lounge access is a card benefit, not an MGM Rewards tier benefit -- it applies regardless of your MGM status tier.',

  quirks = '- **Two-currency system:** MGM Rewards points (redeemable at 1 cent each toward hotel, dining, and entertainment) and Slot Dollars (casino gaming credits earned through gaming activity, not transferable off-property or to points). Slot Dollar bonuses by tier (10% Pearl through 40% NOIR) increase how much gaming activity generates. They are separate from your MGM Rewards point balance.
- **Points value is flat -- no outsized redemptions:** 1 MGM Rewards point = 1 cent, always. No airline transfer partners, no off-peak categories, no partner booking tricks. The program rewards on-property spend with on-property value -- it is not a points-game program.
- **Marriott Bonvoy account linking (one-way only):** MGM Rewards members link accounts at marriott.com to receive Marriott Bonvoy status -- Pearl to Silver Elite, Gold to Gold Elite, Platinum to Gold Elite, NOIR to Ambassador Elite. This does NOT work in reverse: Marriott Bonvoy members cannot receive MGM Rewards tier status through the partnership.
- **Marriott Bonvoy points book MGM Collection hotels:** As a separate partnership, select MGM properties (Bellagio, Aria, Park MGM, and others) are bookable via the Marriott system using Bonvoy points. This is Marriott Bonvoy spending, not MGM Rewards point spending. Verify current MGM Collection property availability at marriott.com.
- **No major bank transfer partners:** Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One do not transfer to MGM Rewards. Status and points come entirely from on-property spend (or the co-brand cards).
- **Tier Credit rollover bonus:** Earn 50,000 TCs in a calendar year and carry 7,500 forward into the next year. Earn 125,000 TCs and carry an additional 17,500 forward (25,000 total rollover). Helps bridge the gap toward Gold or Platinum in a slow-start year.
- **Tier status requalifies annually:** Calendar-year reset (January 1). No published lifetime status path -- you requalify or step down each year.
- **Points expiry for Sapphire members:** Without earning Slot Dollars or Tier Credits within 6 months, points expire. Pearl and above: non-expiring as long as you hold that tier. With an active MGM Rewards Mastercard: points never expire regardless of tier.
- **BetMGM integration:** Tier Credits can be earned on qualifying bets via the BetMGM online sportsbook and iGaming platform (availability varies by state). The MGM Rewards Iconic Mastercard earns 1x points and TCs on BetMGM deposits.',

  award_chart = 'MGM Rewards does not use a traditional award chart. Points redeem at a flat 1 cent per point toward any eligible charge at MGM Resorts properties -- no categories, no peak pricing, no partner booking tiers.

**Point redemptions (1 cent per point, flat):**
- Hotel stays: apply points at checkout on direct bookings at mgmresorts.com or MyMGM app
- Dining and entertainment: redeem at MGM-owned restaurants, bars, and venues on property
- Spa: apply toward spa services at MGM properties
- MGM Rewards Moments: experiential packages available in the Moments catalog (inventory limited)

**Cruise benefit (status benefit, not a point redemption):**
Gold, Platinum, and NOIR members receive complimentary annual Royal Caribbean or Celebrity Cruises voyages as a status benefit. Members choose the voyage or take a cruise credit instead:
- Gold: up to 5-night oceanview cabin, or $750 cruise credit
- Platinum: up to 7-night balcony cabin, or $1,500 cruise credit
- NOIR: up to 10-night junior suite, or $3,000 cruise credit
Blackout dates and availability restrictions apply. Coordinate booking through MGM Rewards.

**Air travel credits (status benefit):**
- Platinum: $600 annual air travel credit
- NOIR: $1,200 annual air travel credit
Verify current redemption process and eligible charges at mgmresorts.com/en/loyalty.html.

**Co-brand card -- earn rates (official, FNBO):**
- MGM Rewards Iconic World Elite Mastercard ($249/year): 6x points + TCs at MGM Resorts destinations; 2x at hotels, dining, gas stations, and grocery stores; 1x elsewhere. Includes $200 resort credit annually, complimentary night (up to $250) at anniversary with $25,000 spend, Global Entry/TSA PreCheck credit, Priority Pass Digital membership.
- MGM Rewards World Elite Mastercard ($0/year): 3x points + TCs at MGM Resorts destinations; 2x at gas stations and grocery stores; 1x elsewhere. Both cards grant automatic Pearl status and free self-parking.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'mgm';
