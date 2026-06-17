-- Fix 3 LLM-audit findings (round 5) -- adding "currently" to current-state policy claims:
-- 1. intro: "nor any major bank currency transfers" -> "do not currently transfer"
-- 2. quirks: "do not transfer" -> "do not currently transfer"
-- 3. award_chart: "does not publish" -> "does not currently publish"

update programs set
  intro = replace(intro,
    'Neither Amex MR, Chase UR, Bilt, nor any major bank currency transfers into the program, so your tier lives and dies by how much you play, eat, and stay at Caesars properties.',
    'Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program, so your tier lives and dies by how much you play, eat, and stay at Caesars properties.'),

  quirks = replace(quirks,
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not transfer into Caesars Rewards.',
    'Amex MR, Chase UR, Bilt, Citi ThankYou, and Capital One miles do not currently transfer into Caesars Rewards.'),

  award_chart = replace(award_chart,
    'Caesars Rewards does not publish a traditional award chart',
    'Caesars Rewards does not currently publish a traditional award chart'),

  updated_at = now()
where slug = 'caesars';
