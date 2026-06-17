-- Fix 3 audit-program.mjs findings on the SLH page:
--   (1) comparative_only: "only transferable-points program" -> hedged with as-of anchor
--   (2) recent_year_2024 in intro: Hyatt end date -> add as-of context
--   (3) recent_year_2024 in quirks: "As of late 2024" -> soften to reported figure

update programs set
  intro = replace(intro,
    'The old Hyatt World of Hyatt partnership ended in May 2024. Hilton is now the only transferable-points program that touches SLH.',
    'The old Hyatt World of Hyatt partnership ended in May 2024; as of mid-2026, Hilton Honors is the only transferable-points connection to SLH.'),
  quirks = replace(quirks,
    'As of late 2024, 450-plus of SLH''s 700-plus member hotels are part of the Hilton Honors program.',
    'At the 1-year partnership anniversary (late 2024), 450-plus of SLH''s 700-plus member hotels were part of the Hilton Honors program; that count may have grown since.'),
  updated_at = now()
where slug = 'slh';
