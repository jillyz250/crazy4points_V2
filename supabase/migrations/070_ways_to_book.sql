-- 070_ways_to_book.sql
-- Schema foundation for the Ways To Book tool (/tools/ways-to-book).
-- Plan: plans/ways-to-book-tool.md
--
-- This migration:
--   1. Adds operator-level partner_access flags to programs (graded enum,
--      not the original binary flag — see plan section 3a for tier defs).
--   2. Adds saver_search_url_template to programs for "check saver here"
--      deep links in the tool's pre-check step.
--   3. Extends partner_redemptions (already created in 067) with the
--      metadata fields the Ways To Book tool needs that the Alliance
--      Explorer doesn't: saver-space requirements, fuel surcharges,
--      online bookability, channel, routing quirks, teach caption,
--      verified-by attribution.
--   4. Seeds partner_access for the 13 Tier 1 operators (data verified
--      via 2026 ChatGPT pass — see plan section 9).
--
-- Coexists with all existing partner_redemptions consumers (Alliance
-- Explorer at /tools/alliances, per-airline page sections). New columns
-- are nullable; existing code paths unaffected.
--
-- Slug convention note: this codebase uses underscores for airline slugs
-- (aa, united, delta, british_airways) — NOT kebab-case. Carrier and
-- loyalty-program rows are separate where the program serves multiple
-- carriers (BA -> ba_avios, JAL -> jal, AF/KL -> separate carriers).
-- partner_access is set on the CARRIER row (the airline you fly).

-- ============================================================================
-- Section 1: programs operator-level fields
-- ============================================================================

alter table programs
  add column if not exists partner_access text
    check (partner_access is null or partner_access in (
      'YES_STRONG', 'YES_LIMITED', 'YES_RESTRICTED', 'HYBRID', 'NO'
    )),
  add column if not exists partner_access_notes text,
  add column if not exists saver_search_url_template text;

comment on column programs.partner_access is
  'Operator-level flag: how reliably this airline releases partner-bookable saver award space. Used by the Ways To Book tool to badge each operator and decide whether to show a partner ranking. Null until verified.';
comment on column programs.partner_access_notes is
  'One-line nuance behind the partner_access flag. Surfaced as a caveat under the operator badge.';
comment on column programs.saver_search_url_template is
  'Deep-link template for the operator official award search. Tokens: {origin}, {destination}, {date}. Used by the tool pre-check step.';

-- ============================================================================
-- Section 2: partner_redemptions extensions
-- ============================================================================

alter table partner_redemptions
  add column if not exists fuel_surcharges text
    check (fuel_surcharges is null or fuel_surcharges in ('none', 'low', 'high')),
  add column if not exists bookable_online boolean,
  add column if not exists booking_channel text,
  add column if not exists requires_saver_space boolean default true,
  add column if not exists non_saver_fallback text,
  add column if not exists routing_rules text,
  add column if not exists teach_caption text,
  add column if not exists verified_by text;

comment on column partner_redemptions.fuel_surcharges is
  'Severity of fuel-surcharge pass-through on this redemption. none / low / high. BA long-haul = high, EK premium = high, AA = none.';
comment on column partner_redemptions.bookable_online is
  'Whether this redemption can be booked online without phoning the program. Some programs (older Cathay, Etihad) require phone for partner awards.';
comment on column partner_redemptions.booking_channel is
  'Where the booking happens. ba.com / aa.com / phone only / etc. Free-form for the few special cases.';
comment on column partner_redemptions.requires_saver_space is
  'Whether this booking requires partner-bookable saver inventory on the operator. True for nearly all partner redemptions; false for own-program dynamic pricing.';
comment on column partner_redemptions.non_saver_fallback is
  'What still works when saver space is unavailable. Example: AA Web Specials are non-partner but bookable directly with AAdvantage.';
comment on column partner_redemptions.routing_rules is
  'Quirks that affect booking. Per-segment pricing, max stopovers, region restrictions, round-trip-only.';
comment on column partner_redemptions.teach_caption is
  'One-line user-facing tip on when this redemption is a good or bad deal. Surfaced under the row in the Ways To Book tool.';
comment on column partner_redemptions.verified_by is
  'Who or what verified this row. Examples: jill, claude+chatgpt-2026-05, copilot-fact-check.';

-- ============================================================================
-- Section 3: Seed Tier 1 carrier partner_access flags
-- (verified by ChatGPT 2026 pass; see plan section 9)
-- partner_access goes on the CARRIER row, not the loyalty program row.
-- ============================================================================

