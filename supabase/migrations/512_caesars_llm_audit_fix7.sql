-- Fix final LLM-audit finding: "but" -> "however" for the sportsbook TC bullet.

update programs set
  quirks = replace(quirks,
    'Sportsbook TCs count toward tier but typically do not count toward daily TC bonuses',
    'Sportsbook TCs count toward tier; however, they typically do not count toward daily TC bonuses'),
  updated_at = now()
where slug = 'caesars';
