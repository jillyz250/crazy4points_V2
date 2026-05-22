-- Phase 4.5 PR A — rename content_variants.format='twitter' → 'x' for naming
-- consistency with the platform's actual brand. Updates the CHECK constraint
-- to reflect the canonical set of formats.
--
-- Preflight verified: 0 rows currently have format='twitter' (the social
-- variant generators are about to land in PR B; nothing has been written yet).
--
-- Image gen formats (social_images table) are NOT in this migration —
-- image generation is deferred (see plans/phase4.5-social-variants.md).

BEGIN;

-- 1. Rename any existing twitter rows (defensive — preflight showed zero, but
--    cheap insurance against a race where one lands during migration).
UPDATE content_variants SET format = 'x' WHERE format = 'twitter';

-- 2. Replace the CHECK constraint. The original was inline at table creation
--    (migration 298) and auto-named content_variants_format_check.
ALTER TABLE content_variants DROP CONSTRAINT IF EXISTS content_variants_format_check;

ALTER TABLE content_variants ADD CONSTRAINT content_variants_format_check
  CHECK (format IN (
    'alert',
    'blog',
    'newsletter',
    'facebook',
    'instagram',
    'linkedin',
    'x',
    'threads'
  ));

COMMIT;
