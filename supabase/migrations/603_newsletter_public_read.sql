-- Allow anon (public site) to read only genuinely-published newsletter issues.
-- Mirrors the blog-posts public-read policy. Admin reads via service role (bypasses RLS).
-- The public gate is status='sent' AND is_public=true; the app query further
-- requires recipient_count>1 and reads only the structured slot columns
-- (never body_html), so no email tracking artifacts are exposed.

create policy "Public read of sent public newsletters"
  on newsletters for select
  using (status = 'sent' and is_public = true);
