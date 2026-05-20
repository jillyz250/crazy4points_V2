-- Phase 2a.1 — Schema foundation for email-forwarding intake.
-- See plans/content-pipeline-overhaul-2026-05-20.md (v9) — Phase 2a + 2b.
--
-- Pure additive schema. Idempotent. Nothing existing changes.
--
-- Three new objects:
--   1. intel_email_senders — allowlist of approved sender addresses + domains
--   2. intel_email_quarantine — rejected inbound emails for editor review
--   3. sources extensions — intake_method enum + inbox_address column

-- ============================================================================
-- 1. intel_email_senders — sender allowlist (per-address OR per-domain)
-- ============================================================================

CREATE TABLE IF NOT EXISTS intel_email_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Either a full email address ("alerts@hyatt.com") OR a domain pattern
  -- ("@hyatt.com" — match any sender at that domain). Mutually exclusive
  -- via the CHECK below.
  email text,
  domain text,

  -- Optional: which source this sender feeds. NULL = generic intake.
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,

  -- Free-form note for the editor: "Hyatt's promo email list, signed up 5/19"
  notes text,

  active boolean NOT NULL DEFAULT true,

  CONSTRAINT intel_email_senders_one_of_check
    CHECK ((email IS NOT NULL AND domain IS NULL) OR (email IS NULL AND domain IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS intel_email_senders_email_uniq
  ON intel_email_senders (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS intel_email_senders_domain_uniq
  ON intel_email_senders (lower(domain))
  WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS intel_email_senders_active_idx
  ON intel_email_senders (active)
  WHERE active = true;

COMMENT ON TABLE intel_email_senders IS
  'Allowlist of approved sender addresses + domains for the email-forwarding intake (intel@crazy4points.com). An email from a sender on this list bypasses quarantine and feeds directly into ingestItem. Domain-level entries match any sender at that domain (DKIM/SPF still verified per-email). Editor-managed via /admin/sources.';

COMMENT ON COLUMN intel_email_senders.email IS
  'Exact sender email. Use for individual addresses like alerts@hyatt.com. Mutually exclusive with domain.';

COMMENT ON COLUMN intel_email_senders.domain IS
  'Sender domain match, e.g. "@hyatt.com" or "hyatt.com" (case-insensitive). Mutually exclusive with email.';

-- ============================================================================
-- 2. intel_email_quarantine — emails from unverified senders, pending review
-- ============================================================================

CREATE TABLE IF NOT EXISTS intel_email_quarantine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),

  sender_email text NOT NULL,
  sender_domain text,
  subject text,
  -- Raw provider payload (Resend / CloudMailin / Postmark format) for later replay.
  -- Attachments and unsafe HTML are STRIPPED before storage per Phase 2a.3
  -- security hardening. Body is sanitized to a strict allowlist (p/a/ul/li/strong/em).
  raw_payload jsonb NOT NULL,

  -- Why it landed here (filled by Phase 2a.3 inbound handler).
  reason text NOT NULL CHECK (reason IN (
    'sender_not_allowlisted',
    'dkim_fail',
    'spf_fail',
    'oversized',
    'parse_failure',
    'suspicious_pattern'
  )),

  -- Editor action: NULL = not yet reviewed.
  promoted_to_intel_id uuid REFERENCES intel_items(id) ON DELETE SET NULL,
  discarded_at timestamptz,
  discard_note text,

  -- Phase 5 retention sweep prunes rows older than 90 days.
  CONSTRAINT intel_email_quarantine_exclusive_action_check
    CHECK (NOT (promoted_to_intel_id IS NOT NULL AND discarded_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS intel_email_quarantine_received_at_idx
  ON intel_email_quarantine (received_at DESC);

CREATE INDEX IF NOT EXISTS intel_email_quarantine_unreviewed_idx
  ON intel_email_quarantine (received_at DESC)
  WHERE promoted_to_intel_id IS NULL AND discarded_at IS NULL;

CREATE INDEX IF NOT EXISTS intel_email_quarantine_sender_email_idx
  ON intel_email_quarantine (lower(sender_email));

COMMENT ON TABLE intel_email_quarantine IS
  'Emails received at intel@crazy4points.com that did NOT match the allowlist (or failed DKIM/SPF). Held for editor review at /admin/triage/quarantine. Editor can promote (auto-adds sender to allowlist) or discard. Phase 5 retention cron prunes rows after 90 days.';

COMMENT ON COLUMN intel_email_quarantine.raw_payload IS
  'Provider payload (Resend/CloudMailin/Postmark shape). Attachments stripped and HTML sanitized by inbound handler before storage. Editor can replay this through ingestItem if promoted.';

-- ============================================================================
-- 3. sources extensions — intake_method + inbox_address columns
-- ============================================================================

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS intake_method text,
  ADD COLUMN IF NOT EXISTS inbox_address text;

ALTER TABLE sources
  DROP CONSTRAINT IF EXISTS sources_intake_method_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_intake_method_check
  CHECK (intake_method IS NULL OR intake_method IN ('scrape', 'email', 'x', 'grok', 'manual'));

COMMENT ON COLUMN sources.intake_method IS
  'How intel from this source reaches the pipeline. scrape = Claude Scout via Firecrawl. email = forwarded to intel+<tag>@crazy4points.com. x = X API direct (Phase 2d, deferred). grok = xAI Grok poller (Phase 2c). manual = paste-in. NULL on legacy rows (Scout sources pre-Phase-2).';

COMMENT ON COLUMN sources.inbox_address IS
  'When intake_method=email, the per-source inbox alias like intel+marriott@crazy4points.com. Allows the inbound handler to attribute the email to the right source via the +tag prefix. NULL otherwise.';

CREATE UNIQUE INDEX IF NOT EXISTS sources_inbox_address_uniq
  ON sources (lower(inbox_address))
  WHERE inbox_address IS NOT NULL;

-- ============================================================================
-- 4. RLS — both new tables admin-only (no public reads)
-- ============================================================================

ALTER TABLE intel_email_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_email_quarantine ENABLE ROW LEVEL SECURITY;
