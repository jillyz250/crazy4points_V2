-- Seed Caesars Rewards program page (/programs/caesars).
--
-- Source: caesars.com/myrewards/benefits-overview (scraped 2026-06-17)
--         caesars.com/myrewards/earn-and-redeem (scraped 2026-06-17)
--         caesars.com/myrewards/sevenstars (scraped 2026-06-17)
--         caesarsrewards.custhelp.com/app/answers/detail/a_id/233 (scraped 2026-06-17)
--
-- Notes:
-- - Casino-first loyalty program (hotel is one channel among many).
-- - Two parallel currencies: Reward Credits (redeemable) + Tier Credits (status).
-- - TCs reset January 1 each year -- tier must be re-earned annually.
-- - No airline/bank transfer partners (Amex MR, Chase UR, Bilt, Citi, Cap One do not transfer in).
-- - Wyndham Rewards is a bidirectional transfer partner; ratio not captured in scrape -- excluded
--   from transfer_partners_outbound to avoid stating an unverified figure.
-- - transfer_partners = [] (no external programs transfer in).
-- - transfer_partners_outbound = [] (no outbound transfers other than Wyndham, ratio unconfirmed).
-- - alliance = 'none' (casino chain, not a global hotel alliance).
-- - hubs = [] (no airline hub concept applies).
-- - Tier benefit bullet assignments pulled only from rows where the benefits page text explicitly
--   stated which tiers qualify (e.g. Seven Stars page, footnotes), or where the column count was
--   unambiguous (6 values = all 6 tiers; confirmed zero-value for Gold).
-- - Monthly sportsbook bonus bets (Platinum-Seven Stars) and birthday bets (all tiers) from the
--   benefits overview table (exact amounts confirmed in the columnar layout).

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'Caesars Rewards spans more than 50 casino resorts under the Caesars Entertainment umbrella -- Caesars Palace, Harrah''s, Horseshoe, Flamingo, Paris Las Vegas, Planet Hollywood, and others. The program uses two parallel currencies: Reward Credits, which you redeem for free play, hotel stays, dining, and show tickets; and Tier Credits, which determine your status tier and reset to zero every January 1. Neither Amex MR, Chase UR, Bilt, nor any major bank currency transfers into the program, so your tier lives and dies by how much you play, eat, and stay at Caesars properties.

The hook for points-minded travelers: Diamond status (15,000 Tier Credits) waives resort fees at every Caesars hotel -- meaningful savings in Las Vegas where resort fees run $35-60+ per night. Seven Stars (150,000 Tier Credits) layers on an annual retreat with airfare up to $1,200, four complimentary nights, a $500 dining folio, a complimentary Norwegian Cruise Line voyage, and a complimentary stay at Atlantis Paradise Island in the Bahamas. Extraordinary benefits -- but achieving them requires serious gambling or hotel spend.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Free play:** Redeem Reward Credits at any Caesars casino Rewards Center -- $1 per 200 RCs (0.5 cents each). Usable any day at any Caesars Rewards property.
- **Hotel checkout:** Apply RCs at checkout at any of 50+ Caesars destinations (Las Vegas, Atlantic City, Lake Tahoe, New Orleans, and more).
- **Dining and entertainment:** Redeem at participating on-property restaurants, shows, and venues. Also redeemable for show tickets and spa services.
- **WSOP buy-ins:** Use RCs to enter official World Series of Poker events and WSOP circuit tournaments.
- **Wyndham Rewards transfer:** Transfer Reward Credits to Wyndham Rewards points (bidirectional -- Wyndham points can also transfer in). Verify the current exchange ratio at caesars.com/myrewards/partners/wyndham_resorts before transferring.
- **eCatalog:** Redeem for gift cards to select retailers and merchandise through the Caesars Rewards eCatalog.
- **Online casinos (MI, NJ, PA, WV):** Convert 100 RCs to $1.00 in Casino Bonus Cash on Caesars Palace Online Casino or Horseshoe Online Casino.',

  sweet_spots = '- **Diamond resort fee waiver -- Las Vegas lever.** At 15,000 Tier Credits, resort fees disappear across all Caesars hotels. A three-night stay at a Strip property can save $105-180 in fees at current rates. If you are already planning a Las Vegas casino trip, pushing to Diamond before arrival is a concrete target.
