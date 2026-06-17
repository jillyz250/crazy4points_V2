-- Minor LLM audit fix: tighten Mesa shutdown phrasing in quirks.

update programs set
  quirks = replace(
    quirks,
    'Mesa briefly offered point transfers into Omni (added June 2025) but the Mesa program shut down in December 2025, leaving no active transfer route as of June 2026.',
    'Mesa briefly offered point transfers into Omni (added June 2025), but the Mesa program shut down in December 2025, leaving no active transfer route as of June 2026.'
  ),
  updated_at = now()
where slug = 'omni';
