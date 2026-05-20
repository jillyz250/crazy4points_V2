-- Phase 1d.1 — surface_locations function + auto-fill trigger + recompute helper.
--
-- Populates content_variants.surface_locations (added in migration 310). That
-- column drives the "Live on: home banner + marriott-bonvoy program page" line
-- in the Provenance Panel.
--
-- Activates automatically the moment Phase 3 backfills content_variants from
-- alerts — no code change required. Until then the table is empty and these
-- objects do nothing harmful.

-- ============================================================================
-- 1. Pure function — takes raw inputs, returns the surface-locations array.
--    Separate from the lookup wrapper so the trigger can call this without
--    re-querying the row it's already mutating.
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_surface_locations_inputs(
  p_format text,
  p_status text,
  p_end_date timestamptz,
  p_programs text[]
) RETURNS text[] AS $$
DECLARE
  v_out text[] := '{}';
  v_slug text;
BEGIN
  -- Only currently-published alerts surface anywhere on the public site.
  IF p_format <> 'alert' THEN
    RETURN '{}';
  END IF;
  IF p_status <> 'published' THEN
    RETURN '{}';
  END IF;
  IF p_end_date IS NOT NULL AND p_end_date < now() THEN
    RETURN '{}';
  END IF;

  -- Currently-published alerts always render in the home banner area.
  v_out := array_append(v_out, 'home_banner');

  -- One live_bar + program_page entry per tagged program.
  IF p_programs IS NOT NULL THEN
    FOREACH v_slug IN ARRAY p_programs
    LOOP
      IF v_slug IS NOT NULL AND v_slug <> '' THEN
        v_out := array_append(v_out, 'live_bar:' || v_slug);
        v_out := array_append(v_out, 'program_page:' || v_slug);
      END IF;
    END LOOP;
  END IF;

  RETURN v_out;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION compute_surface_locations_inputs(text, text, timestamptz, text[]) IS
  'Pure function for computing surface_locations from input columns. Used by the BEFORE INSERT/UPDATE trigger on content_variants and by the recompute_surface_locations() helper.';

-- ============================================================================
-- 2. Convenience wrapper — looks up the row + parent topic, calls pure function.
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_surface_locations(p_variant_id uuid)
RETURNS text[] AS $$
DECLARE
  v_format text;
  v_status text;
  v_end_date timestamptz;
  v_programs text[];
BEGIN
  SELECT cv.format, cv.status, t.end_date, t.programs
    INTO v_format, v_status, v_end_date, v_programs
    FROM content_variants cv
    LEFT JOIN topics t ON t.id = cv.topic_id
   WHERE cv.id = p_variant_id;

  IF NOT FOUND THEN
    RETURN '{}';
  END IF;

  RETURN compute_surface_locations_inputs(v_format, v_status, v_end_date, v_programs);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION compute_surface_locations(uuid) IS
  'Look up a content_variants row + parent topic and return where the variant currently renders on the public site. Used by the daily cron backstop and ad-hoc admin tooling.';

-- ============================================================================
-- 3. BEFORE INSERT/UPDATE trigger — auto-fills surface_locations on every
--    write to content_variants. Uses NEW values + parent topic lookup.
--
--    BEFORE trigger pattern avoids recursion: we're setting a column on the
--    row about to be written, not issuing another UPDATE.
-- ============================================================================

CREATE OR REPLACE FUNCTION content_variants_set_surface_locations() RETURNS TRIGGER AS $$
DECLARE
  v_end_date timestamptz;
  v_programs text[];
BEGIN
  -- Only meaningful for alert variants.
  IF NEW.format IS DISTINCT FROM 'alert' THEN
    NEW.surface_locations := '{}';
    RETURN NEW;
  END IF;

  SELECT end_date, programs INTO v_end_date, v_programs
    FROM topics WHERE id = NEW.topic_id;

  NEW.surface_locations := compute_surface_locations_inputs(
    NEW.format,
    NEW.status,
    v_end_date,
    v_programs
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_variants_set_surface_locations_trigger ON content_variants;
CREATE TRIGGER content_variants_set_surface_locations_trigger
  BEFORE INSERT OR UPDATE OF status, published_at, topic_id, format
  ON content_variants
  FOR EACH ROW EXECUTE FUNCTION content_variants_set_surface_locations();

COMMENT ON TRIGGER content_variants_set_surface_locations_trigger ON content_variants IS
  'Auto-populates content_variants.surface_locations before every insert/update of the columns that affect rendering. Caller never has to maintain this column manually.';

-- ============================================================================
-- 4. Recompute helper — bulk refresh for the daily cron + manual admin use.
--
--    Recomputes via the wrapper function so we pick up changes to topics.programs
--    or topics.end_date that the trigger on content_variants won't catch.
-- ============================================================================

CREATE OR REPLACE FUNCTION recompute_all_surface_locations()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE content_variants cv
     SET surface_locations = compute_surface_locations(cv.id)
   WHERE cv.format = 'alert'
     AND (cv.status = 'published' OR cv.surface_locations <> '{}');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION recompute_all_surface_locations() IS
  'Bulk recompute every alert variant''s surface_locations. Called by the /api/cron/recompute-surface-locations daily backstop. Returns the row count updated.';
