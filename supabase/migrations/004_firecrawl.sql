-- Firecrawl flag: route source through Firecrawl /scrape for JS-rendered markdown
alter table sources
  add column if not exists use_firecrawl boolean not null default false;

-- Enable Firecrawl on all official_partner sources (JS-heavy program pages —
-- the biggest blind spot for the existing plain-fetch path).
update sources
   set use_firecrawl = true,
       updated_at    = now()
 where type = 'official_partner';
