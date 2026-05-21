-- Phase 3 Wave 2 — public SELECT policies on topics + content_variants for
-- the subset that backs published alerts.
--
-- Today the anon role can read `alerts` (no policy needed, RLS effectively
-- open on that table). Topics + content_variants have RLS enabled with NO
-- public policy — admin server actions hit them via service-role which
-- bypasses RLS. Wave 2 will route public reads through these tables, so
-- anon needs minimum-surface read access.
--
-- Policy scope (defense in depth):
--   • topics:           SELECT WHERE status = 'active'
--   • content_variants: SELECT WHERE format = 'alert' AND status = 'published'
--
-- Draft / needs_review / archived rows + non-alert formats (blog, newsletter,
-- social) stay hidden until each format ships its own public route.
--
-- Reversible: DROP POLICY <name> ON <table>.

DROP POLICY IF EXISTS "Public can read active topics" ON public.topics;
CREATE POLICY "Public can read active topics"
  ON public.topics
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Public can read published alert variants" ON public.content_variants;
CREATE POLICY "Public can read published alert variants"
  ON public.content_variants
  FOR SELECT
  TO anon, authenticated
  USING (format = 'alert' AND status = 'published');

COMMENT ON POLICY "Public can read active topics" ON public.topics IS
  'Phase 3 Wave 2 — opens minimum-surface anon read access for public routes joined off content_variants. Only active (non-draft, non-archived) topics surface.';

COMMENT ON POLICY "Public can read published alert variants" ON public.content_variants IS
  'Phase 3 Wave 2 — opens public read for the alert format specifically. Other formats (blog, newsletter, social) stay hidden until their own public route ships.';
