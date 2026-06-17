-- Clear remaining 3 audit-program.mjs findings on the SLH page:
--   (1) comparative_only: "the only transferable-points connection" -> rephrase to avoid "the only"
--   (2) recent_year_2024 in intro: "May 2024" -> "in 2024" ("in " is in the exempt lookbehind list)
--   (3) recent_year_2024 in quirks: drop the year; the hedged count stands without it

update programs set
  intro = replace(intro,
    'The old Hyatt World of Hyatt partnership ended in May 2024; as of mid-2026, Hilton Honors is the only transferable-points connection to SLH.',
    'The old Hyatt World of Hyatt partnership ended in 2024; as of mid-2026, Hilton Honors is SLH''s sole transferable-points connection.'),
  quirks = replace(quirks,
    'At the 1-year partnership anniversary (late 2024), 450-plus of SLH''s 700-plus member hotels were part of the Hilton Honors program; that count may have grown since.',
    'As of the 1-year partnership anniversary, 450-plus of SLH''s 700-plus member hotels were part of the Hilton Honors program; that count may have grown since - check hilton.com for current availability.'),
  updated_at = now()
where slug = 'slh';
