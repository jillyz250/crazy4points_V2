-- Clear 2 more llm-audit MEDIUM findings on Melia Rewards:
-- [MEDIUM] intro: clarify "100:30 ratios" direction
-- [MEDIUM] award_chart: remove year-anchored "early-2026" which is now stale

update programs set
  intro = replace(intro,
    'at unfavorable 100:30 ratios)',
    'at an unfavorable 100 Melia = 30 Avios ratio)'),
  award_chart = replace(award_chart,
    'The figures below are third-party blog estimates from published 2025 and early-2026 sources and are not official Melia figures.',
    'The figures below are third-party blog estimates and are not official Melia figures. Prices may have changed since these sources were published.'),
  updated_at = now()
where slug = 'melia';
