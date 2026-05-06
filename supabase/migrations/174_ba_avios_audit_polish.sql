-- BA Avios Sonnet audit polish - hedge "no surcharges on partners" absolutes.

update programs set
  how_to_spend = replace(how_to_spend,
    'BA Avios prices distance-banded on AA and Alaska metal with NO BA-style fuel surcharges.',
    'BA Avios prices distance-banded on AA and Alaska metal with no BA-style fuel surcharges as of mid-2026 (verify at booking; partner policies can change).'
  ),
  quirks = replace(quirks,
    '**Surcharges do not apply on most partner metal (AA, Alaska, Cathay, JAL, Aer Lingus, Iberia, Qantas).**',
    '**Surcharges are typically low or zero on most partner metal (AA, Alaska, Cathay, JAL, Aer Lingus, Iberia, Qantas) - but verify at booking, since individual partner surcharge policies vary and can change.**'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ba-avios';
