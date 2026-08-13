-- Connect content ideas to the content roadmap via tags.
-- roadmap_pillar: structured tag that slots an idea into one of the 6 roadmap
--   pillars (null = stays in the opportunistic feed).
-- tags: free-form keyword tags for richer filtering/search.
alter table content_ideas add column if not exists roadmap_pillar text;
alter table content_ideas add column if not exists tags text[] not null default '{}';
create index if not exists idx_content_ideas_roadmap_pillar on content_ideas (roadmap_pillar) where roadmap_pillar is not null;
