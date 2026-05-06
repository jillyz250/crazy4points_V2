-- Seed Turkish Airlines Miles&Smiles full program page (Batch A #11).
--
-- Authored 2026-05-06. Sources: official turkishairlines.com pages (5/6
-- scrapes succeeded) + Copilot Master Fact Sheet + 2026-dated travel pubs.
--
-- Two devaluations bracket the program:
--   - February 2024: First major chart devaluation across all regions.
--   - December 2025: Partner domestic awards +50%; new higher Hawaii zone
--     (eliminating the previous mainland-Hawaii sweet spot).
-- Plus the August 2024 SAS partnership termination.
-- Plus April 2026 ITA Airways joining Star Alliance + earn/redeem partner.

update programs set
  alliance = 'star_alliance',
  hubs = array['IST'],
  intro = 'Turkish Airlines Miles&Smiles is the loyalty program of Turkish Airlines (TK), a Star Alliance member since 2008 with its hub at Istanbul Airport (IST). Turkish flies to **more countries (130+) than any other airline in the world** - over 340 destinations, 11+ US gateways, and a uniquely deep network through Istanbul into Africa, the Middle East, Central Asia, and South Asia.

For US-based readers, Miles&Smiles has a defining sweet spot: **US-Istanbul Business class at 55,000 miles one-way Promo (Saver)** with low fuel surcharges on TK metal. That''s one of the best transatlantic Business redemptions in any loyalty program - cash equivalents run $5,000-7,000+, and unlike Lufthansa Group on Miles & More, TK keeps surcharges modest (typically $50-150 one-way).

Miles&Smiles transfers 1:1 from **Citi ThankYou** (premium cards), **Capital One Miles**, and **Bilt Rewards** - among the most useful Star Alliance currencies for Citi cardholders specifically. Amex and Chase do NOT transfer.

The program had two devaluations in two years - **February 2024** and **December 2025**. The December 2025 round raised partner domestic awards ~50% and split Hawaii into its own (much higher) zone, eliminating the previously-popular US-mainland-Hawaii sweet spot. Confirm pricing on turkishairlines.com before transferring points; do not stockpile speculatively.',
  transfer_partners = '[
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"1:1 with premium ThankYou cards (Strata Premier, Strata Elite). 1:0.7 with no-AF Citi cards. Citi periodically runs 25-30% transfer bonuses to TK.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"Direct 1:1. No tax. Cards: Venture X, Venture, Spark Miles.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"Direct 1:1. Rent Day 2x bonuses periodically (1st of each month).","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K TK miles (5K bonus on every 60K). Effective rate ~2.6:1. Generally only useful as a top-up.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **US-Istanbul Business class on TK metal at 55,000 miles one-way Promo** - the marquee sweet spot. Low TK surcharges keep all-in cost dramatically lower than the same flight via Lufthansa M&M.
- **US-Europe via IST (two segments)** at 70,000-78,000 miles Business one-way Promo. Cumulative segment-based pricing on TK-operated awards.
- **US-Middle East / India via IST** at 78,000-100,000 miles Business one-way. Excellent for Dubai, Tel Aviv, Amman, Delhi, Mumbai.
- **US-Africa via IST** at 100,000-120,000 miles Business one-way. Nairobi, Johannesburg, Lagos.
- **Intra-Turkey domestic** at 7,500-12,500 miles one-way (Economy / Business). Cheap hops once in Istanbul.
- **Star Alliance partner awards** at fixed-chart pricing - 1,000+ lounges on partner alliance carriers. Note partner-specific surcharge variations (Lufthansa Group passes through high YQ; Avianca / Aegean / Singapore typically lower).',
  sweet_spots = '- **US-Istanbul Business at 55,000 miles Promo** is the marquee redemption - one of the best transatlantic premium-cabin sweet spots in any program. Low TK surcharges ($50-150 one-way) make all-in cost dramatically lower than booking the same Star Alliance Business via Lufthansa M&M.
- **Free Istanbul stopover on round-trip awards** lets you visit Turkey for a few days while connecting onward. Combine US-IST-Dubai or US-IST-Delhi to maximize value.
- **Citi 1:1 with periodic 25-30% transfer bonuses** is the cleanest US transfer path. Time large transfers to bonus windows.
- **Star Alliance Gold via Elite tier** (40,000 Status Miles in 12 months) is attainable via 3-4 round-trip Business class trips on TK + partners. Gold unlocks 1,000+ Star Alliance lounges including United Clubs.
- **TK premium product is highly rated** - lie-flat 787-9 / A350-900 Business with Do&Co catering. Often cited among the world''s best Business class.
- **Domestic Turkey at 7,500 miles** is cheap regional positioning.',
  tier_benefits = '[
    {"name":"Classic","qualification":"Free auto-enrollment.","benefits":["Earn + redeem miles","3-year mile validity from earn date","Unlimited messaging Wi-Fi onboard","Member-only offers"]},
    {"name":"Classic Plus","qualification":"25,000 Status Miles in a rolling 12-month window","benefits":["Star Alliance Silver","Lounge access on TK domestic flights","Business class counter check-in (domestic)","250 MB + messaging Wi-Fi","+10 kg extra checked baggage (weight-concept routes)","Up to 1.5x bonus miles on international Business"]},
    {"name":"Elite","qualification":"40,000 Status Miles in a rolling 12-month window","benefits":["Star Alliance Gold","Lounge access on TK domestic + international + 1,000+ Star Alliance partner lounges worldwide for member + family/1 guest","Priority boarding and baggage","IST passport fast-track","400 MB + messaging Wi-Fi (Economy), unlimited (Business)","+20 kg or 1 extra piece extra checked baggage","Meal preference","Up to 1.75x bonus miles on international Business"]},
    {"name":"Elite Plus","qualification":"80,000 Status Miles in a rolling 12-month window","benefits":["All Elite benefits","Dedicated IST entrance","Free sport-equipment carriage (domestic)","Complimentary standard + front-row seat selection","2 cabin-upgrade vouchers per qualifying year","Upgrade waitlist feature (added Feb 2026)","+25 kg or 1 extra piece extra checked baggage","Guaranteed seat","50% discount on second ticket with paid Business class fare","Celebration cake on board"]}
  ]'::jsonb,
  lounge_access = 'Turkish Airlines operates the **Turkish Airlines Lounge** (Business class) network at IST and select international gateways. The IST lounge is widely regarded among the world''s best - a sprawling multi-level facility with golf simulators, a model train, gourmet dining, dedicated sleeping pods, and a children''s play area.

