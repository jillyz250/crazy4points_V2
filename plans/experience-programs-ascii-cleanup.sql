-- Replace non-ASCII characters in experience_programs descriptions with
-- ASCII equivalents. Per the project rule "ASCII-only in SQL data inserts" —
-- em-dashes (U+2014) and multiplication signs (U+00D7) get mangled by the
-- Supabase paste pipeline.
--
-- Run once to clean up the seed data inserted by migration 293.

update experience_programs
   set description = replace(
     replace(
       replace(description, ' — ', ' - '),
       '—',
       '-'
     ),
     ' × ',
     ' x '
   )
 where description is not null;

-- Also strip the multiplication sign in any leftover context (e.g. "Chase × United")
update experience_programs
   set description = replace(description, '×', 'x')
 where description like '%×%';
