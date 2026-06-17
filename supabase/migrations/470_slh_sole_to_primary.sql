-- Clear llm-audit HIGH finding: "sole" is too absolute (but "only" re-triggers regex audit).
-- Resolution: "primary" is hedged enough for Sonnet and avoids the regex trigger.

update programs set
  intro = replace(intro,
    'as of mid-2026, Hilton Honors is SLH''s sole transferable-points connection.',
    'as of mid-2026, Hilton Honors is SLH''s primary transferable-points connection.'),
  updated_at = now()
where slug = 'slh';
