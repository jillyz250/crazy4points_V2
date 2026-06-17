update programs set
  tier_benefits = replace(
    replace(
      replace(
        tier_benefits::text,
        'Base level on joining (free); no tier requirement',
        'Base level on joining at no cost; no tier requirement'
      ),
      'standard seats free when reserved within 48 hours of departure',
      'standard seats at no charge when reserved within 48 hours of departure'
    ),
    'Free reservation of all seat types',
    'Complimentary reservation of all seat types'
  )::jsonb,
  updated_at = now()
where slug = 'air-europa';
