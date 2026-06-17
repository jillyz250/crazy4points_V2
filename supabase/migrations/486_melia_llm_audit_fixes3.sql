-- Clear 2 more llm-audit findings on Melia Rewards:
-- [MEDIUM] sweet_spots: "among the strongest in the program" -> "competitive for an all-inclusive redemption"
-- [HIGH]   quirks: "ended in 2023... cannot qualify" -> add "as of now" hedge

update programs set
  sweet_spots = replace(sweet_spots,
    'can put you near 1 cent per point - among the strongest in the program.',
    'can put you near 1 cent per point - competitive for an all-inclusive redemption.'),
  quirks = replace(quirks,
    'The window to accumulate those 10 consecutive periods ended in 2023 - anyone who did not hold Platinum continuously from 2013 onward cannot qualify.',
    'The window to accumulate those 10 consecutive periods ended in 2023 - as of mid-2026, anyone who did not hold Platinum continuously from 2013 onward cannot qualify under the current terms.'),
  updated_at = now()
where slug = 'melia';
