-- Fix 2 LLM-audit findings on Caesars Rewards page:
-- 1. quirks: "devaluation" + "reduction from prior years" is an unhedged historical comparison.
--    Simplify to just state the current earn rate with a verify link.
-- 2. award_chart: card product details (card names, fee types) belong on card pages, not program pages.
--    Strip down to earn rates + verify link only.

update programs set
  quirks = replace(quirks,
    '- **Caesars Rewards Visa devaluation (2026).** The Caesars Rewards Visa now awards 2,500 TCs per $5,000 in eligible spend (a reduction from prior years). The card still earns 5x Reward Credits at Caesars destinations and 2x on dining, travel, and entertainment.',
    '- **Co-brand Visa card TC earnings.** The Caesars Rewards Visa currently awards Tier Credits based on eligible annual spend. Verify the current TC earn structure at caesars.com/myrewards/partners/cr-visa -- card tier credit rates have changed in recent years and may change again.'),

  award_chart = replace(award_chart,
    'Co-brand Visa cards earn Reward Credits at: 5x at Caesars Rewards destinations; 2x on dining, travel, and entertainment; 1x everywhere else. Two cards available: Caesars Rewards Visa Signature (no annual fee) and Caesars Rewards Prestige Visa Signature (annual fee applies -- verify at caesars.com/myrewards/partners/cr-visa). Verify current earn rates and welcome bonus at caesars.com/myrewards/partners/cr-visa before applying.',
    'Co-brand Visa cards earn Reward Credits at: 5x at Caesars Rewards destinations; 2x on dining, travel, and entertainment; 1x everywhere else. Verify current earn rates, welcome bonus, and card options at caesars.com/myrewards/partners/cr-visa before applying.'),

  updated_at = now()

where slug = 'caesars';
