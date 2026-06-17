-- Drop redundant "as of June 2026" date anchor from quirks Mesa note (today is June 2026).

update programs set
  quirks = replace(
    quirks,
    'the Mesa program shut down in December 2025, leaving no active transfer route as of June 2026.',
    'the Mesa program shut down in December 2025, leaving no active transfer route.'
  ),
  updated_at = now()
where slug = 'omni';
