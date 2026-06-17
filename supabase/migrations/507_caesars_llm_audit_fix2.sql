-- Fix 2 remaining LLM-audit findings on Caesars Rewards page:
-- 1. award_chart: remove "not confirmed from official source" hedging phrase -> rewrite more cleanly.
-- 2. quirks: "known community tactic" -> "community tactic discussed in loyalty forums".

update programs set
  award_chart = replace(award_chart,
    'Caesars Reward Credits can be transferred to Wyndham Rewards points. Transfer ratio not confirmed from official source; verify at caesars.com/myrewards/partners/wyndham_resorts before initiating.',
    'Caesars Reward Credits can be transferred to Wyndham Rewards points. Verify the current exchange ratio at caesars.com/myrewards/partners/wyndham_resorts before initiating a transfer.'),

  quirks = replace(quirks,
    'The "Diamond in a Day" run is a known community tactic.',
    'The "Diamond in a Day" run is a community tactic discussed in loyalty forums.'),

  updated_at = now()
where slug = 'caesars';
