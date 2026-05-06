-- Cathay final polish - hedge "no published award chart" claim.
update programs set
  quirks = replace(quirks,
    'No published award chart since April 2025 - rates have been community-reverse-engineered. Use the Cathay booking engine to confirm before transferring miles.',
    'No fully published award chart since April 2025 - rates surfaced via the Cathay booking engine and community sources. Always use the Cathay booking engine to confirm before transferring miles.'
  ),
  updated_at = now()
where slug = 'cathay';
