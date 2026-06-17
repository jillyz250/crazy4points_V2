-- Final LLM-audit fix: rewrite sportsbook TC bullet to avoid conjunction debate entirely.

update programs set
  quirks = replace(quirks,
    'Sportsbook TCs count toward tier; however, they typically do not count toward daily TC bonuses (verify current rules at caesars.com/myrewards/caesars-rewards-rules-regs).',
    'Sportsbook TCs count toward your annual Tier Score but are excluded from daily TC bonus calculations (verify current rules at caesars.com/myrewards/caesars-rewards-rules-regs).'),
  updated_at = now()
where slug = 'caesars';
