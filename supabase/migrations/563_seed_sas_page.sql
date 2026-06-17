-- Seed SAS EuroBonus program page at /programs/sas.
-- CRITICAL: SAS LEFT Star Alliance and joined SkyTeam on 2024-09-01. alliance = skyteam.
-- Sourced from official flysas.com/en/eurobonus (main, use-points, partners) scraped via Firecrawl
-- 2026-06-17, plus 2026 WebSearch for tier thresholds, transfer access, sweet spots.
-- Lean style: avoid derived math + over-specificity; keep official figures lightly.
-- US transfer access is limited -- no Amex US / Chase / Citi / Capital One / Bilt; only Rove Miles (1:1).

update programs set
  alliance = 'skyteam',
  hubs = '{CPH,ARN,OSL}',

  intro = 'SAS EuroBonus is the loyalty program of SAS (Scandinavian Airlines), the flag carrier of Denmark, Norway, and Sweden, hubbed in Copenhagen, Stockholm, and Oslo. The headline change US travelers must know: SAS left Star Alliance and joined SkyTeam on September 1, 2024. EuroBonus points now earn and redeem across SkyTeam partners -- Delta, Air France, KLM, Korean Air, Virgin Atlantic, China Eastern and others -- and no longer work on Star Alliance carriers.

The appeal for a points-and-miles audience is two-fold. EuroBonus still uses a fixed award chart -- increasingly rare -- and SAS-operated awards carry no fuel surcharges, which makes Scandinavia-to-US business class a standout value. The catch is access: as of 2026 no major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt) -- the only US transfer route is the niche Rove Miles program at 1:1. For most US flyers the practical angle is crediting paid SAS/SkyTeam flights here, booking SAS via other SkyTeam partner points, or matching status in from another program.',

  transfer_partners = '[]'::jsonb,

  how_to_spend = '- **SAS award flights (best value, fixed price, no fuel surcharges)**: SAS-operated award flights are priced on a fixed chart and carry no carrier-imposed fuel surcharges -- the core reason to hold EuroBonus points. Scandinavia-to-US business class is the standout.
- **SkyTeam partner award flights**: Redeem on Delta, Air France, KLM, Korean Air, Virgin Atlantic, China Eastern and other SkyTeam carriers. Partner awards are priced separately and carry a per-booking fee (the intercontinental-business fee rose in May 2026). Premium Economy is now bookable with points on Delta and Virgin Atlantic.
- **Upgrades, hotels, and car rental**: Use points to upgrade SAS flights, book Hertz rentals (points or points-plus-cash), and book hotels through Hotels by EuroBonus (250,000+ properties, from 18,000 points a night) or Scandic in Scandinavia.
- **Shopping and gift cards**: Points redeem in the EuroBonus Shop and for partner gift cards -- generally lower value than flights, but flexible.',

  sweet_spots = '- **Scandinavia-to-US business class with no fuel surcharges**: The marquee EuroBonus value -- a fixed-chart business-class award on SAS metal between the US and Scandinavia, with no carrier-imposed surcharges piled on top. Fixed pricing means it does not balloon during peak demand the way dynamic programs do.
- **Cheap intra-Nordic and domestic Scandinavian flights**: Short hops within and between Denmark, Norway, and Sweden price very low on the fixed chart -- handy if you are positioning around the region.
- **Status match into SkyTeam Elite Plus**: SAS actively matches elite status from Finnair, airBaltic, and British Airways into EuroBonus. Matching to Gold or Diamond confers SkyTeam Elite Plus -- lounge access and priority across the whole alliance -- without flying SAS first.
- **Amex 2-for-1 vouchers on partner Premium Economy**: Holders of the European SAS Amex premium cards can apply 2-for-1 award vouchers to partner Premium Economy bookings (Delta, Virgin Atlantic). A regional perk, but a strong one where it applies.
- **Reality check on US access**: With no major US bank transfer partner, US flyers cannot top up EuroBonus from Amex/Chase/Citi/Capital One/Bilt. Treat EuroBonus as a program you feed by flying SkyTeam or by status match -- not one you fund from a US points stash.',

  tier_benefits = '[
    {
      "name": "Member",
      "qualification": "Automatic on joining (free); base level, no qualification needed",
      "benefits": [
        "Earn Bonus points (the spendable currency) and Level points (which drive status) on SAS and SkyTeam partner flights and 2,000+ earning partners",
        "Use points for SAS and partner award flights, upgrades, hotels, car rental, and shopping",
        "Bonus points are valid roughly 4-5 years after earning"
      ]
    },
    {
      "name": "Silver",
      "qualification": "20,000 Level points or 10 qualifying flights in the 12-month qualification period",
      "benefits": [
        "All Member benefits",
        "SkyTeam Elite recognition",
        "25% bonus points on SAS and Wideroe flights",
        "Select seat and other travel benefits depending on fare"
      ]
    },
    {
      "name": "Gold",
      "qualification": "45,000 Level points or 45 qualifying flights in the qualification period",
      "benefits": [
        "All Silver benefits",
        "SkyTeam Elite Plus recognition -- lounge access, priority check-in/boarding, extra baggage, and fast track across the alliance when flying SkyTeam internationally",
        "50% bonus points on SAS and Wideroe flights"
      ]
    },
    {
      "name": "Diamond",
      "qualification": "90,000 Level points or 90 qualifying flights in the qualification period",
      "benefits": [
        "All Gold benefits",
        "SkyTeam Elite Plus recognition",
        "75% bonus points on SAS and Wideroe flights",
        "Highest published service and priority tier"
      ]
    },
    {
      "name": "Pandion",
      "qualification": "By invitation only -- EuroBonus most exclusive level (no published threshold)",
      "benefits": [
        "All Diamond benefits",
        "An additional 25% bonus on all earned points",
        "Invitation-only recognition and service"
      ]
    }
  ]'::jsonb,

  lounge_access = 'SAS operates its own SAS Lounges at its Scandinavian hubs and select outstations. Lounge access through EuroBonus status is tied to SkyTeam recognition:

