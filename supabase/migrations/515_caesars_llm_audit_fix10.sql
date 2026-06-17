-- Fix 2 LLM-audit findings (round 10): add verify link to no-transfer-partner claims.

update programs set
  intro = replace(intro,
    'Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program, so your tier lives and dies by how much you play, eat, and stay at Caesars properties.',
    'Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program (verify at caesars.com/myrewards/partners), so your tier lives and dies by how much you play, eat, and stay at Caesars properties.'),

  quirks = replace(quirks,
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not currently transfer into Caesars Rewards.',
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not currently transfer into Caesars Rewards (verify at caesars.com/myrewards/partners).'),

  updated_at = now()
where slug = 'caesars';
