-- Clear llm-audit MEDIUM: "primary" is ambiguous about other partners.
-- "exclusive" is factually backed by the Hilton anniversary press release
-- which explicitly describes this as an "exclusive partnership".
-- Also update the quirks to match consistent framing.

update programs set
  intro = replace(intro,
    'as of mid-2026, Hilton Honors is SLH''s primary transferable-points connection.',
    'as of mid-2026, Hilton Honors is SLH''s exclusive transferable-points connection.'),
  quirks = replace(quirks,
    'Hilton Honors is now the sole transferable-points connection.',
    'Hilton Honors is now SLH''s exclusive transferable-points partner.'),
  updated_at = now()
where slug = 'slh';
