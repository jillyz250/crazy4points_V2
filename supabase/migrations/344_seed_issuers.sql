-- Seed the six core card issuers so /admin/issuers has rows to render
-- and credit_cards rows can foreign-key to them.
--
-- Idempotent — on conflict (slug) do nothing — safe to re-run.
-- intro/notes left blank; editor fills via /admin/issuers/[slug]/edit.

insert into issuers (slug, name, website_url) values
  ('amex',         'American Express',     'https://www.americanexpress.com'),
  ('chase',        'Chase',                'https://creditcards.chase.com'),
  ('citi',         'Citi',                 'https://www.citi.com/credit-cards'),
  ('capital-one',  'Capital One',          'https://www.capitalone.com/credit-cards'),
  ('bilt',         'Bilt Rewards',         'https://www.biltrewards.com'),
  ('wells-fargo',  'Wells Fargo',          'https://www.wellsfargo.com/credit-cards')
on conflict (slug) do nothing;