- **"Diamond in a Day" gambit.** The daily Tier Credit bonus structure means earning 5,000 TCs in one promotional day earns a 10,000 TC bonus (total: 15,000 TCs = Diamond). A high-variance, single-session approach beloved by loyalty community members who want Diamond without sustained play throughout the year. Verify current promotional day rules at a Caesars Rewards Center before attempting.
- **Seven Stars Retreat.** Airfare up to $1,200 (round-trip) + round-trip airport transportation + up to four complimentary nights + $500 dining folio at any Caesars resort annually. Among the more concrete VIP retreat benefits in casino loyalty -- the airfare reimbursement alone covers most domestic trips.
- **Seven Stars Atlantis stay.** Complimentary stay at Atlantis Paradise Island in the Bahamas. One of very few casino programs with a built-in Caribbean luxury partner benefit.
- **Seven Stars Norwegian Cruise.** Annual complimentary up to 7-day cruise in a balcony stateroom (or ocean-view to Alaska). Cruise for two to Europe, the Caribbean, Bermuda, or Mexico -- admin fees, port charges, and government taxes are member responsibility.
- **Wyndham status match.** Tier Status match between Caesars Rewards and Wyndham Rewards is available at Platinum and above (verify current match process at caesars.com/myrewards/partners/wyndham_resorts). If you hold mid-tier status in either program, this can be a low-effort path to status in the other.',

  tier_benefits = '[
    {
      "name": "Gold",
      "qualification": "0 to 4,999 Tier Credits in a calendar year",
      "benefits": [
        "Earn Reward Credits and Tier Credits at 50+ Caesars Rewards casinos and resorts",
        "10% discount on best available advertised room rates",
        "Redeem Reward Credits for free play ($1 per 200 RCs) at any Caesars casino",
        "Earn and redeem Reward Credits for dining, shopping, and entertainment on property",
        "Earn and redeem for World Series of Poker buy-ins",
        "Wyndham Rewards bidirectional transfer access (all tiers)",
        "Monthly birthday Bonus Bet through Caesars Sportsbook Online: $5 (opt-in required; must place $100 cash wager in birthday month)"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "5,000 to 14,999 Tier Credits in a calendar year",
      "benefits": [
        "All Gold benefits",
        "10% discount on best available advertised room rates (same as Gold)",
        "Monthly Bonus Bet through Caesars Sportsbook Online: $10 per month (must opt-in and place at least $100 cash wager each month to qualify)",
        "Birthday month Bonus Bet: $20 (replaces monthly $10 bet)",
        "15% discount at participating casino gift shops",
        "10% discount on select Norwegian Cruise Line vacations",
        "Priority lines at hotel check-in, restaurants, casino cages, and the Caesars Rewards Center",
        "VIP Reservations Hotline access",
        "Access to VIP Laurel Lounge where available (verify fee vs complimentary status at caesars.com/myrewards/benefits-overview)",
        "Tier Status match with Wyndham Rewards (verify process at caesars.com/myrewards/partners/wyndham_resorts)"
      ]
    },
    {
      "name": "Diamond",
      "qualification": "15,000 to 24,999 Tier Credits in a calendar year",
      "benefits": [
        "All Platinum benefits",
        "15% discount on best available advertised room rates",
        "No resort fees on any Caesars hotel stay",
        "Guaranteed room with 72 hours notice at Atlantic City and Las Vegas properties",
        "Complimentary early check-in and late check-out based on availability",
        "Complimentary valet and self-parking at many Caesars destinations",
        "Celebration Dinner: $100 dining voucher redeemable at many Caesars-owned restaurants",
        "Monthly Bonus Bet through Caesars Sportsbook Online: $20 per month",
        "Birthday month Bonus Bet: $40",
        "20% discount at participating casino gift shops",
        "20% discount on select Norwegian Cruise Line vacations",
        "Complimentary access to VIP Laurel Lounge where available"
      ]
    },
    {
      "name": "Diamond Plus",
      "qualification": "25,000 to 74,999 Tier Credits in a calendar year",
      "benefits": [
        "All Diamond benefits",
        "Monthly Bonus Bet: $30 per month",
        "Birthday month Bonus Bet: $60",
        "20% discount at participating casino gift shops (same as Diamond)",
        "20% discount on select Norwegian Cruise Line vacations (same as Diamond)"
      ]
    },
    {
      "name": "Diamond Elite",
      "qualification": "75,000 to 149,999 Tier Credits in a calendar year",
      "benefits": [
        "All Diamond Plus benefits",
        "Monthly Bonus Bet: $75 per month",
        "Birthday month Bonus Bet: $150",
        "$600 airfare credit to Las Vegas (one per benefit year)",
        "20% discount at participating casino gift shops (same as Diamond and Diamond Plus)",
        "25% discount on select Norwegian Cruise Line vacations",
        "Congratulatory Voyage with Norwegian Cruise Line (verify eligibility at caesars.com/myrewards/benefits-overview)"
      ]
    },
    {
      "name": "Seven Stars",
      "qualification": "150,000+ Tier Credits in a calendar year (exclusive invitation required)",
      "benefits": [
        "All Diamond Elite benefits",
        "Annual Retreat: airfare up to $1,200 (round-trip) + round-trip airport-to-hotel transportation + up to four complimentary nights + $500 dining folio at any Caesars resort",
        "Celebration Dinner: $500 (up to five $100 dining vouchers redeemable at many Caesars-owned restaurants)",
        "Complimentary stay at Atlantis, Paradise Island in the Bahamas (annual)",
        "Annual Congratulatory Voyage with Norwegian Cruise Line: up to 7 days in a balcony stateroom (Europe, Caribbean, Bermuda, Mexican Riviera) or ocean-view stateroom to Alaska (admin fees, port charges, and taxes are member responsibility)",
        "Automatic upgrade to best available room at check-in (room type subject to availability; suites may not be included)",
        "Monthly Bonus Bet: $150 per month",
        "Birthday month Bonus Bet: $300",
        "25% discount at participating casino gift shops",
        "30% discount on select Norwegian Cruise Line vacations",
        "Seven Stars Companion Card: companion receives all Seven Stars priority service benefits and Laurel/Seven Stars lounge access without the member present",
        "Invitation to Seven Stars Signature Events and Signature Experiences",
        "Guaranteed VIP host",
        "Online chat feature reserved for Seven Stars members",
        "Seven Stars Elite tier at 500,000 Tier Score: advanced priority booking for Signature Events and invitation to attend all Signature Events",
        "Seven Stars Elite at 1,000,000 Tier Score: additional exclusive benefits (details at caesars.com/myrewards/sevenstars/elite-benefits)"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Caesars Rewards operates Laurel Lounges at select properties and Seven Stars Lounges at certain flagship destinations.

**Laurel Lounges** are available to Diamond members and above at properties where they exist. Access may be complimentary at Diamond and above (per the official benefits table at caesars.com/myrewards/benefits-overview); verify current lounge availability at your destination before your trip, as not all Caesars properties have a Laurel Lounge.

**Seven Stars Lounges** are reserved for Seven Stars members and their Companion Card holders. Seven Stars Companion Card bearers are entitled to access Seven Stars and Laurel Lounges without the primary member present.

No airport lounge access or third-party airline lounge benefit is included in Caesars Rewards at any tier.',

  quirks = '- **Tier Credits reset every January 1.** All TCs go to zero at year end. Status earned in 2026 carries through January 31, 2027, but you must re-earn TCs in 2026 to maintain your tier in 2027. No rollover, no banking TCs for future years.
- **Reward Credits do not expire while account is active.** Unlike TCs, Reward Credits remain in your account as long as you maintain qualifying activity. Inactive accounts may have RCs forfeit -- check current inactivity policy at caesars.com/myrewards/caesars-rewards-rules-regs.
- **No major bank transfer partners.** Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not transfer into Caesars Rewards. Your points accumulate only through on-property play, dining, hotel stays, and the co-brand Visa cards.
- **Wyndham Rewards is a two-way transfer partner.** Caesars Reward Credits can transfer to Wyndham Rewards points and vice versa. Wyndham status match is also available at Platinum and above. Verify the current exchange ratio and match process at caesars.com/myrewards/partners/wyndham_resorts before initiating a transfer.
- **Daily TC bonus structure can accelerate tier.** Earning 5,000 TCs in one promotional day earns a 10,000 TC bonus (total: 15,000 = Diamond in one day). The "Diamond in a Day" run is a known community tactic. Promotional days vary by property; confirm the earning period with a Caesars Rewards Center.
- **"Diamond in a Day" spend math.** At slots (1 TC/$5), earning 5,000 base TCs means $25,000 in slot coin-in -- high variance gambling, not a money-positive strategy. The bonus structure rewards concentrated play, but slot coin-in and net loss are very different numbers.
- **Hotel earn posts 10 days after checkout.** Tier Credits and Reward Credits from hotel stays post to your account 10 days after departure, not at checkout. Book directly with Caesars for credit to apply.
- **Sportsbook TCs qualify (with limits).** Online sports betting through Caesars Sportsbook earns up to 10 TCs per $100 on straight bets and up to 30 TCs per $100 on parlays (minimum odds requirements apply). Sportsbook TCs count toward tier but do NOT count toward daily TC bonuses.
- **Seven Stars is invitation-only above 150K TCs.** Reaching 150,000 TCs is a threshold, but full Seven Stars membership requires an exclusive invitation from Caesars. Tier Credits alone do not automatically trigger Seven Stars enrollment.
- **Military SALUTE program.** U.S. veterans and active duty military who show a Military ID automatically receive Platinum-level benefits via the SALUTE card -- no TC requirement.
- **Caesars Rewards Visa devaluation (2026).** The Caesars Rewards Visa now awards 2,500 TCs per $5,000 in eligible spend (a reduction from prior years). The card still earns 5x Reward Credits at Caesars destinations and 2x on dining, travel, and entertainment.',

  award_chart = 'Caesars Rewards does not publish a traditional award chart with fixed point prices for hotel nights. Reward Credits are redeemed at a flat rate or variable property rates:

**Free play:** 200 Reward Credits = $1.00 in free play at any Caesars casino (0.5 cents per RC). This is the baseline "floor" redemption value.

**Hotel stays:** Redemption rates for hotel nights vary by property and availability. When booking at caesars.com, toggle the "Reward Credits" view on the room selection page to see your rate in RCs. Value varies -- free play is a common reference point but hotel redemptions may offer better or worse per-RC value depending on property and date.

**Online casino (MI, NJ, PA, WV only):** 100 RCs = $1.00 Casino Bonus Cash on Caesars Palace Online or Horseshoe Online (1 cent per RC -- twice the free play rate).

**Wyndham transfer:** Caesars Reward Credits can be transferred to Wyndham Rewards points. Transfer ratio not confirmed from official source; verify at caesars.com/myrewards/partners/wyndham_resorts before initiating.

**Co-brand Visa cards earn Reward Credits at:** 5x at Caesars Rewards destinations; 2x on dining, travel, and entertainment; 1x everywhere else. Two cards available: Caesars Rewards Visa Signature (no annual fee) and Caesars Rewards Prestige Visa Signature ($149 annual fee). Verify current earn rates and welcome bonus at caesars.com/myrewards/partners/cr-visa before applying.',

  content_updated_at = now(),
  updated_at = now()

where slug = 'caesars';