-- American Airlines (single row: carrier and AAdvantage share slug 'aa')
update programs
  set partner_access = 'YES_RESTRICTED',
      partner_access_notes = 'Only true saver awards are bookable by partners. Web Specials are not visible to partner programs.',
      saver_search_url_template = 'https://www.aa.com/booking/find-flights?slices={origin}--{destination}--{date}&awardBooking=true'
  where slug = 'aa';

-- United Airlines (single row)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Saver inventory (X / I / O fare classes) released broadly to Star Alliance partners. Expanded XN inventory is internal-only.',
      saver_search_url_template = 'https://www.united.com/en/us/fsr/choose-flights?f={origin}&t={destination}&d={date}&tt=1&at=1'
  where slug = 'united';

-- Delta Air Lines (single row)
update programs
  set partner_access = 'YES_LIMITED',
      partner_access_notes = 'Partner award space technically released but extremely constrained. Virgin Atlantic and Flying Blue see the most; other partners often find nothing.',
      saver_search_url_template = 'https://www.delta.com/flight-search/book-a-flight?searchType=recentSearch&tripType=ONE_WAY&fromCity={origin}&toCity={destination}&departureDate={date}&awardTravel=true'
  where slug = 'delta';

-- Alaska Airlines (single row)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'oneworld member since 2021. Broad saver release across oneworld and own non-alliance partners.',
      saver_search_url_template = 'https://www.alaskaair.com/search/results?A={origin}&B={destination}&DepartDate={date}&IsAwardSearch=true'
  where slug = 'alaska';

-- JetBlue (single row)
update programs
  set partner_access = 'HYBRID',
      partner_access_notes = 'Limited partner redemption. Qatar Avios can book JetBlue; most other programs cannot.',
      saver_search_url_template = 'https://www.jetblue.com/booking/flights?from={origin}&to={destination}&depart={date}&usePoints=true'
  where slug = 'jetblue';

-- Southwest (single row)
update programs
  set partner_access = 'NO',
      partner_access_notes = 'No alliance and no partner award redemption. Rapid Rewards books own metal only.',
      saver_search_url_template = null
  where slug = 'southwest';

-- British Airways (CARRIER row; loyalty program is ba_avios)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Standard oneworld saver release. Surcharges vary significantly by which program does the booking.',
      saver_search_url_template = 'https://www.britishairways.com/travel/redeem/execclub/_gf/en_us?eId=106020&from={origin}&to={destination}&travelDate={date}'
  where slug = 'british_airways';

-- Air France (CARRIER row; loyalty program is Flying Blue, shared with KLM)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Core SkyTeam carrier. Standard saver inventory shared across SkyTeam and select partners.',
      saver_search_url_template = 'https://wwws.airfrance.us/search/advanced?bookingFlow=REWARD&search.origin={origin}&search.destination={destination}&search.outboundDate={date}'
  where slug = 'air_france';

-- KLM (CARRIER row; same Flying Blue program as Air France)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Core SkyTeam carrier. Standard saver inventory shared across SkyTeam and select partners.',
      saver_search_url_template = 'https://www.klm.com/booking/flightsearch?bookingFlow=REWARD'
  where slug = 'klm';

-- Lufthansa (single row)
update programs
  set partner_access = 'YES_RESTRICTED',
      partner_access_notes = 'Economy and Business broadly available to Star partners. First Class partner access typically opens around 14 days before departure.',
      saver_search_url_template = 'https://www.miles-and-more.com/row/en/earn/partners/airline-partners.html'
  where slug = 'lufthansa';

-- Japan Airlines (CARRIER row; loyalty program is jal)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Consistent oneworld saver release. Premium cabin space is capacity-controlled but not structurally restricted.',
      saver_search_url_template = 'https://www.jal.co.jp/en/inter/award/'
  where slug = 'japan_airlines';

-- ANA (single row)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Star Alliance saver release. ANA prioritizes its own program for premium seats but still releases partner inventory.',
      saver_search_url_template = 'https://www.ana.co.jp/en/us/amc/reference/tukau/award/inter/'
  where slug = 'ana';

-- Emirates (single row)
update programs
  set partner_access = 'YES_RESTRICTED',
      partner_access_notes = 'Partner access is tightly controlled and varies by booking program. Aeroplan has broader access; Alaska reduced access post-2024.',
      saver_search_url_template = 'https://www.emirates.com/us/english/skywards/miles/use-your-miles/our-airline-partners/'
  where slug = 'emirates';

-- Qatar Airways (CARRIER row; loyalty program is qatar / Privilege Club)
update programs
  set partner_access = 'YES_STRONG',
      partner_access_notes = 'Best access via Avios programs (BA / Iberia / Aer Lingus / Qatar shared currency). Standard oneworld saver release otherwise.',
      saver_search_url_template = 'https://www.qatarairways.com/en-us/qmiles/use-qmiles.html'
  where slug = 'qatar_airways';
