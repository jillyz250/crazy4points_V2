-- Fix 8 regex audit findings in MGM Rewards page content.

update programs set
  how_to_spend = replace(
    how_to_spend,
    'Book direct at mgmresorts.com for the best rates and resort-fee waiver if you have Gold or above.',
    'Book direct at mgmresorts.com for the lowest direct rates and resort-fee waiver if you have Gold or above.'
  ),
  sweet_spots = replace(
    replace(
      sweet_spots,
      'redemption math will never beat a solid cash-back card.',
      'redemption math does not, under current program terms, beat a solid cash-back card.'
    ),
    'Low threshold, free benefit.',
    'Low threshold, no-cost benefit.'
  ),
  quirks = replace(
    replace(
      quirks,
      'points never expire regardless of tier.',
      'points do not expire under current program terms regardless of tier.'
    ),
    '1 MGM Rewards point = 1 cent, always.',
    '1 MGM Rewards point = 1 cent under current program terms.'
  ),
  award_chart = replace(
    award_chart,
    'Both cards grant automatic Pearl status and free self-parking.',
    'Both cards grant automatic Pearl status and complimentary self-parking.'
  ),
  tier_benefits = replace(
    replace(
      replace(
        tier_benefits::text,
        'MGM Rewards points and Slot Dollars never expire (as long as you maintain Pearl or above)',
        'MGM Rewards points and Slot Dollars do not expire under current program rules (as long as you maintain Pearl or above)'
      ),
      'Room upgrade at check-in (subject to availability -- not guaranteed)',
      'Room upgrade at check-in (subject to availability; upgrade is not assured)'
    ),
    'Guaranteed reservations at MGM Resorts restaurants and hotels',
    'Priority reservation access at MGM Resorts restaurants and hotels (NOIR exclusive benefit)'
  )::jsonb,
  updated_at = now()
where slug = 'mgm';
