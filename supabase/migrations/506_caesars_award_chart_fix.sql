-- Remove card product details from award_chart (card names + fee types belong on card pages).
-- The 505 migration replace failed to match due to markdown bold formatting in the target text.

update programs set
  award_chart = replace(award_chart,
    'Two cards available: Caesars Rewards Visa Signature (no annual fee) and Caesars Rewards Prestige Visa Signature (annual fee applies -- verify at caesars.com/myrewards/partners/cr-visa). Verify current earn rates and welcome bonus at caesars.com/myrewards/partners/cr-visa before applying.',
    'Verify current earn rates, welcome bonus, and card options at caesars.com/myrewards/partners/cr-visa before applying.'),
  updated_at = now()
where slug = 'caesars';
