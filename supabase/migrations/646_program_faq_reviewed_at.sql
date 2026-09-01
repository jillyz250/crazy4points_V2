-- FAQ staleness guard for program pages.
-- The FAQ (programs.faq) is derived from the page's verified prose, so when the
-- underlying content changes (content_updated_at bumps) the FAQ may silently go
-- stale and feed a wrong answer to AI. faq_reviewed_at records when the FAQ was
-- last authored/verified. The morning snapshot flags any program whose
-- content_updated_at is NEWER than faq_reviewed_at, i.e. the facts moved after the
-- FAQ was last checked. Same pattern as credit_cards.good_to_know_review_at.
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS faq_reviewed_at timestamptz;

COMMENT ON COLUMN programs.faq_reviewed_at IS
  'When programs.faq was last authored/verified. If content_updated_at > faq_reviewed_at, the FAQ may be stale (morning-snapshot flags it). Stamp this whenever the FAQ is written or re-verified.';
