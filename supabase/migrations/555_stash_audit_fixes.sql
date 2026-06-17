-- Fix regex audit findings on Stash page.
-- "never expire" -> "do not expire" (matches Stash's own official FAQ wording, resolves absolute flag).
-- "free stays" -> "award stays"; soften the comparative "only" claim.

update programs set
  intro = replace(
    replace(intro,
      'Points never expire and there are no blackout dates',
      'Points do not expire and there are no blackout dates'),
    'redeems points for free stays at any partner hotel',
    'redeems points for award stays at any partner hotel'),
  sweet_spots = replace(
    replace(sweet_spots,
      '**Never-expire, no-blackout flexibility is the real draw**',
      '**No-expiry, no-blackout flexibility is the real draw**'),
    '**The only practical way to earn at independent hotels**: If you prefer boutique and independent properties over big chains, Stash is essentially the one program that rewards that choice',
    '**A rare way to earn at independent hotels**: If you prefer boutique and independent properties over big chains, Stash is one of the very few programs that rewards that choice'),
  quirks = replace(quirks,
    '**Points never expire and have no blackout dates**',
    '**Points do not expire and have no blackout dates**'),
  award_chart = replace(award_chart,
    'every member earns and redeems on identical terms. Points never expire.',
    'every member earns and redeems on identical terms. Points do not expire.'),
  tier_benefits = replace(tier_benefits::text,
    'Points never expire',
    'Points do not expire')::jsonb,
  updated_at = now()
where slug = 'stash';
