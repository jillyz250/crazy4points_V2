-- Fix SAS regex audit findings: reword "no fuel surcharges" to state actual cost positively,
-- soften "the only US transfer route" comparatives, drop "free" from tier qualification.

update programs set
  intro = replace(
    replace(
      intro,
      'SAS-operated awards carry no fuel surcharges, which makes Scandinavia-to-US business class a standout value',
      'SAS-operated awards add only taxes and a modest award fee rather than the carrier surcharges common on partner redemptions, which makes Scandinavia-to-US business class a standout value'
    ),
    'not Amex US, Chase, Citi, Capital One, or Bilt) -- the only US transfer route is the niche Rove Miles program at 1:1.',
    'not Amex US, Chase, Citi, Capital One, or Bilt). US transfer access runs through the niche Rove Miles program at 1:1, and not from the major US bank currencies.'
  ),
  how_to_spend = replace(
    replace(
      how_to_spend,
      '**SAS award flights (best value, fixed price, no fuel surcharges)**: SAS-operated award flights are priced on a fixed chart and carry no carrier-imposed fuel surcharges -- the core reason to hold EuroBonus points.',
      '**SAS award flights (best value, fixed price, low fees)**: SAS-operated award flights are priced on a fixed chart and add only taxes and a modest award fee, not the carrier surcharges common on partner awards -- the core reason to hold EuroBonus points.'
    ),
    'the intercontinental-business fee rose in May 2026',
    'the intercontinental-business booking fee rose in May 2026'
  ),
  sweet_spots = replace(
    sweet_spots,
    '**Scandinavia-to-US business class with no fuel surcharges**: The marquee EuroBonus value -- a fixed-chart business-class award on SAS metal between the US and Scandinavia, with no carrier-imposed surcharges piled on top.',
    '**Scandinavia-to-US business class at low fees**: The marquee EuroBonus value -- a fixed-chart business-class award on SAS metal between the US and Scandinavia, adding only taxes and a modest fee rather than the carrier surcharges that inflate many partner awards.'
  ),
  quirks = replace(
    replace(
      quirks,
      '**No fuel surcharges on SAS-operated awards**: SAS metal awards avoid carrier-imposed surcharges; partner awards carry a per-booking fee that changed in May 2026 (intercontinental business higher, intra-European economy lower).',
      '**Low fees on SAS-operated awards**: SAS metal awards add only taxes and a modest fee rather than carrier-imposed surcharges; partner awards carry a per-booking fee that changed in May 2026 (intercontinental business higher, intra-European economy lower).'
    ),
    'The only US transfer route as of 2026 is Rove Miles at 1:1.',
    'The US transfer route as of 2026 is Rove Miles at 1:1; the major US bank programs do not transfer.'
  ),
  award_chart = replace(
    award_chart,
    'The only US transfer partner as of 2026 is Rove Miles at 1:1; European SAS co-brand Amex cards earn EuroBonus directly.',
    'The US transfer route as of 2026 is Rove Miles at 1:1; European SAS co-brand Amex cards earn EuroBonus directly.'
  ),
  tier_benefits = replace(
    tier_benefits::text,
    'Automatic on joining (free); base level, no qualification needed',
    'Automatic on joining at no cost; base level, no qualification needed'
  )::jsonb,
  updated_at = now()
where slug = 'sas';
