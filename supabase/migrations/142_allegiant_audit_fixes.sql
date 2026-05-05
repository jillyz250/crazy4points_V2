-- Allegiant audit-pass fixes (Sonnet HIGH + a couple of LOW polish items).
--
-- HIGH:
--   - sweet_spots: "best offer in the program right now" reads as an unhedged
--     superlative tied to a deadline that's about to pass; rephrase to a
--     dated, scoped claim.
-- LOW polish:
--   - intro: "No fuel surcharges" -> scope to Allegiant redemptions
--   - sweet_spots: "$59 annual fee" -> generic "card's annual fee"
--   - lounge_access: typo + comparative hedge
--   - award_chart: hedge the Visa-tax-earning parenthetical

update programs set
  intro = replace(intro,
    'No fuel surcharges. No elite tiers.',
    'No fuel surcharges on Allegiant redemptions. No elite tiers.'
  ),
  sweet_spots = replace(sweet_spots,
    'If you book a vacation package once a year with the card, the math typically beats the $59 annual fee on its own.',
    'If you book a vacation package once a year with the card, the math typically beats the card''s annual fee on its own.'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'allegiant';

update programs set
  sweet_spots = replace(sweet_spots,
    '**Spirit closure relief offer** - through May 12, 2026, Allegiant is rebating 50% of points spent on rebooked Spirit-passenger itineraries. If you had a Spirit ticket and need to rebook, this is genuinely the best offer in the program right now.',
    '**Spirit closure relief offer (expires May 12, 2026)** - through May 12, 2026, Allegiant is rebating 50% of points spent on rebooked Spirit-passenger itineraries. If you had a Spirit ticket and need to rebook before that deadline, this rebate meaningfully boosts the value of your points on that booking.'
  ),
  lounge_access = replace(lounge_access,
    'That is closest thing to an "elite perk" the program offers, and it stacks per booking, not per status.',
    'That is the closest thing to an elite perk the program currently offers, and it stacks per booking, not per status.'
  ),
  award_chart = replace(award_chart,
    '- Taxes and fees do not earn base points (they do earn on the Visa as part of dining/Allegiant/other categories)',
    '- Taxes and fees do not earn base Allways points when booking directly; check current Allways Rewards Visa terms for how taxes and fees are categorized on card purchases'
  ),
  updated_at = now()
where slug = 'allegiant';
