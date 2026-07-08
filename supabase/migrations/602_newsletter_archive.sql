-- Public newsletter archive: slug (editorial URL), is_public gate, issue_number.
-- is_public is the explicit publish gate (default false); the archive query also
-- requires status='sent' AND recipient_count > 1 so a test-to-self can never surface.

alter table newsletters
  add column if not exists slug text,
  add column if not exists is_public boolean not null default false,
  add column if not exists issue_number integer;

create unique index if not exists newsletters_slug_key on newsletters (slug) where slug is not null;

-- Backfill the 5 genuine full-list sends (editorial slugs, chronological issue numbers).
update newsletters set slug='no-deals-lets-talk-strategy', is_public=true, issue_number=1 where id='7db64e19-86a7-4b55-ba5b-840f9326cf46';
update newsletters set slug='spirit-miles-confetti',       is_public=true, issue_number=2 where id='65c3d3bd-5130-4039-8cb2-df1b75098a83';
update newsletters set slug='dinner-fifa-soccer-field',    is_public=true, issue_number=3 where id='7925d1ad-6e97-4284-bcb5-318559f7ed6e';
update newsletters set slug='wellness-hotels-roundup',     is_public=true, issue_number=4 where id='c1a85cf3-076f-4b91-8e27-f86efe253bee';
update newsletters set slug='it-pays-to-paze',             is_public=true, issue_number=5 where id='98561f39-d7f7-40df-b61b-5c7ca2c09675';
