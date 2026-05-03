-- 077_voice_pass_aa_partner_redemptions.sql
-- Voice pass on AA-related partner_redemptions teach_captions and routing_rules
-- to align with the brand voice (utils/ai/editorialRules.ts BRAND_VOICE):
-- traveler-friend tone, contractions, no AI-shorthand or corporate hedging.
--
-- Scope: AA-as-operator and AA-as-currency rows authored in 071-073 plus the
-- forward-direction 072 captions that read like internal notes ("Hall-of-fame
-- sweet spot", "Functional duplicate", "Phone booking expected").

do $$
declare
  aa_id uuid;
begin
  select id into aa_id from programs where slug = 'aa';
  if aa_id is null then raise exception 'aa missing'; end if;

  -- ─── AAdvantage own metal (forward) ──────────────────────────────────────
  update partner_redemptions
     set teach_caption = 'Use AAdvantage when partner saver dries up. It''s rarely the cheapest, but AA''s own search sees inventory partners can''t.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and cabin = 'Economy' and region_or_route = 'US short-haul (saver + Web Specials)';

  update partner_redemptions
     set teach_caption = 'Wide swing on transcon  -  Web Specials sometimes drop into the teens. Use AAdvantage when partners can''t see the seat.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and cabin = 'Economy' and region_or_route = 'US transcon (saver + Web Specials)';

  update partner_redemptions
     set teach_caption = 'Fallback only. When saver J is open, partners price US-Europe at 57.5k  -  meaningfully cheaper than 120k AAdvantage.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and cabin = 'Business' and region_or_route = 'US to Europe';

  update partner_redemptions
     set teach_caption = 'Almost never the right call. Partner programs price F much lower when space exists.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and cabin = 'First' and region_or_route = 'Long-haul (US to Asia / EU)';

  -- ─── AAdvantage -> Alaska Atmos (forward, within NA) ─────────────────────
  update partner_redemptions
     set teach_caption = 'Atmos itself prices the same flight as low as 4.5k  -  use those instead if you have them.'
   where currency_program_id = aa_id
     and cabin = 'Economy' and region_or_route = 'Within North America';

  update partner_redemptions
     set teach_caption = 'Atmos beats this by a lot on AA domestic J. Use AAdvantage only if your Atmos balance is empty.'
   where currency_program_id = aa_id
     and cabin = 'Business' and region_or_route = 'Within North America';

  update partner_redemptions
     set teach_caption = 'Atmos prices F much lower. Use AAdvantage as a last resort.'
   where currency_program_id = aa_id
     and cabin = 'First' and region_or_route = 'Within North America';

  -- ─── AAdvantage -> BA (forward, NA-EU) ───────────────────────────────────
  update partner_redemptions
     set teach_caption = 'AA charges no fuel surcharge in miles, but BA passes hefty cash surcharges on its own metal. Expect $300-700 in fees one-way.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'british_airways')
     and cabin = 'Economy' and region_or_route = 'North America to Europe';

  update partner_redemptions
     set teach_caption = 'Surcharges hit hard on BA premium. When J is open, Iberia or Aer Lingus same chart with no surcharges is the smart move.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'british_airways')
     and cabin = 'Premium Economy' and region_or_route = 'North America to Europe';

  update partner_redemptions
     set teach_caption = '57.5k AA J to Europe is one of the great fixed rates left  -  but BA fuel surcharges can run $700+. Iberia or Aer Lingus same price, no surcharges.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'british_airways')
     and cabin = 'Business' and region_or_route = 'North America to Europe';

  update partner_redemptions
     set teach_caption = 'Surcharges on BA F often run $1,000+. Worth it for the seat, but check the cash co-pay before you commit.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'british_airways')
     and cabin = 'First' and region_or_route = 'North America to Europe';

  -- ─── AAdvantage -> Cathay (forward) ──────────────────────────────────────
  update partner_redemptions
     set teach_caption = '70k AA J to HKG is a legendary fixed rate. Cathay still has saver space  -  search aa.com directly.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'cathay_pacific')
     and cabin = 'Business' and region_or_route = 'North America to Asia (SE Asia / China)';

  update partner_redemptions
     set teach_caption = 'Cathay F is one of the great products in the sky. Availability is the real ceiling  -  when it opens, book fast.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'cathay_pacific')
     and cabin = 'First' and region_or_route = 'North America to Asia (SE Asia / China)';

  -- ─── AAdvantage -> JAL (forward) ─────────────────────────────────────────
  update partner_redemptions
     set teach_caption = '60k AA J on JAL is the best fixed rate in the game for US-Japan. Don''t sleep on it.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'japan_airlines')
     and cabin = 'Business' and region_or_route = 'North America to Asia (Japan / Korea)';

  update partner_redemptions
     set teach_caption = 'JAL Suites at 80k is industry-leading. Set an availability alert  -  it goes fast.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'japan_airlines')
     and cabin = 'First' and region_or_route = 'North America to Asia (Japan / Korea)';

  -- ─── AAdvantage -> Qatar (forward) ───────────────────────────────────────
  update partner_redemptions
     set teach_caption = 'Qsuite for 70k AA  -  one of the strongest J redemptions on the planet. Availability is solid.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'qatar_airways')
     and cabin = 'Business' and region_or_route = 'North America to Middle East / India';

  -- ─── AAdvantage -> Etihad (forward; phone-only) ──────────────────────────
  update partner_redemptions
     set teach_caption = 'Etihad is bookable with AA, but you''ll need to call. Plan a 30-60 minute hold time.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'etihad')
     and cabin = 'Economy' and region_or_route = 'North America to Middle East / India';

  update partner_redemptions
     set teach_caption = 'Etihad''s J Apartments are world-class. Get comfy on the phone  -  the agent has to ticket it manually.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'etihad')
     and cabin = 'Business' and region_or_route = 'North America to Middle East / India';

  update partner_redemptions
     set teach_caption = 'Etihad Apartments territory. The miles are fine; finding a seat is the actual challenge.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'etihad')
     and cabin = 'First' and region_or_route = 'North America to Middle East / India';

  -- ─── AAdvantage -> Qantas (forward) ──────────────────────────────────────
  update partner_redemptions
     set teach_caption = '80k J to Australia is excellent  -  when you can find it. Search 330+ days out.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'qantas')
     and cabin = 'Business' and region_or_route = 'North America to South Pacific (Australia / NZ)';

  update partner_redemptions
     set teach_caption = 'A380 First on Qantas is rare gold. Some routes go years without a single saver seat.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'qantas')
     and cabin = 'First' and region_or_route = 'North America to South Pacific (Australia / NZ)';

  -- ─── AAdvantage -> Aer Lingus (forward) ──────────────────────────────────
  update partner_redemptions
     set teach_caption = 'No fuel surcharges via Dublin. Strong alternative to BA when AA shows EI saver.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'aer_lingus')
     and cabin = 'Economy' and region_or_route = 'North America to Europe';

  update partner_redemptions
     set teach_caption = 'Lay-flat J via Dublin, no fuel surcharges. Sweet spot for transatlantic premium.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'aer_lingus')
     and cabin = 'Business' and region_or_route = 'North America to Europe';

  -- ─── AAdvantage -> Iberia (forward) ──────────────────────────────────────
  update partner_redemptions
     set teach_caption = 'Iberia J to Madrid is a fan favorite  -  57.5k AA, no surcharges, decent award space.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'iberia')
     and cabin = 'Business' and region_or_route = 'North America to Europe';

  -- ─── AAdvantage -> Finnair (forward) ─────────────────────────────────────
  update partner_redemptions
     set teach_caption = 'Finnair J to Europe via Helsinki  -  57.5k AA, no surcharges, often quieter award space than BA.'
   where currency_program_id = aa_id
     and operating_carrier_id = (select id from programs where slug = 'finnair')
     and cabin = 'Business' and region_or_route = 'North America to Europe';

  -- ─── Reverse direction: programs booking AA ─────────────────────────────

  -- Atmos -> AA (reverse): leave the ones we already cleaned in 075 alone
  update partner_redemptions
     set teach_caption = 'Solid mid-distance value when AA shows saver. BA Avios may beat it on a nonstop, but loses the moment you connect.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'atmos')
     and cabin = 'Economy' and region_or_route = 'AA medium-haul (~701-1400 mi)';

  update partner_redemptions
     set teach_caption = 'Often the best AA domestic premium booker  -  AAdvantage J is rarely competitive at this distance.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'atmos')
     and cabin = 'Business' and region_or_route = 'AA domestic';

  update partner_redemptions
     set teach_caption = 'Top pick for AA domestic F when saver shows.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'atmos')
     and cabin = 'First' and region_or_route = 'AA domestic';

  -- JAL -> AA (reverse, round-trip biased)
  update partner_redemptions
     set teach_caption = 'Round-trip required. Niche play  -  useful when AA shows partner saver in both directions.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'jal')
     and cabin = 'Economy' and region_or_route = 'AA short-haul (round-trip)';

  update partner_redemptions
     set teach_caption = 'Solid long-haul J round-trip when AA J availability lines up both ways.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'jal')
     and cabin = 'Business' and region_or_route = 'AA long-haul (round-trip)';

  update partner_redemptions
     set teach_caption = 'Premium F for round-trip flyers. Availability is the bottleneck, not the price.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'jal')
     and cabin = 'First' and region_or_route = 'AA long-haul (round-trip)';

  -- Etihad -> AA (reverse, phone-only, devalued)
  update partner_redemptions
     set teach_caption = 'Used to be a sweet spot. Now phone-only via Etihad''s call center, with pricing that shifts by route and date.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'etihad')
     and cabin = 'Economy' and region_or_route = 'AA US domestic';

  update partner_redemptions
     set teach_caption = 'Situational. Atmos usually beats it for AA domestic J in 2026.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'etihad')
     and cabin = 'Business' and region_or_route = 'AA US domestic';

  update partner_redemptions
     set teach_caption = 'Devalued from past years. Spot-check availability before you transfer in.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'etihad')
     and cabin = 'First' and region_or_route = 'AA US domestic';

  update partner_redemptions
     set teach_caption = 'Decent rate on paper, but the phone-only friction is real. Aer Lingus or BA is usually the smarter J move.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'etihad')
     and cabin = 'Business' and region_or_route = 'AA US to Europe';

  -- Cathay -> AA (reverse)
  update partner_redemptions
     set teach_caption = 'Strong for complex long-haul J with stopovers. Online booking is partial  -  some routings need a phone call.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'cathay')
     and cabin = 'Business' and region_or_route = 'AA long-haul';

  update partner_redemptions
     set teach_caption = 'Elite F territory. Confirm AA F availability before you transfer Asia Miles in  -  those points don''t come back.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'cathay')
     and cabin = 'First' and region_or_route = 'AA long-haul';

  -- Qantas -> AA (reverse)
  update partner_redemptions
     set teach_caption = 'Qantas distance chart prices the whole journey, not per-segment. Beats BA Avios when there''s a connection.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'qantas')
     and cabin = 'Economy' and region_or_route = 'AA short-haul';

  update partner_redemptions
     set teach_caption = 'Qantas uses total-distance pricing. Search qantas.com partner awards for the exact rate on your route.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'qantas')
     and cabin = 'Economy' and region_or_route = 'AA medium-haul / transcon';

  update partner_redemptions
     set teach_caption = 'Qantas J on AA exists  -  search qantas.com partner awards for the live rate on your route.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'qantas')
     and cabin = 'Business' and region_or_route = 'AA domestic / transcon';

  -- SriLankan -> AA (reverse)
  update partner_redemptions
     set teach_caption = 'Niche. Useful for connecting to the Indian subcontinent via Colombo. Limited online  -  call AA.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'srilankan')
     and cabin = 'Economy' and region_or_route = 'AA short-haul (SE Asia / China)';

  update partner_redemptions
     set teach_caption = 'Phone booking expected and inventory''s thin. Skip unless you specifically need the SriLankan routing.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'srilankan')
     and cabin = 'Business' and region_or_route = 'AA short-haul (SE Asia / China)';

  -- Finnair -> AA (reverse)
  update partner_redemptions
     set teach_caption = 'Region-based, not distance  -  transcon costs more than short-haul on AA. AwardWallet 2026 confirms 16,500 Avios.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'finnair')
     and cabin = 'Economy' and region_or_route = 'AA US transcon';

  update partner_redemptions
     set teach_caption = 'Finnair Plus uses regions, not distance. Check finnair.com directly  -  short-haul AA isn''t cleanly published.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'finnair')
     and cabin = 'Economy' and region_or_route = 'AA short-haul (US domestic short)';

  update partner_redemptions
     set teach_caption = 'Finnair J on AA exists, but the transcon rate moves with booking date. Check finnair.com for the current ask.'
   where operating_carrier_id = aa_id
     and currency_program_id = (select id from programs where slug = 'finnair')
     and cabin = 'Business' and region_or_route = 'AA US transcon';
end $$;