- **Gold and Diamond (SkyTeam Elite Plus)** receive lounge access when flying SkyTeam-operated international flights, plus alliance-wide fast track, priority check-in and boarding, and extra baggage.
- **Silver (SkyTeam Elite)** does not include general lounge access.

Because SAS is now a SkyTeam member, EuroBonus Elite Plus members can use SkyTeam partner lounges across the alliance under standard SkyTeam eligibility rules (same-day onward international travel on a SkyTeam carrier). Paid SAS Lounge access and day passes may also be available at some locations.',

  quirks = '- **Moved from Star Alliance to SkyTeam (September 1, 2024)**: This is the single most important fact. EuroBonus points can no longer earn or redeem on Star Alliance carriers; the partner set is now SkyTeam (Delta, Air France, KLM, Korean Air, Virgin Atlantic, China Eastern and more). Old guides predating the switch are stale.
- **Two point types**: Bonus points are the spendable currency (valid roughly 4-5 years after earning); Level points determine status and are valid only within each 12-month qualification period. Level points cannot be spent.
- **Fixed award chart**: Unlike most large programs, EuroBonus prices SAS award flights on a fixed chart rather than dynamically -- a real advantage on peak-date premium-cabin redemptions.
- **No fuel surcharges on SAS-operated awards**: SAS metal awards avoid carrier-imposed surcharges; partner awards carry a per-booking fee that changed in May 2026 (intercontinental business higher, intra-European economy lower).
- **US transfer access is limited**: No Amex US, Chase, Citi, Capital One, or Bilt transfers to EuroBonus. The only US transfer route as of 2026 is Rove Miles at 1:1. (In Europe, SAS co-brand Amex cards earn EuroBonus directly.)
- **Status match in**: SAS matches elite status from Finnair, airBaltic, and British Airways into EuroBonus -- a fast path to SkyTeam Elite Plus.
- **Qualification and grace**: Status runs on a 12-month qualification period from your join month, plus a 3-month grace period (about a 15-month effective level expiry) before downgrade.',

  award_chart = 'EuroBonus uses a fixed award chart for SAS-operated award flights -- award prices are set in points rather than fluctuating with cash fares, which is increasingly unusual among large programs and a genuine advantage on peak dates.

**SAS award flights:** Priced on the fixed chart with no carrier-imposed fuel surcharges. Intra-Nordic and Scandinavian domestic flights price very low; the standout premium value is Scandinavia-to-US business class. (Verify current point levels at flysas.com/en/eurobonus/award-flights, as SAS adjusts the chart periodically.)

**Partner award flights (SkyTeam):** Redeemable on Delta, Air France, KLM, Korean Air, Virgin Atlantic, China Eastern and other SkyTeam carriers, priced on a separate partner award structure and subject to a per-booking fee that changed in May 2026 (intercontinental business raised, intra-European economy lowered). Premium Economy is now bookable with points on Delta and Virgin Atlantic.

**Hotels and other:** Hotels by EuroBonus covers 250,000+ properties from about 18,000 points a night; points also redeem for Hertz rentals (points or points-plus-cash) and shopping. These return less value per point than flights.

**Transfers in:** No major US bank currency transfers to EuroBonus (not Amex US, Chase, Citi, Capital One, or Bilt). The only US transfer partner as of 2026 is Rove Miles at 1:1; European SAS co-brand Amex cards earn EuroBonus directly.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'sas';
