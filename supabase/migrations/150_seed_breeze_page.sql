-- Seed Breeze Airways Breezy Rewards full program page.
--
-- Authored 2026-05-05. Sources: official Breeze scrapes (rewards info,
-- Barclays card page, news feed) + WebSearch (TPG, Upgraded Points,
-- AwardWallet, NerdWallet, Frequent Miler, Aviation Week, Travel Weekly).
-- Cross-fact-checked via Copilot + ChatGPT 2026-05-05.
--
-- Notes on shape:
-- - alliance = 'none' (standalone, no alliance, no codeshares)
-- - transfer_partners = [] (no flexible-currency transfers)
-- - tier_benefits = 4 tiers (Breezy 1/2/3/Club) launched Jan 1, 2026
-- - lounge_access stub (no own-brand lounges, no partner lounges)
-- - award_chart frames the program as a fixed-value rebate (1 BreezePoint =
--   at least $0.01; sometimes more on Reward Travel options)

update programs set
  alliance = 'none',
  hubs = array['TPA','CHS','ORF','MSY','BDL','PVU','VRB','CAK'],
  intro = 'Breeze Airways is a US ULCC founded by JetBlue founder David Neeleman in 2021, focused on connecting underserved mid-size cities directly without forcing connections through legacy hubs. As of May 2026, Breeze flies from about 86 airports across the US, Mexico, the Bahamas, Jamaica, the Dominican Republic, and Costa Rica. Primary operating bases are Tampa (TPA), Charleston (CHS), Norfolk (ORF), and New Orleans (MSY), with additional operational bases at Hartford (BDL), Provo (PVU), Vero Beach (VRB), and Akron-Canton (CAK).

On January 1, 2026, Breeze launched a major Breezy Rewards revamp - four elite tiers (Breezy 1/2/3/Club), a multi-use Buddy Discount that scales with tier, and meaningful at-the-airport perks like complimentary WiFi and Zone 1 boarding for status holders. The program is fixed-value at a baseline of 1 BreezePoint = $0.01 toward any Breeze purchase, though Breeze''s Reward Travel options can occasionally yield more than 1 cent per point on certain flights. There''s no alliance, no lounges, no codeshares, and no transfer partners from Amex MR, Chase UR, Citi TYP, Capital One Miles, or Bilt. The Barclays-issued Breeze Easy Visa Signature is the main earn accelerator and the only path to non-expiring points.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Breeze flights** - any route, any date, any fare bundle. 1 BreezePoint = $0.01 (or sometimes more on Reward Travel) off the cash price.
- **Bundle upgrades, bag fees, seat selection** - points cover all of these the same way they cover the fare.
- **Points + cash combos** - mix points and dollars on a single booking.
- **No partner redemptions** - BreezePoints only redeem on Breeze. No alliance bookings, no codeshare partners, no off-network redemptions.
- **No transfers out** - you cannot transfer BreezePoints to other airline or hotel programs.',
  sweet_spots = '- **The "no chart" sweet spot is the Reward Travel option.** When you redeem points on Reward Travel rather than just offsetting the cash price one-for-one, certain flights price below the cash equivalent - effectively giving you better than 1 cent per point. The exact menu varies by route and date, so check both options when redeeming.
- **Card-earned status** - the Breeze Easy Visa generates status-qualifying points on card spend, not just rewards points. With Breezy 1 starting at 15,000 points and the card earning up to 10X on Nicer/Nicest Bundles, you can punch through to status quickly if you book a few mid-bundle Breeze trips a year.
- **Buddy Discount stacking** - Breezy Club gets a 100% companion discount that''s multi-use. If you fly Breeze enough to hit 120,000 points in a year, the companion fare effectively halves your travel costs for the rest of that year and all of next.
- **Status carryover** - hit a tier this year and you keep it through the rest of the qualifying calendar year plus all of the following calendar year. Earn Breezy Club in December and you have effective Club status for ~13 months.
- **Bundle math matters at redemption time, not just earn time** - higher Bundles (Nicer/Nicest) include more inclusions (bag, seat, change flexibility) that you''d otherwise pay separately. When you redeem, paying with points for a higher Bundle can be more efficient than buying No Flex and adding a la carte.',
  tier_benefits = '[
    {"name":"Breezy 1","qualification":"15,000 BreezePoints earned in a calendar year","benefits":["Complimentary WiFi on Breeze-operated flights","Bonus BreezePoints on paid flights","Zone 1 boarding (or better)","One Bundle Upgrade per qualifying year"]},
    {"name":"Breezy 2","qualification":"30,000 BreezePoints earned in a calendar year","benefits":["All Breezy 1 benefits","Priority Guest Support","Breezy Select Benefits: choose 1 of (extra Bundle Upgrades, bonus BreezePoints, or a 25% Buddy Discount on a companion''s fare)","Buddy Discount is multi-use during the qualification year"]},
    {"name":"Breezy 3","qualification":"60,000 BreezePoints earned in a calendar year","benefits":["All Breezy 2 benefits","Breezy Select Benefits with a 50% Buddy Discount option (multi-use)","Higher allotment of Bundle Upgrades or bonus points if those Select options are chosen instead"]},
    {"name":"Breezy Club","qualification":"120,000 BreezePoints earned in a calendar year","benefits":["All Breezy 3 benefits","Breezy Select Benefits with a 100% Buddy Discount option (multi-use)","Top-tier allotment of Bundle Upgrades or bonus BreezePoints"]}
  ]'::jsonb,
  lounge_access = 'Breeze does not operate any of its own airport lounges. Breeze is not a member of any alliance (oneworld, SkyTeam, Star Alliance) and has no lounge-access reciprocity with other carriers.

