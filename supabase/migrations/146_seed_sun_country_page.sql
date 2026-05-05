-- Seed Sun Country Rewards full program page.
--
-- Authored 2026-05-05. Sources: official Sun Country scrapes (rewards-terms,
-- rewards-faqs, stories landing, Synchrony card page) + WebSearch (Forbes,
-- Upgraded Points, NerdWallet, WalletHub, Thrifty Traveler, CNBC, FlightGlobal,
-- Allegiant IR, Synchrony newsroom).
-- Cross-fact-checked via Copilot + ChatGPT 2026-05-05.
--
-- Notes on shape:
-- - alliance = 'none' (standalone, no alliance, no codeshares)
-- - transfer_partners = [] (no flexible-currency transfers)
-- - tier_benefits = single Plus tier (10 segments OR $10K card spend in calendar year)
-- - lounge_access stub (Sun Country operates no lounges; Plus gives Priority TSA at MSP)
-- - award_chart frames the program as a fixed-value rebate (1 pt = $0.01, 2 pts/$
--   earn direct), not a chart.
-- - Allegiant acquisition (~$1.5B announced Jan 11, 2026, closing 2Q 2026) flagged
--   as a programmatically major event; programs operate separately at close.

update programs set
  alliance = 'none',
  hubs = array['MSP','DFW','LAS','CVG'],
  intro = 'Sun Country Rewards is the loyalty program for a Minneapolis-based leisure airline that flies across the US, Mexico, Central America, Canada, and the Caribbean. Sun Country''s primary hub is Minneapolis-St. Paul (MSP), with operational bases at Dallas/Fort Worth (DFW), Las Vegas (LAS), and a new Cincinnati/Northern Kentucky (CVG) base that opened January 31, 2026.

Allegiant announced a $1.5 billion acquisition of Sun Country on January 11, 2026, with closing expected in the second quarter of 2026 (as early as mid-May, after the May 8 shareholder votes). Both airlines are slated to keep operating separately under common ownership at first, and the loyalty programs will integrate into one over time. For now, Sun Country Rewards is its own program.

The program is simple by design: 100 points = $1 toward a Sun Country purchase. The base earn rate is 2 points per $1 on direct bookings (1 point per $1 via third parties). There is one elite tier - **Plus status** - that you earn by either flying 10 Sun Country flights or spending $10,000 on the Synchrony-issued Sun Country Visa Signature in a calendar year. No alliance. No transfer partners from Amex MR, Chase UR, Citi TYP, Capital One Miles, or Bilt. No own-brand lounges. No award chart - redemptions price like cash against the live fare.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Sun Country flights** - any route, any date, any fare. 100 points = $1 off the cash price.
- **Vacation packages** - flight + hotel and flight + car bundles on suncountry.com. Points work the same way.
- **Seat selection + bag fees** - points cover these the same way they cover the fare.
- **Points + cash combos** - mix points and dollars on a single booking.
- **No partner redemptions** - Sun Country Rewards points only redeem on Sun Country. No alliance bookings, no codeshare partners.
- **No transfers out** - you cannot transfer Sun Country points to other airline or hotel programs.',
  sweet_spots = '- **There are no sweet spots in the chart sense.** Sun Country Rewards prices like cash: 1 point = $0.01 toward any Sun Country purchase, including taxes, fees, bags, and seats.
- **Plus status earned via card spend** - the $10,000 calendar-year spend threshold to earn Plus is one of the lower spend-only paths to a meaningful US-airline elite status. If you''re going to put $10K on a card anyway and you fly Sun Country a few times a year, this is a real perk path.
- **50% point bonus with Plus status** - Plus members earn 1 additional point per $1 on direct bookings, taking the rate from 2 pts/$ to 3 pts/$. Stack with the Visa Signature''s 5x and you''re at up to 6x on Sun Country purchases.
- **Bag + seat 50% off (cardholder)** - the Synchrony card''s 50% off the first checked bag and 50% off Best/Standard seat selection (when purchased pre-flight on suncountry.com) for the cardholder + travel companions on the same itinerary is high-value if you actually fly the airline a few times a year.
- **Status carryover** - earn Plus status this year and you keep it for the rest of the calendar year plus all of next year. So earning Plus in December gets you ~13 months. Earning Plus in March gets you ~22 months.',
  tier_benefits = '[{"name":"Plus","qualification":"10 qualifying Sun Country flight segments OR $10,000 in spend on the Sun Country Visa Signature card in a calendar year (only activity after September 23, 2025 counts)","benefits":["50% Point Bonus on direct bookings - earn 1 additional point per $1 (3 pts/$ instead of 2)","Complimentary Flexible Fare - one-time change-fee waiver per booking when modified at least 1 hour before the first scheduled flight (fare difference still applies)","Priority Check-In line for member and travel companions on the same booking","Priority TSA line at MSP (Terminal 2) for member and travel companions on the same booking","Priority Boarding (Zone 1) for member and travel companions on the same booking","Status valid for the remainder of the qualifying calendar year plus all of the next calendar year","Plus benefits only apply on direct bookings (suncountry.com or call center) when the rewards member is logged in and is a passenger on the booking"]}]'::jsonb,
  lounge_access = 'Sun Country does not operate any of its own airport lounges. Sun Country is not a member of any alliance (oneworld, SkyTeam, Star Alliance) and has no lounge-access reciprocity with other carriers.

