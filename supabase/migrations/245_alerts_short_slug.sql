-- 245_alerts_short_slug.sql
-- Add a short, human-readable slug to alerts for shareable URLs.
--
-- Current URLs use the auto-generated intel ID (e.g. intel-9efbb507-1778...)
-- which is fine for permalinks but ugly for social sharing. New short_slug
-- gives us /a/hawaiian-airlines-oneworld that 301-redirects to the canonical
-- /alerts/<full-slug>.
--
-- Backfill for existing published alerts is performed inline below — runs
-- once at migration time. New alerts get a short_slug at publish time
-- (handled in the publish server action).
--
-- Authored: 2026-05-12

begin;

alter table alerts
  add column if not exists short_slug text;

-- Case-insensitive uniqueness (lower-case canonical form already enforced
-- by the slug-generator, but belt + suspenders).
create unique index if not exists alerts_short_slug_uniq
  on alerts (lower(short_slug))
  where short_slug is not null;

create index if not exists alerts_short_slug_idx
  on alerts (short_slug)
  where short_slug is not null;

-- ── Backfill: generate short_slug for every published alert ────────────
-- Algorithm: lowercase title, drop everything after first separator (→ ↔ —),
-- remove non-alphanumerics, drop stop words, keep up to 5 words, truncate
-- to 40 chars, kebab-case. On collision, append -2, -3, etc.

do $$
declare
  r record;
  base text;
  candidate text;
  counter int;
  exists_already int;
begin
  for r in
    select id, title
    from alerts
    where short_slug is null
      and status = 'published'
    order by published_at desc nulls last, created_at desc
  loop
    -- Step 1: lowercase + drop after first separator
    base := lower(r.title);
    base := regexp_replace(base, '\s*(?:→|↔|—|--).*$', '', 'g');
    -- Step 2: strip non-alphanumeric (replace with space)
    base := regexp_replace(base, '[^a-z0-9\s]', ' ', 'g');
    -- Step 3: collapse whitespace, trim
    base := trim(regexp_replace(base, '\s+', ' ', 'g'));
    -- Step 4: drop stop words, take first 5 meaningful words
    -- Stop word list inline since this is one-off
    base := array_to_string(
      (
        select array_agg(w order by ord)
        from (
          select w, ord
          from unnest(string_to_array(base, ' ')) with ordinality as t(w, ord)
          where w not in ('the','a','an','and','or','with','now','on','in','of','is','to','for','from')
          limit 5
        ) sub
      ),
      '-'
    );
    -- Step 5: truncate to 40 chars
    base := substring(coalesce(base, '') from 1 for 40);
    -- Step 6: trim trailing hyphen if cut mid-word
    base := regexp_replace(base, '-+$', '', 'g');

    -- Fallback if title produced nothing meaningful
    if base is null or length(base) = 0 then
      base := 'alert-' || substring(r.id::text, 1, 6);
    end if;

    -- Step 7: ensure uniqueness via counter suffix
    candidate := base;
    counter := 2;
    loop
      select count(*) into exists_already
      from alerts
      where lower(short_slug) = candidate
        and id != r.id;
      exit when exists_already = 0;
      candidate := base || '-' || counter::text;
      counter := counter + 1;
      exit when counter > 99;
    end loop;

    update alerts set short_slug = candidate where id = r.id;
  end loop;
end $$;

commit;
