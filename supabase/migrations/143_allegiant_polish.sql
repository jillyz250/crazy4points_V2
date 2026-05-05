-- Allegiant audit pass 2 - MEDIUM/LOW polish.
update programs set
  intro = replace(intro,
    'No fuel surcharges on Allegiant redemptions.',
    'No fuel surcharges on Allegiant-operated flight redemptions.'
  ),
  sweet_spots = replace(sweet_spots,
    'If you book a vacation package once a year with the card, the math typically beats the card''s annual fee on its own.',
    'If you book a vacation package once a year with the card, the math can easily cover the card''s annual fee on its own, depending on the package price and current card terms.'
  ),
  quirks = replace(quirks,
    'There is, however, a useful workaround: the person who pays for an itinerary',
    'That said, there is a useful workaround: the person who pays for an itinerary'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'allegiant';
