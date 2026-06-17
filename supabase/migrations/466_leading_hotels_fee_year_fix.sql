-- ACCURACY FIX: the Leaders Club annual fee was dropped in JULY 2021 (Head for Points
-- + Business Traveller, 2021-07-09), not 2024. The earlier draft wrongly said "rebuilt
-- in 2024." Correct the year in intro + quirks; the points earn/redeem model rolled out
-- later (exact date not officially pinned, so left unspecified). ASCII-only.

update programs set
  intro = replace(intro,
    'Its loyalty program, Leaders Club, was rebuilt in 2024: the old USD 175 annual fee vanished and it became a no-fee, points-earning program anyone can join.',
    'Its loyalty program, Leaders Club, dropped its old USD 175 annual fee back in 2021 and is now a no-fee, points-earning program anyone can join.'),
  quirks = replace(quirks,
    '- **Program was rebuilt in 2024.** The old paid Leaders Club (around USD 175 a year, with richer fixed benefits) was replaced by today''s no-fee, points-based program. Some long-time members consider the new version a step down on its once-fixed perks - weigh older blog write-ups accordingly.',
    '- **Membership went free in July 2021.** Leaders Club dropped its old USD 175 annual fee in 2021 and later shifted to today''s points-based earn-and-redeem model. Some long-time members consider the current program a step down on the old guaranteed perks - weigh older blog write-ups accordingly.'),
  updated_at = now()
where slug = 'leading-hotels';
