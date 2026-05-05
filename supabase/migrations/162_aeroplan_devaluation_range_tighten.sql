-- Aeroplan devaluation range tighten (round 2 of post-publish fact-check).
-- Migration 161 still understated the high end. Verified against Upgraded
-- Points (Apr 27, 2026): partner first-class transatlantic short-haul
-- +20,000; partner first-class ultra-long-haul +25,000; Air Canada-
-- operated business class Atlantic-Pacific +40,000. Reframing as a
-- structural description rather than a hard upper bound.

update programs set
  intro = replace(intro,
    'some bands moved up by 5,000-15,000 points one-way, while a few first-class bands rose closer to 20,000 points',
    'some bands moved up 5,000-15,000 points one-way, partner first-class on certain bands rose 20,000-25,000 points, and a few Air Canada-operated bands rose materially more'
  ),
  updated_at = now()
where slug = 'aeroplan';
