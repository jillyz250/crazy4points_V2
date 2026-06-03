-- 363 - Rename "World of Hyatt" program to "Hyatt" so it's findable under H
-- (not buried under "W") in the Card Finder program dropdown. Display-name only.
update programs set name = 'Hyatt' where slug = 'hyatt' and name <> 'Hyatt';
