-- Qantas final polish: hedge "best in the sky" superlative.
update programs set
  sweet_spots = replace(sweet_spots,
    'the QF First suite is widely considered one of the best in the sky.',
    'the QF First suite has historically drawn strong reviews from Business and First class travelers.'
  ),
  updated_at = now()
where slug = 'qantas';
