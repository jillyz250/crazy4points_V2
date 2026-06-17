-- Simplify the no-transfer-partner note per LLM audit: drop the now-defunct Mesa narrative
-- (added/shut-down trivia that risks implying transfers are possible). Keep the Amex FHR aside.

update programs set
  quirks = replace(
    quirks,
    'There is no Omni co-brand card. Mesa briefly offered point transfers into Omni (added June 2025), but the Mesa program shut down in December 2025, leaving no active transfer route. Credits come from Omni stays and on-property spend.',
    'There is no Omni co-brand card and no active transfer partner, so credits come almost entirely from Omni stays and on-property spend.'
  ),
  updated_at = now()
where slug = 'omni';
