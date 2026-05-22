-- Phase 4.5 PR B — narrative spine schema for social variants.
--
-- Three columns operationalize the "one narrative spine, multiple render
-- passes" architecture. Without these, generators invent intent dynamically
-- and per-platform regenerate slowly drifts variants away from each other.
--
-- See plans/phase4.5-social-variants.md for the full design + invariants
-- (SV7 primary_intent, SV8 generation_group_id).

BEGIN;

-- 1. topics.primary_intent — the ONE thing this content is trying to make
--    the reader feel/do. Declared per topic; every variant adapts around it.
ALTER TABLE topics ADD COLUMN primary_intent text;

ALTER TABLE topics ADD CONSTRAINT topics_primary_intent_check
  CHECK (primary_intent IS NULL OR primary_intent IN (
    'urgency',       -- "transfer before April 30"
    'education',     -- "here's how the new sweet spot works"
    'warning',       -- "this devaluation hits next month"
    'aspiration',    -- "this is what's possible with these points"
    'conversion',    -- "you should sign up for this card"
    'engagement',    -- "what would you redeem this for?"
    'authority'      -- "we tested this; here's what actually happened"
  ));

COMMENT ON COLUMN topics.primary_intent IS
  'The single editorial intent every variant of this topic adapts around. Prevents strategic fragmentation across platforms (X saying "book now" while LinkedIn says "industry shift" on the same topic). Generators consume this as the editorial spine. See SV7.';

-- 2. topics.recommended_visual_type — manual now; becomes routing key
--    when image gen returns (some visuals = AI, some = screenshots,
--    some = templated charts, some = nothing).
ALTER TABLE topics ADD COLUMN recommended_visual_type text;

ALTER TABLE topics ADD CONSTRAINT topics_visual_type_check
  CHECK (recommended_visual_type IS NULL OR recommended_visual_type IN (
    'award_chart',
    'route_map',
    'transfer_partner_logo',
    'hotel_photo',
    'cabin_photo',
    'app_screenshot',
    'pricing_comparison',
    'points_math',
    'no_image_needed'
  ));

COMMENT ON COLUMN topics.recommended_visual_type IS
  'Manual editorial hint for what kind of visual best supports this topic. Not all content deserves AI illustration — some wants a screenshot, some a chart, some no image at all. Routing key when image generation returns to the roadmap.';

-- 3. content_variants.generation_group_id — all variants generated together
--    in one "Generate social variants" click share one uuid. Per-platform
--    regenerate reuses the group_id + passes siblings as context to preserve
--    the bundle's narrative spine.
ALTER TABLE content_variants ADD COLUMN generation_group_id uuid;

CREATE INDEX idx_variants_generation_group
  ON content_variants(generation_group_id)
  WHERE generation_group_id IS NOT NULL;

COMMENT ON COLUMN content_variants.generation_group_id IS
  'All variants generated in one bundle share this uuid. Regenerating one variant reuses the group_id + passes sibling variants as context, preventing strategic drift across platforms. New group_id minted on full-bundle regenerate. See SV8.';

COMMIT;