If you are flying Breeze out of an airport that has a third-party lounge program (Priority Pass, Plaza Premium, Capital One Lounges, Amex Centurion, Chase Sapphire Lounges, Delta Sky Club through co-brand cards, etc.), access depends on the lounge''s entry rules and your card or membership - not on your Breezy Rewards status, because Breezy Rewards does not confer any third-party lounge benefits.

The closest in-airport perks Breezy Rewards offers are **Zone 1 priority boarding for status holders** (and for Breeze Easy Visa cardmembers) and **Priority Guest Support for Breezy 2 and above**. Neither of those is a lounge.',
  quirks = '- **BreezePoints expire 24 months after they are earned** for non-cardholders. Cardmembers'' points do not expire as long as the Breeze Easy Visa account is open and in good standing.
- **No family pooling.** Breezy Rewards has not published a pooling or household feature. Each member earns and redeems on their own account.
- **Card spend earns status-qualifying points** for Breezy 1/2/3/Club elite tiers. This is one of the lower-spend paths to elite status on any US carrier - 15,000 points to start at Breezy 1.
- **Status carryover:** earn a tier in a given calendar year and you keep it for the rest of that year plus all of the following calendar year.
- **Stopover and open-jaw rules are not relevant** since Breeze flies point-to-point and redemptions price like cash against the fare.
- **No own-brand or alliance lounges** - Breeze does not operate or partner with any lounges.
- **Reward Travel can exceed 1 cent per point** on certain routes/dates. Always check both standard 1-cent-per-point redemption and the Reward Travel menu before booking.
- **Bundle-based earning** - your earn rate per dollar depends on the fare bundle you book (No Flex / Nice / Nicer / Nicest), not a flat per-dollar number. Higher bundles earn more.',
  award_chart = '## Breezy Rewards redemption structure (no chart)

Breezy Rewards is fixed-value, not chart-based. There is no award chart, no zones, no peak/off-peak pricing, no blackout dates.

| Item | Cost in BreezePoints | Cost in dollars |
|---|---|---|
| Any Breeze flight (cash-equivalent) | (cash price) x 100 | (cash price) |
| Bundle upgrade | (cash price) x 100 | (cash price) |
| Seat selection | (cash price) x 100 | (cash price) |
| Bag fees | (cash price) x 100 | (cash price) |
| Reward Travel (alternate redemption menu) | varies; often less than cash-equivalent | varies |

**Conversion rate:** 1 BreezePoint = $0.01 on cash-equivalent redemptions, sometimes more on Reward Travel.

**Earn rates:**
- Bundle-based per dollar (No Flex / Nice / Nicer / Nicest); higher bundles earn more BreezePoints per dollar
- Eligible add-ons (bags, seats) earn BreezePoints based on the underlying bundle/fare type
- Status holders get bonus points on paid flights (varies by tier)

**Earn rates with the Breeze Easy Visa Signature card:**
- Up to 10X BreezePoints on Nicer and Nicest Bundles
- Up to 4X BreezePoints on Nice Bundles
- 2X BreezePoints on dining and grocery
- 1X BreezePoints on all other purchases
- Card-earned BreezePoints count as status-qualifying points for Breezy 1/2/3/Club

**No partner award redemptions** - BreezePoints only redeem on Breeze. No alliance, no codeshare partners.',
  partner_chart_url = 'https://www.flybreeze.com/breezy-rewards-info',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'breeze';

-- Step 5.5 partner_redemptions seed
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Economy', 'All Breeze routes (cash-equivalent + Reward Travel menu)', 'dynamic',
  'BreezePoints redeem at a baseline of 1 point = $0.01 toward any Breeze purchase (cash-equivalent), or via the Reward Travel menu which can yield more than 1 cent per point on certain routes/dates. No award chart, no zones, no blackout dates, no fuel surcharges. No partner redemptions - BreezePoints only redeem on Breeze. See flybreeze.com/breezy-rewards-info for details.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'breeze'
on conflict do nothing;
