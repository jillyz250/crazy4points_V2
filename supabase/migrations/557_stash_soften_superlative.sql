-- Confidence re-check: "the largest of its kind in North America" is a superlative sourced to
-- Wikipedia/secondary, not Stash's own scraped pages. Soften to a factual, verifiable framing.
update programs set
  intro = replace(intro,
    'Stash Hotel Rewards is the points program for independent hotels -- the largest of its kind in North America.',
    'Stash Hotel Rewards is a points program built entirely around independent hotels rather than chains.'),
  updated_at = now()
where slug = 'stash';
