-- Seed Allegiant Allways Rewards full program page.
--
-- Authored 2026-05-05. Sources: official Allegiant scrapes (rewards-terms,
-- rewards-faqs, allways-rewards-visa-card, deals/allways-rewards, newsroom)
-- + WebSearch (Forbes, Upgraded Points, NerdWallet, Bank of America card page).
-- Cross-fact-checked via Copilot 2026-05-05.
--
-- Notes on shape:
-- - alliance = 'none' (standalone ULCC, no alliance, no codeshares)
-- - transfer_partners = [] (no flexible-currency transfers in or out)
-- - tier_benefits = [] (flat program, no elite status)
-- - lounge_access stub (Allegiant operates no lounges)
-- - award_chart frames the program as a fixed-value rebate (1 pt = $0.01)
--   rather than a chart, since there is no chart.

update programs set
  alliance = 'none',
  hubs = array['LAS','SFB','PIE','AVL','BLI'],
  intro = 'Allegiant''s Allways Rewards is the loyalty program for an ultra-low-cost leisure airline based in Las Vegas, flying to about 130 small-and-mid-size cities (Bellingham WA, Sanford FL, Asheville, Knoxville, La Crosse) that legacy carriers mostly ignore. Allegiant operates around 123 jets - a mix of A320-family aircraft transitioning toward Boeing 737 MAX - and is acquiring Sun Country with a deal expected to close around May 13, 2026, which would significantly expand the leisure-focused footprint of both carriers.

Here is the truth about Allways Rewards: it is the simplest mainstream airline program in the country. One point equals $0.01 toward an Allegiant purchase. No chart. No zones. No blackout dates. No fuel surcharges. No elite tiers. No transfer partners from Amex, Chase, Citi, Capital One, or Bilt. No lounges. The whole thing is a cash-back rebate dressed up as miles, and the Bank of America Allways Rewards Visa is the main earn accelerator. If you fly Allegiant a few times a year, the math is straightforward and the program respects your time. If you are a transfer-partner geek hunting Polaris suites, this is not your program.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Allegiant flights** - any route, any date, any fare. Points cover base fare, taxes, fees, bag fees, seat selection, vacation packages.
- **Vacation packages** - Allegiant sells flight + hotel and flight + car bundles on Allegiantair.com. Points work the same way: 1 pt = $0.01 off the total.
- **No partner redemptions** - Allways points only redeem on Allegiant. There are no alliance bookings, no partner award bookings, and no off-network redemptions.
- **No transfers out** - you cannot transfer Allways points to other airline or hotel programs.',
  sweet_spots = '- **There are no sweet spots in the chart sense.** Allways prices like cash: 1 point = $0.01 toward whatever Allegiant charges, including fees. The "sweet spot" is just maximizing your earn.
- **Bulk-itinerary 2x bonus** - any single Allegiantair.com itinerary above $500 earns 2 points per dollar instead of 1. If a family-of-four vacation package would cross $500 anyway, putting it on one Allways account effectively doubles the rebate on that booking.
- **Visa cardholder BOGO** - the Allways Rewards Visa''s buy-one-get-one-free airfare on vacation packages with 4+ hotel nights or 7+ rental car days is the highest-ROI perk in the program. If you book a vacation package once a year with the card, the math typically beats the $59 annual fee on its own.
- **Spirit closure relief offer** - through May 12, 2026, Allegiant is rebating 50% of points spent on rebooked Spirit-passenger itineraries. If you had a Spirit ticket and need to rebook, this is genuinely the best offer in the program right now.',
  tier_benefits = '[]'::jsonb,
  lounge_access = 'Allegiant does not operate any of its own airport lounges. Allegiant is not a member of any alliance (oneworld, SkyTeam, Star Alliance) and has no lounge-access reciprocity with other carriers.

If you are flying Allegiant out of an airport that has a third-party lounge program (Priority Pass, Plaza Premium, Capital One Lounges, Amex Centurion, Chase Sapphire Lounges, Delta Sky Club through co-brand cards, etc.), access depends on the lounge''s entry rules and your card or membership - not on your Allways Rewards status, because Allways Rewards does not confer any lounge benefits.

Allways Rewards Visa cardholders get **complimentary priority check-in and priority boarding for the cardholder and everyone on the same itinerary** at every Allegiant flight. That is closest thing to an "elite perk" the program offers, and it stacks per booking, not per status.',
  quirks = '- **Points expire after 24 months of inactivity.** Any qualifying earn or redemption resets the 24-month clock. If you hold the Allways Rewards Visa with the account open, your points do not expire regardless of activity.
- **No family pooling.** Allways points cannot be combined or transferred between accounts. There is, however, a useful workaround: the person who pays for an itinerary earns points on the full transaction including tickets for other passengers. If a family of four flies together, route the booking through one Allways account.
- **Stopovers and open-jaws are not a meaningful concept** in this program. Allegiant operates point-to-point with no connections, and points redeem like cash on each itinerary, so traditional award-routing constructs do not apply.
- **Discrepancies must be reported within 6 months** of the transaction posting date per the official terms. After that, you cannot dispute missing points.
- **Points post 72 hours after itinerary completion** (the last travel date in your booking - return flight, rental car return, or hotel checkout, whichever is latest). Visa earnings post after the monthly statement closes, so card spend can take 1-2 billing cycles to show up.
- **Spirit Airlines closure relief offer** through May 12, 2026: 50% Allways points rebate on rebooked Spirit-passenger itineraries.
- **No award booking phone fee, no redeposit fee, no close-in fee** - because there are no awards in the traditional sense, just points spent like cash. If you cancel, your points return to your account along with whatever cash you paid (subject to Allegiant''s standard cancellation rules).
- **Sun Country acquisition** is expected to close around May 13, 2026. The combined entity has not yet announced loyalty-program integration plans; for now Allways Rewards and Sun Country Rewards remain separate.',
  award_chart = '## Allways Rewards redemption structure (no chart)

Allegiant''s program is fixed-value, not chart-based. There is no award chart, no zones, no peak/off-peak pricing, no blackout dates.

| Item | Cost in points | Cost in dollars |
|---|---|---|
| Any Allegiant flight | (cash price) x 100 | (cash price) |
| Bag fees | (cash price) x 100 | (cash price) |
| Seat selection | (cash price) x 100 | (cash price) |
| Taxes & fees | (cash price) x 100 | (cash price) |
| Vacation package | (cash price) x 100 | (cash price) |

**Conversion rate:** 1 point = $0.01. So 5,000 points = $50 toward any Allegiant purchase.

**Earn rates:**
- 1 point per $1 on Allegiantair.com (flights, bags, seats, packages)
- 2 points per $1 on Allegiant itineraries with qualified spend at or above $500
- Allways Rewards Visa: 3 points per $1 on Allegiant, 2 points per $1 on dining, 1 point per $1 on everything else
- Taxes and fees do not earn base points (they do earn on the Visa as part of dining/Allegiant/other categories)

**No partner award redemptions** - Allways points only redeem on Allegiant. No alliance, no codeshare partners.',
  partner_chart_url = 'https://www.allegiantair.com/rewards-faqs',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'allegiant';