If you''re flying Sun Country out of an airport that has a third-party lounge program (Priority Pass, Plaza Premium, Capital One Lounges, Amex Centurion, Chase Sapphire Lounges, Delta Sky Club through co-brand cards, etc.), access depends on the lounge''s entry rules and your card or membership - not on your Sun Country Rewards status, because Sun Country Rewards does not confer any third-party lounge benefits.

The closest thing to a status-based airport perk in the program is **Priority TSA line access at MSP Terminal 2** for Plus-status members and their travel companions on the same booking. That is a meaningful time-saver at Sun Country''s biggest hub but it is not a lounge.',
  quirks = '- **Points expire 36 months after they are earned** for non-cardholders, regardless of activity. Earn date matters - this is stricter than the inactivity-based expiry common at most airlines.
- **For Sun Country Visa Signature primary cardmembers, points do not expire** as long as the account is open and in good standing.
- **Plus status program launched September 23, 2025.** Only credit card spend and flight segments after that date count toward Plus qualification. Activity prior to launch does not roll forward.
- **Plus status earned via card spend requires keeping the card open** to retain status. If you cancel the card, you lose status.
- **Family pooling is not currently part of the program.** The legacy UFly Rewards program let any 10 members pool points freely; that feature was discontinued during the late-2025 program revamp into Sun Country Rewards. Public reporting (Thrifty Traveler, The Points Guy) suggested a more limited family-only pool was being considered, but as of May 2026 nothing has been announced.
- **Stopover and open-jaw rules are not relevant** since redemptions price like cash against the fare.
- **Allegiant acquisition expected to close in 2Q 2026** (as early as mid-May, after May 8 shareholder votes). Sun Country Rewards and Allegiant Allways Rewards will operate as separate programs at close, with eventual integration but no firm timeline.
- **Points + cash combos** are explicitly allowed - mix points and dollars on one booking.
- **No fuel surcharges or carrier-imposed surcharges** on award bookings, since the program prices like cash against the fare.',
  award_chart = '## Sun Country Rewards redemption structure (no chart)

Sun Country''s program is fixed-value, not chart-based. There is no award chart, no zones, no peak/off-peak pricing, no blackout dates.

| Item | Cost in points | Cost in dollars |
|---|---|---|
| Any Sun Country flight | (cash price) x 100 | (cash price) |
| Vacation package | (cash price) x 100 | (cash price) |
| Seat selection | (cash price) x 100 | (cash price) |
| Bag fees | (cash price) x 100 | (cash price) |

**Conversion rate:** 1 point = $0.01. So 5,000 points = $50 toward any Sun Country purchase.

**Earn rates (base member):**
- 2 points per $1 on direct bookings (suncountry.com, mobile app, call center)
- 1 point per $1 on third-party bookings

**Earn rates (Plus member):**
- 3 points per $1 on direct bookings (base 2 pts/$ + 50% Plus bonus of 1 pt/$)

**Earn rates (Sun Country Visa Signature cardholder):**
- Up to 5 points per $1 on Sun Country purchases (3x with the card + 2x when you fly)
- Up to 6 points per $1 on Sun Country purchases for Plus-status cardholders (3x card + 3x Plus-bonused fly)
- 2 points per $1 on gas station and grocery store purchases
- 1 point per $1 on all other purchases

**No partner award redemptions** - Sun Country Rewards points only redeem on Sun Country. No alliance, no codeshare partners.',
  partner_chart_url = 'https://www.suncountry.com/help-center/sun-country-rewards',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'sun-country';

-- Step 5.5 partner_redemptions seed
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Economy', 'All Sun Country routes (cash-equivalent)', 'dynamic',
  'Sun Country Rewards points redeem at a fixed 1 point = $0.01 toward any Sun Country purchase, including base fare, taxes, fees, bags, and seats. No award chart, no zones, no blackout dates, no fuel surcharges. No partner redemptions - Sun Country Rewards points only redeem on Sun Country. See suncountry.com/help-center/sun-country-rewards for details.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'sun-country'
on conflict do nothing;
