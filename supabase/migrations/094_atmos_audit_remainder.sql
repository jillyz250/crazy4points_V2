-- Atmos audit fixes — round 2 (catch what migration 093 missed).
--
-- Audit after running 093 found 4 issues remaining:
--   1. Bilt + marriott_bonvoy STILL in hero pills (DELETE didn't fire on
--      those operating_carrier_ids — they may live as type='loyalty_program'
--      or 'hotel' and the original constraint was type != 'airline'; that
--      should have caught them, but verify by re-running with explicit
--      type-list match.)
--   2. "the best inter-island award rate" still in 3 places — my REPLACE
--      only ran on sweet_spots + quirks. Likely also in award_chart.
--   3. "the best of Alaska Airlines and Hawaiian Airlines" still in intro.
--      Original REPLACE may have been confused by em-dash / smart-quote
--      characters in the actual stored string.
--   4. 1 "Atmos Rewards miles" remaining — possibly in tier_benefits JSONB
--      which my plain-text REPLACE doesn't reach.

-- ============================================================
-- 1. Aggressive delete of partner_redemptions where Atmos is currency
--    and operating_carrier is anything OTHER than an airline.
-- ============================================================

delete from partner_redemptions
where currency_program_id = (select id from programs where slug = 'atmos')
  and operating_carrier_id in (
    select id from programs
    where type in ('loyalty_program', 'hotel', 'alliance', 'credit_card')
  );

-- Belt-and-suspenders: explicit slug-list delete in case some operating_carriers
-- have NULL or unexpected type values
delete from partner_redemptions
where currency_program_id = (select id from programs where slug = 'atmos')
  and operating_carrier_id in (
    select id from programs
    where slug in (
      'bilt', 'marriott-bonvoy', 'marriott_bonvoy', 'citi-thankyou', 'citi_thankyou',
      'amex-membership-rewards', 'capital-one', 'wells-fargo-rewards', 'chase'
    )
  );

-- ============================================================
-- 2. Replace "the best inter-island" across ALL text fields
--    (not just sweet_spots and quirks)
-- ============================================================

update programs set
  intro         = replace(coalesce(intro, ''),         'the best inter-island award rate', 'one of the strongest inter-island award rates'),
  how_to_spend  = replace(coalesce(how_to_spend, ''),  'the best inter-island award rate', 'one of the strongest inter-island award rates'),
  sweet_spots   = replace(coalesce(sweet_spots, ''),   'the best inter-island award rate', 'one of the strongest inter-island award rates'),
  quirks        = replace(coalesce(quirks, ''),        'the best inter-island award rate', 'one of the strongest inter-island award rates'),
  lounge_access = replace(coalesce(lounge_access, ''), 'the best inter-island award rate', 'one of the strongest inter-island award rates'),
  award_chart   = replace(coalesce(award_chart, ''),   'the best inter-island award rate', 'one of the strongest inter-island award rates')
where slug = 'atmos';

-- ============================================================
-- 3. Catch the "best of Alaska Airlines" leftover (any em-dash variation)
-- ============================================================

update programs set
  intro         = replace(replace(coalesce(intro, ''),
                           'the best of Alaska Airlines and Hawaiian Airlines',
                           'Alaska Airlines and Hawaiian Airlines'),
                          'best of Alaska Airlines and Hawaiian Airlines',
                          'Alaska Airlines and Hawaiian Airlines'),
  quirks        = replace(replace(coalesce(quirks, ''),
                           'the best of Alaska Airlines and Hawaiian Airlines',
                           'Alaska Airlines and Hawaiian Airlines'),
                          'best of Alaska Airlines and Hawaiian Airlines',
                          'Alaska Airlines and Hawaiian Airlines')
where slug = 'atmos';

-- ============================================================
-- 4. Fix any remaining "Atmos Rewards miles" — including in tier_benefits JSONB
-- ============================================================

-- Plain text fields (covered in 093 but re-running for safety)
update programs set
  intro         = replace(coalesce(intro, ''),         'Atmos Rewards miles', 'Atmos Rewards points'),
  how_to_spend  = replace(coalesce(how_to_spend, ''),  'Atmos Rewards miles', 'Atmos Rewards points'),
  sweet_spots   = replace(coalesce(sweet_spots, ''),   'Atmos Rewards miles', 'Atmos Rewards points'),
  quirks        = replace(coalesce(quirks, ''),        'Atmos Rewards miles', 'Atmos Rewards points'),
  lounge_access = replace(coalesce(lounge_access, ''), 'Atmos Rewards miles', 'Atmos Rewards points'),
  award_chart   = replace(coalesce(award_chart, ''),   'Atmos Rewards miles', 'Atmos Rewards points')
where slug = 'atmos';

-- tier_benefits is JSONB; cast to text, replace, cast back. Same for transfer_partners.
update programs set
  tier_benefits = replace(tier_benefits::text, 'Atmos Rewards miles', 'Atmos Rewards points')::jsonb,
  transfer_partners = replace(transfer_partners::text, 'Atmos Rewards miles', 'Atmos Rewards points')::jsonb
where slug = 'atmos'
  and (
    tier_benefits::text like '%Atmos Rewards miles%'
    or transfer_partners::text like '%Atmos Rewards miles%'
  );

-- Also handle bare "Atmos miles" in JSONB
update programs set
  tier_benefits = replace(tier_benefits::text, 'Atmos miles', 'Atmos points')::jsonb,
  transfer_partners = replace(transfer_partners::text, 'Atmos miles', 'Atmos points')::jsonb
where slug = 'atmos'
  and (
    tier_benefits::text like '%Atmos miles%'
    or transfer_partners::text like '%Atmos miles%'
  );

-- ============================================================
-- 5. Touch content_updated_at (audit trail)
-- ============================================================

update programs set content_updated_at = now() where slug = 'atmos';
