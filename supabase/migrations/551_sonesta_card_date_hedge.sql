-- Disambiguate card discontinuation timing per LLM audit (it was Feb 2026 = early 2026, already past).
update programs set
  quirks = replace(quirks,
    'The former Sonesta World Mastercard was discontinued in 2026',
    'The former Sonesta World Mastercard was discontinued in early 2026'),
  updated_at = now()
where slug = 'sonesta';
