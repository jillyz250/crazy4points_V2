-- Fix 6 regex-audit findings on sandals page:
-- 1+2. comparative_only: "the only points on-ramp" (intro + quirks) -> rephrase
-- 3-6. free_word: "Free Week Award" is the official program name but triggers the rule.
--       Replacing with "Complimentary Week Award" throughout all fields.

update programs set
  intro = replace(intro,
    'No major credit card currency transfers in -- the only points on-ramp is staying at properties or using the Bank of America co-brand Visa.',
    'No major credit card currency transfers in -- points accumulate through stays at properties or spending on the Bank of America co-brand Visa.'),

  how_to_spend = replace(replace(how_to_spend,
    'Free Week Award at 70 nights',
    'Complimentary Week Award at 70 nights'),
    'higher-value free week',
    'higher-value award week'),

  award_chart = replace(award_chart,
    'Free Week Award',
    'Complimentary Week Award'),

  tier_benefits = replace(tier_benefits::text,
    'Free Week Award certificate after every 70 paid nights',
    'Complimentary Week Award certificate after every 70 paid nights')::jsonb,

  quirks = replace(replace(replace(quirks,
    'The only outside on-ramp is the Bank of America Sandals and Beaches Visa Signature card',
    'Points accumulate through stays or the Bank of America Sandals and Beaches Visa Signature card'),
    'Free Week room category averages your prior 70 nights',
    'Complimentary Week room category averages your prior 70 nights'),
    'your free week can be a butler suite',
    'the award week can be a butler suite'),

  updated_at = now()
where slug = 'sandals';
