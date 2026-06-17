-- Clear misleading "Independent" badge from standalone hotel chains.
-- The alliance field was designed for airline alliances; for hotel chains that
-- ARE the brand (Hilton, Marriott, etc.), the badge is nonsensical.
-- Setting alliance = null suppresses the badge on the program hero (same as unAuthored programs).
--
-- Stays 'none' ("Independent"): leading-hotels, iprefer
--   -> their member hotels are genuinely independent properties; the label is accurate.
-- Stays 'other' ("Partnership"): slh
--   -> exclusive Hilton Honors partnership already set in migration 475.

update programs set
  alliance = null,
  updated_at = now()
where type = 'hotel'
  and slug in (
    'hilton',
    'marriott-bonvoy',
    'hyatt',
    'ihg',
    'wyndham',
    'radisson',
    'best-western',
    'choice',
    'shangri-la'
  );
