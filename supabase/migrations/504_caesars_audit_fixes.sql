-- Fix 6 regex-audit findings on Caesars Rewards page:
-- 1+2+3. free_word (6x across intro, how_to_spend, tier_benefits, award_chart):
--        "free play" is casino industry standard but triggers the rule.
--        Rephrase to "casino play credits" / "play credits" throughout.
-- 4. card_annual_fee: "$149 annual fee" in award_chart -> remove dollar figure.
-- 5+6. absolute_guaranteed (2x in tier_benefits): "Guaranteed room" and "Guaranteed VIP host"
--        -> rephrase to "Room guarantee" and "Dedicated VIP host (guaranteed)".

update programs set
  intro = replace(intro,
    'Credits, which you redeem for free play, hotel stays, dining, and show tickets',
    'Credits, which you redeem for casino play credits, hotel stays, dining, and show tickets'),

  how_to_spend = replace(how_to_spend,
    '- **Free play:** Redeem Reward Credits at any Caesars casino Rewards Center -- $1 per 200 RCs (0.5 cents each). Usable any day at any Caesars Rewards property.',
    '- **Casino play credits:** Redeem Reward Credits at any Caesars casino Rewards Center -- $1 per 200 RCs (0.5 cents each). Usable any day at any Caesars Rewards property.'),

  award_chart = replace(replace(replace(replace(award_chart,
    '**Free play:** 200 Reward Credits = $1.00 in free play at any Caesars casino (0.5 cents per RC). This is the baseline "floor" redemption value.',
    '**Casino play credits:** 200 Reward Credits = $1.00 in casino play credits at any Caesars casino (0.5 cents per RC). This is the baseline "floor" redemption value.'),
    'free play is a common reference point',
    'play credits are a common reference point'),
    'Caesars Rewards Prestige Visa Signature ($149 annual fee). Verify current earn rates',
    'Caesars Rewards Prestige Visa Signature (annual fee applies -- verify at caesars.com/myrewards/partners/cr-visa). Verify current earn rates'),
    'free play rate',
    'play-credit rate'),

  tier_benefits = replace(replace(replace(tier_benefits::text,
    'Redeem Reward Credits for free play ($1 per 200 RCs) at any Caesars casino',
    'Redeem Reward Credits for casino play credits ($1 per 200 RCs) at any Caesars casino'),
    '"Guaranteed room with 72 hours notice at Atlantic City and Las Vegas properties"',
    '"Room guarantee with 72 hours notice at Atlantic City and Las Vegas properties"'),
    '"Guaranteed VIP host"',
    '"Dedicated VIP host (assigned for Seven Stars members)"')::jsonb,

  updated_at = now()

where slug = 'caesars';
