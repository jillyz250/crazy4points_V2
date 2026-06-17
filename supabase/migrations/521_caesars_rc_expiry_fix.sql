-- Fix RC expiry bullet in quirks: add "per current inactivity policy" hedge.
-- Accepting remaining MEDIUM/LOW audit findings on intro no-transfer claim (LLM is cycling
-- between requesting and then rejecting date anchors -- content is factually accurate with
-- "currently" + verify link, which is the standard form for current-state policy claims).

update programs set
  quirks = replace(quirks,
    '- **Reward Credits do not expire while account is active.** Unlike TCs, Reward Credits remain in your account as long as you maintain qualifying activity. Inactive accounts may have RCs forfeit -- check current inactivity policy at caesars.com/myrewards/caesars-rewards-rules-regs.',
    '- **Reward Credits do not expire while your account remains active per Caesars'' current inactivity policy.** Qualifying activity (play, dining, hotel, etc.) resets the inactivity clock. Inactive accounts may have RCs forfeited -- check current terms at caesars.com/myrewards/caesars-rewards-rules-regs.'),
  updated_at = now()
where slug = 'caesars';
