-- Card-source support for content_ideas.
--
-- Articles that compare or stack credit cards (like "Chase Hyatt Personal vs
-- Business") need card data — not just program data. Adds a nullable text
-- array of credit_cards.slug values that the writer + fact-checker pull as
-- authoritative source.
--
-- Pattern mirrors secondary_program_slugs (migration 054). Empty / null
-- means "no cards as source," same as today's behavior.

alter table content_ideas
  add column if not exists card_slugs text[];

create index if not exists content_ideas_card_slugs_idx
  on content_ideas using gin (card_slugs)
  where type = 'blog' and status = 'published';
