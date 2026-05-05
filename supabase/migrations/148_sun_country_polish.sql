-- Sun Country Sonnet audit pass - hedge card-rate specifics, fix relative date.
-- All findings were MEDIUM (no HIGH); applying for cleanliness ahead of publish.

update programs set
  sweet_spots = replace(replace(
    sweet_spots,
    'Stack with the Visa Signature''s 5x and you''re at up to 6x on Sun Country purchases.',
    'Stack with the Visa Signature''s Sun Country earn bonus and you''re at up to 6x on Sun Country purchases for Plus cardholders (per current card terms).'
  ),
    'earn Plus status this year and you keep it for the rest of the calendar year plus all of next year',
    'earn Plus status in a given calendar year and you keep it for the rest of that year plus all of the next calendar year'
  ),
  quirks = replace(quirks,
    '**No fuel surcharges or carrier-imposed surcharges** on award bookings, since the program prices like cash against the fare.',
    '**No separate fuel surcharges or carrier-imposed surcharges** on top of the point redemption - because the program prices like cash against the live fare, points simply offset the total price shown.'
  ),
  award_chart = replace(replace(
    award_chart,
    '- Up to 5 points per $1 on Sun Country purchases (3x with the card + 2x when you fly)',
    '- Up to 5 points per $1 on Sun Country purchases (card bonus + flight earn; confirm current card terms at suncountry.com)'
  ),
    '- Up to 6 points per $1 on Sun Country purchases for Plus-status cardholders (3x card + 3x Plus-bonused fly)',
    '- Up to 6 points per $1 on Sun Country purchases for Plus-status cardholders (card bonus + Plus-boosted flight earn; confirm current card terms at suncountry.com)'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'sun-country';
