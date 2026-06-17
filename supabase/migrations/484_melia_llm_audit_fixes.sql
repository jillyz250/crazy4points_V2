-- Clear 2 llm-audit-program.mjs MEDIUM findings on Melia Rewards page:
-- [MEDIUM] quirks: "Platinum for Life is effectively closed" -> anchor to the actual reason
-- [MEDIUM] award_chart: "2025-2026 sources" -> "2025 and early-2026 sources" (clearer timeframe)

update programs set
  quirks = replace(quirks,
    '**Platinum for Life is effectively closed to new earners.** The qualification requires 10 consecutive 12-month qualifying periods starting from January 2013, plus 500 qualifying nights. This was only achievable for members who consistently held Platinum beginning in 2013 - anyone starting after that point has missed the window.',
    '**Platinum for Life qualification window has closed.** The benefit required 10 consecutive 12-month qualifying periods starting from January 2013, plus 500 qualifying nights. The window to accumulate those 10 consecutive periods ended in 2023 - anyone who did not hold Platinum continuously from 2013 onward cannot qualify. The benefit remains available to those who already earned it, but Melia can modify the terms at any time.'),
  award_chart = replace(award_chart,
    'The figures below are third-party blog estimates from 2025-2026 sources and are not official Melia figures.',
    'The figures below are third-party blog estimates from published 2025 and early-2026 sources and are not official Melia figures.'),
  updated_at = now()
where slug = 'melia';