Access rules:
- **Same-day TK / Star Alliance flight + Star Alliance Gold (Elite or Elite Plus)** - TK lounge access at IST + Star Alliance Gold lounges worldwide for member + 1 guest, any cabin.
- **Same-day TK Business class boarding pass** - TK lounge access in any context.
- **Same-day TK / Star Alliance flight + Star Alliance Silver (Classic Plus)** - TK domestic lounge access only (not international).
- **Premium Economy / Economy on TK alone** - no lounge access without status.

The Turkish Premier Visa Signature US co-brand card grants TK lounge access when flying TK as primary cardholder.',
  quirks = '- **Mile expiry: 3 years from the date earned**, with no extension via activity. Miles can be extended for a fee.
- **Star Alliance Gold via Elite tier** (40,000 Status Miles in 12 months) is one of the more attainable paths to alliance-wide Gold benefits. Frequent US-IST travelers can hit it in 3-4 Business class round-trips.
- **Status validity: 2 years** once earned. Maintain via protection thresholds (lower than initial qualification) to avoid losing status.
- **Free Istanbul stopover** on round-trip awards.
- **Low fuel surcharges on TK-operated metal** ($50-150 one-way US-IST). Star Alliance partner awards through TK pass through partner surcharges - high on Lufthansa Group, low on Avianca / Aegean / Singapore.
- **Cumulative segment-based pricing on TK-operated awards** (e.g., US-IST-onward priced as US + intra-Europe segments combined).
- **December 2025 devaluation** raised partner domestic awards ~50% and created a new higher Hawaii zone (Economy up to 25K, Business up to 40K one-way) - eliminating the previously popular US-mainland-Hawaii sweet spot via Turkish.
- **August 2024: SAS partnership terminated.** No earn/redeem on SAS via TK.
- **April 1, 2026: ITA Airways joined Star Alliance** + Miles&Smiles earn/redeem partner. New Italian domestic + European routings.
- **Most partner award bookings (except Star Alliance majors) require phone booking** - the online tool doesn''t always show all partner segment availability.
- **Star Alliance flights credited to Miles&Smiles** earn miles + Status Miles, but only TK-operated flights count toward the SAS-replaced ITA partner option for partner-bonus earning.
- **Two devaluations in under 2 years** (Feb 2024, Dec 2025) signal active repricing. Do not stockpile Miles&Smiles - transfer points only when you have a specific booking ready.',
  award_chart = '## Miles&Smiles redemption structure

