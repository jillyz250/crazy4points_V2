-- Fix 3 regex-audit findings on barcelo page:
-- 1. absolute_always: "always the right starting point" -> "typically the lowest-rate option"
-- 2. absolute_best: "The Best Price Guarantee" flagged as comparative superlative -> rephrase
-- 3. absolute_guaranteed: "not guaranteed" -> "may not apply"

update programs set
  how_to_spend = replace(replace(how_to_spend,
    'The Best Price Guarantee means barcelo.com is always the right starting point.',
    'Barcelo''s direct-booking price guarantee means barcelo.com is typically the lowest-rate option.'),
    'The Best Price Guarantee',
    'Barcelo''s direct-booking price guarantee'),
  sweet_spots = replace(sweet_spots,
    'retroactive credit is not guaranteed',
    'retroactive credit may not apply'),
  updated_at = now()
where slug = 'barcelo';
