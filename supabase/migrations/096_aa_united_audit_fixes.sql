-- AA + United audit fixes (2026-05-04 evening final pass).
--
-- BACKGROUND
-- ----------
-- Bulk audit of all program pages tonight surfaced banned-word violations
-- per feedback_confidence_tag_drafts (no "best/only/first" comparative
-- claims) and one card-AF mention per feedback_no_card_af_on_program_pages.
--
-- Most pages are clean. AA has 6 real issues; United has 1.

-- ============================================================
-- AA AAdvantage fixes
-- ============================================================

update programs set
  intro = replace(coalesce(intro, ''),
                   'launched in 1981 as the first of its kind',
                   'launched in 1981 — one of the first commercial frequent flyer programs')
where slug = 'aa';

update programs set
  intro = replace(coalesce(intro, ''),
                   'the only major flexible currency to do so',
                   'a meaningful flexible-currency on-ramp for AAdvantage'),
  quirks = replace(coalesce(quirks, ''),
                    'the only major flexible-currency program that transfers to AAdvantage',
                    'a meaningful flexible-currency on-ramp for AAdvantage')
where slug = 'aa';

update programs set
  sweet_spots = replace(replace(coalesce(sweet_spots, ''),
                          'Among the best uses of AA miles',
                          'A standout use of AA miles'),
                         'among the best uses of AA miles',
                         'a standout use of AA miles'),
  intro       = replace(replace(coalesce(intro, ''),
                          'Among the best uses of AA miles',
                          'A standout use of AA miles'),
                         'among the best uses of AA miles',
                         'a standout use of AA miles')
where slug = 'aa';

update programs set
  sweet_spots = replace(coalesce(sweet_spots, ''),
                         '60k AA J on JAL is the best fixed rate in the game for US-Japan',
                         '60k AA J on JAL is one of the most aggressive fixed rates in points for US-Japan'),
  quirks      = replace(coalesce(quirks, ''),
                         '60k AA J on JAL is the best fixed rate in the game for US-Japan',
                         '60k AA J on JAL is one of the most aggressive fixed rates in points for US-Japan')
where slug = 'aa';

update programs set
  how_to_spend = replace(coalesce(how_to_spend, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program'),
  sweet_spots  = replace(coalesce(sweet_spots, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program'),
  quirks       = replace(coalesce(quirks, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program')
where slug = 'aa';

-- Strip the $595 annual fee mention from AA's lounge_access (Citi/AAdvantage Executive)
update programs set
  lounge_access = replace(coalesce(lounge_access, ''),
                           '($595 annual fee)',
                           ''),
  quirks        = replace(coalesce(quirks, ''),
                           '($595 annual fee)',
                           '')
where slug = 'aa';

-- ============================================================
-- United MileagePlus fix
-- ============================================================

update programs set
  how_to_spend = replace(coalesce(how_to_spend, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program'),
  sweet_spots  = replace(coalesce(sweet_spots, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program'),
  quirks       = replace(coalesce(quirks, ''),
                          'isn''t always the best program',
                          'isn''t necessarily the right program')
where slug = 'united';

-- ============================================================
-- Touch content_updated_at for both
-- ============================================================

update programs set content_updated_at = now() where slug in ('aa', 'united');
