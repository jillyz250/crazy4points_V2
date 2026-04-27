-- Fix UTF-8 → MacRoman → UTF-8 double-encoding in hotel_properties.
--
-- During the bulk CSV import (PR #193), UTF-8 source bytes were
-- misinterpreted as MacRoman somewhere in the paste/parse path, then
-- re-saved as UTF-8 — producing "valid" UTF-8 strings whose codepoints
-- represent the wrong characters.
--
-- Examples:
--   "San Jos√© Escaz√∫" should be "San José Escazú"
--   "Paris √âtoile"    should be "Paris Étoile"
--   "Curaçao"          shows as "Cura√ßao"
--
-- Each replacement pair maps the mojibake to the intended character. Order
-- matters when one substitution's output could match another's input — the
-- 2-char patterns ("√â") need to run BEFORE any 1-char "√" cleanup. Safe to
-- re-run; idempotent because the targets don't contain "√".
--
-- Scope: hotel_properties.name and .city only. Other columns (notes, brand,
-- country) are mostly ASCII and unlikely to be affected.

update hotel_properties set
  name = replace(name, '√â', 'É'),
  city = replace(city, '√â', 'É')
where name like '%√â%' or city like '%√â%';

update hotel_properties set
  name = replace(name, '√Å', 'Á'),
  city = replace(city, '√Å', 'Á')
where name like '%√Å%' or city like '%√Å%';

update hotel_properties set
  name = replace(name, '√ì', 'Ó'),
  city = replace(city, '√ì', 'Ó')
where name like '%√ì%' or city like '%√ì%';

update hotel_properties set
  name = replace(name, '√Ñ', 'Ä'),
  city = replace(city, '√Ñ', 'Ä')
where name like '%√Ñ%' or city like '%√Ñ%';

update hotel_properties set
  name = replace(name, '√ú', 'Ü'),
  city = replace(city, '√ú', 'Ü')
where name like '%√ú%' or city like '%√ú%';

update hotel_properties set
  name = replace(name, '√Ö', 'Å'),
  city = replace(city, '√Ö', 'Å')
where name like '%√Ö%' or city like '%√Ö%';

update hotel_properties set
  name = replace(name, '√Ω', 'Ý'),
  city = replace(city, '√Ω', 'Ý')
where name like '%√Ω%' or city like '%√Ω%';

-- Lowercase 2-byte sequences (most common)
update hotel_properties set
  name = replace(name, '√°', 'á'),
  city = replace(city, '√°', 'á')
where name like '%√°%' or city like '%√°%';

update hotel_properties set
  name = replace(name, '√©', 'é'),
  city = replace(city, '√©', 'é')
where name like '%√©%' or city like '%√©%';

update hotel_properties set
  name = replace(name, '√≠', 'í'),
  city = replace(city, '√≠', 'í')
where name like '%√≠%' or city like '%√≠%';

update hotel_properties set
  name = replace(name, '√≥', 'ó'),
  city = replace(city, '√≥', 'ó')
where name like '%√≥%' or city like '%√≥%';

update hotel_properties set
  name = replace(name, '√∫', 'ú'),
  city = replace(city, '√∫', 'ú')
where name like '%√∫%' or city like '%√∫%';

update hotel_properties set
  name = replace(name, '√±', 'ñ'),
  city = replace(city, '√±', 'ñ')
where name like '%√±%' or city like '%√±%';

update hotel_properties set
  name = replace(name, '√ß', 'ç'),
  city = replace(city, '√ß', 'ç')
where name like '%√ß%' or city like '%√ß%';

update hotel_properties set
  name = replace(name, '√º', 'ü'),
  city = replace(city, '√º', 'ü')
where name like '%√º%' or city like '%√º%';

update hotel_properties set
  name = replace(name, '√∂', 'ö'),
  city = replace(city, '√∂', 'ö')
where name like '%√∂%' or city like '%√∂%';

update hotel_properties set
  name = replace(name, '√§', 'ä'),
  city = replace(city, '√§', 'ä')
where name like '%√§%' or city like '%√§%';

update hotel_properties set
  name = replace(name, '√†', 'à'),
  city = replace(city, '√†', 'à')
where name like '%√†%' or city like '%√†%';

update hotel_properties set
  name = replace(name, '√®', 'è'),
  city = replace(city, '√®', 'è')
where name like '%√®%' or city like '%√®%';

update hotel_properties set
  name = replace(name, '√¨', 'ì'),
  city = replace(city, '√¨', 'ì')
where name like '%√¨%' or city like '%√¨%';

update hotel_properties set
  name = replace(name, '√≤', 'ò'),
  city = replace(city, '√≤', 'ò')
where name like '%√≤%' or city like '%√≤%';

update hotel_properties set
  name = replace(name, '√π', 'ù'),
  city = replace(city, '√π', 'ù')
where name like '%√π%' or city like '%√π%';

update hotel_properties set
  name = replace(name, '√£', 'ã'),
  city = replace(city, '√£', 'ã')
where name like '%√£%' or city like '%√£%';

update hotel_properties set
  name = replace(name, '√µ', 'õ'),
  city = replace(city, '√µ', 'õ')
where name like '%√µ%' or city like '%√µ%';

update hotel_properties set
  name = replace(name, '√Ç', 'Â'),
  city = replace(city, '√Ç', 'Â')
where name like '%√Ç%' or city like '%√Ç%';

update hotel_properties set
  name = replace(name, '√¢', 'â'),
  city = replace(city, '√¢', 'â')
where name like '%√¢%' or city like '%√¢%';

update hotel_properties set
  name = replace(name, '√™', 'ê'),
  city = replace(city, '√™', 'ê')
where name like '%√™%' or city like '%√™%';

update hotel_properties set
  name = replace(name, '√Æ', 'î'),
  city = replace(city, '√Æ', 'î')
where name like '%√Æ%' or city like '%√Æ%';

update hotel_properties set
  name = replace(name, '√¥', 'ô'),
  city = replace(city, '√¥', 'ô')
where name like '%√¥%' or city like '%√¥%';

-- Verify after running:
--   select id, name, city from hotel_properties where name like '%√%' or city like '%√%';
-- If any rows still match, paste them back so we can extend this script.
