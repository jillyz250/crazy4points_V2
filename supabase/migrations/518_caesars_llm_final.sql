-- Remove the stale "as of June 2026" date anchor -- the LLM flagged it will go stale immediately.
-- The "do not currently transfer; verify at URL" form is correct.

update programs set
  intro = replace(intro,
    '(as of June 2026; verify at caesars.com/myrewards/partners)',
    '; verify at caesars.com/myrewards/partners'),

  quirks = replace(quirks,
    'do not currently transfer into Caesars Rewards as of June 2026 (verify at caesars.com/myrewards/partners).',
    'do not currently transfer into Caesars Rewards; verify at caesars.com/myrewards/partners.'),

  updated_at = now()
where slug = 'caesars';
