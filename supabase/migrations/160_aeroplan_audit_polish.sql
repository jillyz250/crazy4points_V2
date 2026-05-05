-- Aeroplan Sonnet audit polish.
-- HIGH: card AF removed from program page (per feedback_no_card_af_on_program_pages).
-- MEDIUM: scope "no fuel surcharges" claims to partner awards specifically;
-- soften absolute comparative claim about Star Alliance overlap.
-- LOW: drop stale "unlike United's old policy" comparative.

update programs set
  intro = replace(replace(intro,
    'more flexible-currency overlap than any other Star Alliance program',
    'more flexible-currency overlap than virtually any other Star Alliance program'
  ),
    'It is also the rare program that charges no carrier-imposed (fuel) surcharges on any partner airline (Air Canada eliminated them in 2020)',
    'It is also among the rare programs that charges no carrier-imposed (fuel) surcharges on partner-airline awards (Air Canada eliminated them in 2020)'
  ),
  sweet_spots = replace(replace(sweet_spots,
    '**No fuel surcharges on any partner airline.**',
    '**No fuel surcharges on partner airline awards.**'
  ),
    '**No close-in booking fee.** Aeroplan does not charge a close-in award booking fee, unlike United''s old policy.',
    '**No close-in award booking fee** - a nice perk that not all programs offer.'
  ),
  quirks = replace(quirks,
    '**No carrier-imposed (fuel) surcharges on any partner award.** Aeroplan eliminated YQ/YR surcharges in 2020 and they have not returned. This is one of the program''s headline advantages.',
    '**No carrier-imposed (fuel) surcharges on partner awards as of the program''s current policy.** Aeroplan eliminated YQ/YR on partner bookings in 2020 and they have not returned. This is one of the program''s headline advantages.'
  ),
  award_chart = replace(replace(award_chart,
    '**Carrier-imposed surcharges:** $0 on any award (Aeroplan eliminated YQ/YR in 2020 - one of the program''s biggest structural advantages over United, Lufthansa M&M, and most other Star Alliance currencies).',
    '**Carrier-imposed surcharges:** $0 on partner airline awards (Aeroplan eliminated YQ/YR on partner bookings in 2020 - one of the program''s biggest structural advantages over United, Lufthansa M&M, and most other Star Alliance currencies).'
  ),
    '**Chase Aeroplan World Elite Mastercard** ($95 annual fee):',
    '**Chase Aeroplan World Elite Mastercard**:'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aeroplan';
