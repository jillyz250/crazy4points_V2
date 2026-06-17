-- Editorial directive: avoid math (derived figures) and excessive specificity.
-- Strip all DERIVED dollar equivalents (my arithmetic off the earn rate), soften over-specific
-- numbers in narrative prose, and drop the secondary airline conversion ratio. Keep published
-- facts that are genuinely useful (official Status Point thresholds in the qualification field,
-- elite bonus %), but remove number-clutter from the reading experience.

update programs set
  -- intro: drop the specific earn rate from narrative prose
  intro = replace(
    intro,
    'You earn both at 150 points per US$5 of qualified spend on rooms and dining.',
    'You earn both on qualified spend on rooms and dining.'
  ),

  -- sweet_spots: drop derived dollar + big Status Point figure; drop earn rate from prose
  sweet_spots = replace(
    replace(
      sweet_spots,
      'For a luxury program where Ruby otherwise needs 720,000 Status Points (about US$24,000 of spend), this is by far the strongest-value route to elite benefits.',
      'For a luxury program where reaching the top tier on your own takes very heavy spend, this is by far the strongest-value route to elite benefits.'
    ),
    'Because you earn 150 points per US$5 at participating restaurants and bars, members who frequent',
    'Because you earn points at participating restaurants and bars, members who frequent'
  ),

  -- award_chart: drop earn-rate specifics + corporate nuance, drop derived dollar equivalents, drop airline ratio
  award_chart = replace(
    replace(
      replace(
        award_chart,
        '- 150 Award Points and 150 Status Points per US$5 of qualified spend on rooms and dining (corporate travel bookers earn 15 Award Points per US$5 of eligible room revenue)',
        '- Award Points and Status Points are both earned on qualified spend on rooms and dining'
      ),
      '- Onyx: no minimum
- Topaz: 12,000 (about US$400 of qualified spend)
- Diamond: 108,000 (about US$3,600)
- Sapphire: 360,000 (about US$12,000)
- Ruby: 720,000 (about US$24,000) -- or via Mastercard World Elite fast-track',
      '- Onyx: entry tier, no minimum
- Topaz, Diamond, Sapphire: rising Status Point thresholds
- Ruby: top tier, the highest threshold -- or reachable via Mastercard World Elite fast-track'
    ),
    'Published terms indicate roughly 12,500 Award Points to 250 miles, with a 25,000-point minimum and 6-8 week processing. The rate varies by airline and is subject to change -- verify at brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions. At the 150-points-per-US$5 earn rate, this is poor value relative to redeeming for stays.',
    'The conversion runs at a poor ratio with a multi-week processing time, and the rate varies by airline and is subject to change. Verify current terms at brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions. Given how the points are earned, conversion is poor value relative to redeeming for stays.'
  ),

  -- tier_benefits: strip derived dollar equivalents from qualification fields (keep official Status Point thresholds)
  tier_benefits = replace(
    replace(
      replace(
        replace(
          tier_benefits::text,
          '12,000 Status Points (about US$400 of qualified spend at 150 Status Points per US$5)',
          '12,000 Status Points'
        ),
        '108,000 Status Points (about US$3,600 of qualified spend)',
        '108,000 Status Points'
      ),
      '360,000 Status Points (about US$12,000 of qualified spend)',
      '360,000 Status Points'
    ),
    '720,000 Status Points (about US$24,000 of qualified spend); also reachable via Mastercard World Elite fast-track',
    '720,000 Status Points; also reachable via Mastercard World Elite fast-track'
  )::jsonb,

  updated_at = now()
where slug = 'langham';
