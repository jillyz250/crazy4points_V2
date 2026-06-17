-- Fix 2 LLM-audit findings (round 6):
-- 1. quirks: "do NOT count toward daily TC bonuses" -> add hedge + verify link.
-- 2. sweet_spots: "one of very few" comparative claim -> rephrase without comparative.

update programs set
  quirks = replace(quirks,
    'Sportsbook TCs count toward tier but do NOT count toward daily TC bonuses.',
    'Sportsbook TCs count toward tier but typically do not count toward daily TC bonuses (verify current rules at caesars.com/myrewards/caesars-rewards-rules-regs).'),

  sweet_spots = replace(sweet_spots,
    '**Seven Stars Atlantis stay.** Complimentary stay at Atlantis Paradise Island in the Bahamas. One of very few casino programs with a built-in Caribbean luxury partner benefit.',
    '**Seven Stars Atlantis stay.** Complimentary stay at Atlantis Paradise Island in the Bahamas. A notable casino loyalty perk: a luxury Caribbean partner benefit built directly into the program.'),

  updated_at = now()
where slug = 'caesars';
