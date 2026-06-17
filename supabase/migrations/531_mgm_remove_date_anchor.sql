-- Remove "as of June 2026" date anchor from award_chart -- redundant with program terms hedge.

update programs set
  award_chart = replace(
    award_chart,
    '-- no categories, no peak pricing, no partner booking tiers as of June 2026.',
    '-- no categories, no peak pricing, no partner booking tiers.'
  ),
  updated_at = now()
where slug = 'mgm';
