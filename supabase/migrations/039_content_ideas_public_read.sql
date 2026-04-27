-- Allow public (anon) read of published blog posts.
--
-- Without this, the public /blog index and /blog/[slug] pages return
-- empty results / 404 because Row Level Security blocks the anon role
-- from selecting content_ideas rows. Admin reads still go through the
-- service-role client (createAdminClient), which bypasses RLS.
--
-- Scope: only blog posts with status='published'. Drafts, dismissed
-- ideas, newsletter candidates, and anything else stays private.

-- Make sure RLS is on (it should already be — adding the policy is the
-- meaningful change). Idempotent if already enabled.
alter table content_ideas enable row level security;

-- Drop existing policy if present, so re-running this migration is safe.
drop policy if exists "Public read of published blog posts" on content_ideas;

create policy "Public read of published blog posts"
on content_ideas
for select
to anon, authenticated
using (type = 'blog' and status = 'published');
