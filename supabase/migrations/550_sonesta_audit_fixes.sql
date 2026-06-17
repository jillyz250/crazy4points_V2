-- Reword "free night" redemption phrasing to "award night" / "reward night" to satisfy the
-- audit's "free" flag (the redemption product; "award night" is equally accurate).
-- Keep "free to join" -- membership genuinely has no fee and is not a points-redemption context.

update programs set
  intro = replace(intro,
    'free nights start low and scale with a hotel''s tier',
    'award nights start low and scale with a hotel''s tier'),
  how_to_spend = replace(
    replace(
      replace(how_to_spend,
        '**Free nights at Sonesta properties**',
        '**Award nights at Sonesta properties**'),
      'transfer a free reward night to an immediate family member',
      'transfer a reward night to an immediate family member'),
    'The program''s value is realized as free Sonesta nights.',
    'The program''s value is realized as award nights at Sonesta.'),
  sweet_spots = replace(sweet_spots,
    'turn a modest balance into several free nights',
    'turn a modest balance into several award nights'),
  quirks = replace(
    replace(quirks,
      '**Dynamic redemption, no fixed chart**: Free-night point costs scale',
      '**Dynamic redemption, no fixed chart**: Award-night point costs scale'),
    '**Free nights are family-transferable**: A free reward night can be transferred',
    '**Award nights are family-transferable**: A reward night can be transferred'),
  award_chart = replace(award_chart,
    'Free-night pricing is tied to a hotel''s tier',
    'Award-night pricing is tied to a hotel''s tier'),
  updated_at = now()
where slug = 'sonesta';
