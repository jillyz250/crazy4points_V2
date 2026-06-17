-- Fix 2 LLM-audit findings (round 12): add "as of June 2026" date anchor to no-transfer claims.

update programs set
  intro = replace(intro,
    'Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program (verify at caesars.com/myrewards/partners)',
    'Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program (as of June 2026; verify at caesars.com/myrewards/partners)'),

  quirks = replace(quirks,
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not currently transfer into Caesars Rewards (verify at caesars.com/myrewards/partners).',
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not currently transfer into Caesars Rewards as of June 2026 (verify at caesars.com/myrewards/partners).'),

  updated_at = now()
where slug = 'caesars';
