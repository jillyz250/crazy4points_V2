-- Fix 3 LLM-audit findings (round 4):
-- 1. intro: revert "nor currently any major bank" -> "nor any major bank" (unhedged is cleaner).
-- 2. sweet_spots: "Verify current promotional day rules at a Caesars Rewards Center before attempting."
--    -> "Confirm the current promotional day rules with a Caesars Rewards Center before attempting this strategy."
-- 3. quirks: remove fragment opener "Sportsbook TCs qualify (with limits)." from the bullet.

update programs set
  intro = replace(intro,
    'Neither Amex MR, Chase UR, Bilt, nor currently any major bank currency transfers into the program',
    'Neither Amex MR, Chase UR, Bilt, nor any major bank currency transfers into the program'),

  sweet_spots = replace(sweet_spots,
    'Verify current promotional day rules at a Caesars Rewards Center before attempting.',
    'Confirm current promotional day rules with a Caesars Rewards Center before attempting this strategy.'),

  quirks = replace(quirks,
    E'- **Sportsbook TCs qualify (with limits).** Online sports betting through Caesars Sportsbook earns',
    E'- **Sportsbook TCs count toward tier (with limits).** Online sports betting through Caesars Sportsbook earns'),

  updated_at = now()
where slug = 'caesars';