Turkish uses **two parallel charts**:

| Chart | Routes | Pricing model |
|---|---|---|
| **TK-Operated Award Chart** | Turkish Airlines + Anadolujet metal | Cumulative segment-based; Promo (Saver) / Standard / Last-Seat tiers |
| **Star Alliance Partner Award Chart** | Star Alliance + bilateral partners | Distance / region-based fixed rates |

**Carrier-imposed surcharges (YQ):** LOW on TK-operated metal (typically $50-150 one-way US-IST). Star Alliance partner awards pass through partner surcharges - high on Lufthansa Group, generally low on Avianca / Aegean / Singapore / United.

**Free Istanbul stopover** on round-trip awards.

**Promo (Saver) awards** are the lowest-priced tier with limited inventory. Standard awards are priced higher with wider availability. Last-Seat awards are highest-priced with most availability.

### TK-Operated Award Chart - key US routes (one-way Promo)

| Route | Economy | Business | Notes |
|---|---|---|---|
| US -> Istanbul (IST) | 30,000-35,000 | 55,000 | Marquee sweet spot - low TK surcharges |
| US -> Europe (via IST) | 40,000-45,000 | 70,000-78,000 | Cumulative segment pricing |
| US -> Middle East (via IST) | 40,000-45,000 | 78,000 | Dubai, Tel Aviv, Amman |
| US -> South Asia (via IST) | 50,000-55,000 | 90,000-100,000 | Delhi, Mumbai, Colombo |
| US -> Africa (via IST) | 55,000-65,000 | 100,000-120,000 | Nairobi, Johannesburg, Lagos |
| Intra-Turkey domestic | 7,500 | 12,500 | Cheap hops |
| IST -> Europe short-haul | 12,500-15,000 | 25,000-30,000 | London, Paris, Rome |
| IST -> Middle East | 15,000 | 28,000 | Dubai, Doha at strong rates |

### December 2025 Devaluation Impact
- Partner domestic awards (United US-domestic, etc.) raised ~50%
- New Hawaii zone created: Economy up to 25,000, Business up to 40,000 one-way (eliminating the prior 10K mainland-Hawaii sweet spot)

### Earning rates on TK international flights (% of distance)
- Economy Y/B/M/K/A/H (Full / Flex): 125%
- Economy S/T/L/E/Q (Discounted): 50%
- Economy W/O/V (Promo / Deep Discount): 25%
- Business C/D (Full): 150% (Classic) / up to 175% (Elite Plus)
- Business J/Z (Discounted): 135% (Classic) / up to 160% (Elite Plus)

Minimum miles per segment: 1,250 (Economy) / 1,500 (Business).

### US co-brand card
**Turkish Airlines Miles&Smiles Premier Visa Signature** ($99 annual fee):
- 3x miles on TK purchases
- 2x miles on grocery, dining, entertainment, lodging
- 1x on all other purchases
- TK lounge access when flying Turkish (primary cardholder)

### What does NOT transfer to Miles&Smiles
- **American Express Membership Rewards** - no direct transfer
- **Chase Ultimate Rewards** - no direct transfer
- **US Bank Altitude Reserve** - announced 2025, never launched any partners
- **Bank of America Premium Rewards** - has never been a transferable-points program

**Official chart:** https://www.turkishairlines.com/en-us/miles-and-smiles/award-tickets/',
  partner_chart_url = 'https://www.turkishairlines.com/en-us/miles-and-smiles/award-tickets/',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'turkish';

-- Step 5.5 partner_redemptions
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'TK + Star Alliance partner awards (cumulative segment + fixed chart)', 'fixed',
  'Miles&Smiles uses TK-operated cumulative segment pricing (Promo/Standard/Last-Seat) and fixed Star Alliance partner chart. LOW YQ on TK metal ($50-150 US-IST one-way). Partner YQ varies sharply: high on Lufthansa Group, low on Avianca/Aegean/Singapore/United. Dec 2025 devaluation: partner domestic +50%, new Hawaii zone. Aug 2024: SAS partnership ended. Apr 2026: ITA joined.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'turkish' and c.slug in ('turkish','united','lufthansa','swiss','austrian','sas','singapore_airlines','ana','eva','asiana','tap','avianca','copa','air-china','ethiopian','egyptair')
on conflict do nothing;
