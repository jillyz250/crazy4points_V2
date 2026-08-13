-- Marks a content idea as triaged for the roadmap. An idea leaves the open
-- triage queue when it's either tagged (roadmap_pillar set) OR reviewed as
-- "not roadmap material" (roadmap_reviewed = true, e.g. a dated deal).
alter table content_ideas add column if not exists roadmap_reviewed boolean not null default false;
