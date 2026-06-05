-- Virgin Atlantic Flying Club buy-points alert (up to 70% bonus, ends July 7 2026)
-- Published as a purchase_bonus alert; feeds newsletter Live Offers purchase bucket.
begin;
set local app.alerts_allow_direct_writes = 'on';

insert into alerts (
  title, slug, type, status, summary, description,
  end_date, published_at, source, source_url,
  primary_program_id, action_type, confidence_level, is_hot,
  impact_score, value_score, rarity_score, created_by, registration_required,
  impact_justification
) values (
  'Virgin Atlantic Flying Club: Buy Points with Up to 70% Bonus - Ends July 7',
  'virgin-atlantic-buy-points-70-bonus',
  'purchase_bonus',
  'published',
  'Through July 7, Virgin is running tiered bonuses on purchased points - the more you buy, the bigger the boost, topping out at 70%. The tiers: 5,000-39,000 points get 20%, 40,000-79,000 get 40%, 80,000-124,000 get 60%, and 125,000-200,000 get the full 70%. You can buy up to 200,000 points a calendar year. Only buy if you already have a redemption in mind - Flying Club points are for spending on a plan, not stockpiling. A top-up to reach an award you are just short on (ANA business class to Tokyo, or Virgin Upper Class) is where this earns its keep. Check availability before you buy; points are non-refundable once redeemed.',
  E'**The deal:** Tiered bonuses on purchased Virgin Points through July 7, 2026.\n\n**Bonus tiers:**\n- 5,000-39,000 points: 20% bonus\n- 40,000-79,000 points: 40% bonus\n- 80,000-124,000 points: 60% bonus\n- 125,000-200,000 points: 70% bonus\n- Under 5,000 points: no bonus\n\n**The rule:** Only buy if you already have a redemption in mind. Flying Club points are for spending on a plan, not stockpiling for "someday." A top-up to reach an award you are just short on - ANA business class to Tokyo, or Virgin own Upper Class - is where this earns its keep.\n\n**Fine print:** Up to 200,000 points per calendar year, in 1,000-point increments. Check the seat availability before you buy. Points are non-refundable once redeemed (14-day cooling-off otherwise).',
  '2026-07-07 00:00:00+00',
  now(),
  'Virgin Atlantic Flying Club',
  'https://www.virginatlantic.com/flying-club/buy-points',
  '3ec24ccf-f1f8-4b6f-b38a-139132b9b70f',
  'monitor',
  'high',
  true,
  5, 5, 4,
  'manual',
  false,
  'Limited-time buy-points bonus (up to 70%) on a transferable-into-many program; relevant to readers with a near-term Virgin Atlantic or partner award to top up.'
);
commit;
