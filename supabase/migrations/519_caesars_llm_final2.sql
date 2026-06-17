-- Switch from semicolon to parenthetical for the verify links on no-transfer claims.

update programs set
  intro = replace(intro,
    'do not currently transfer into the program; verify at caesars.com/myrewards/partners',
    'do not currently transfer into the program (verify at caesars.com/myrewards/partners)'),

  quirks = replace(quirks,
    'do not currently transfer into Caesars Rewards; verify at caesars.com/myrewards/partners.',
    'do not currently transfer into Caesars Rewards (verify at caesars.com/myrewards/partners).'),

  updated_at = now()
where slug = 'caesars';
