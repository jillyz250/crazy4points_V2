-- Fix llm-audit MEDIUM finding in intro:
-- "The flip side:" incorrectly frames network size as opposite of discount structure.
-- Replacing with neutral "That said," transition.

update programs set
  intro = replace(intro,
    'The flip side:',
    'That said,'),
  updated_at = now()
where slug = 'barcelo';
