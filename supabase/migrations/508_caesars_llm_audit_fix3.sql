-- Fix 2 remaining LLM-audit findings (round 3) on Caesars Rewards page:
-- 1. quirks: Visa TC earn bullet is card-specific content on a program page -> remove bullet.
-- 2. intro: "nor any major bank currency" is an unhedged absolute -> add "currently".

update programs set
  quirks = replace(quirks,
    E'- **Co-brand Visa card TC earnings.** The Caesars Rewards Visa currently awards Tier Credits based on eligible annual spend. Verify the current TC earn structure at caesars.com/myrewards/partners/cr-visa -- card tier credit rates have changed in recent years and may change again.',
    E'- **Co-brand Visa cards earn Tier Credits.** Verify the current TC earn structure at caesars.com/myrewards/partners/cr-visa.'),

  intro = replace(intro,
    'Neither Amex MR, Chase UR, Bilt, nor any major bank currency transfers into the program',
    'Neither Amex MR, Chase UR, Bilt, nor currently any major bank currency transfers into the program'),

  updated_at = now()
where slug = 'caesars';
