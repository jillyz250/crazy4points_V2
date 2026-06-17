-- Clear 2 more llm-audit MEDIUM findings on Melia Rewards:
-- [MEDIUM] quirks: soften "has closed" -> "ended in 2023"
-- [MEDIUM] lounge_access: remove editorial opinion "very limited" / "not a substitute"

update programs set
  quirks = replace(quirks,
    '**Platinum for Life qualification window has closed.**',
    '**Platinum for Life: qualification window ended in 2023.**'),
  lounge_access = replace(lounge_access,
    'Two visits per year is a very limited benefit, useful for an occasional international connection but not a substitute for a dedicated lounge card or airline lounge membership.',
    'Two visits per year limits utility to occasional international connections and provides less coverage than a dedicated lounge card or airline lounge membership.'),
  updated_at = now()
where slug = 'melia';
