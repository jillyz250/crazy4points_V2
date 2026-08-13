-- AI-suggested roadmap tags (pending your approval), separate from the final
-- roadmap_pillar/tags so a suggestion stays "pending" until approved.
alter table content_ideas add column if not exists suggested_pillar text;
alter table content_ideas add column if not exists suggested_tags text[];
