-- 625 — allow 'google_alert' as an intel_email_quarantine reason.
-- Forwarded Google Alerts (source_url = google.com/alerts) are aggregator
-- digests: one-email-one-item, not citable (issuer sources only), and redundant
-- with Scout's 25 Google News feeds. In practice they only produced garbled or
-- false items and polluted the triage/drift/signal queues. We now quarantine
-- them at ingest (recoverable via the quarantine review UI) instead of ingesting.

ALTER TABLE intel_email_quarantine DROP CONSTRAINT IF EXISTS intel_email_quarantine_reason_check;
ALTER TABLE intel_email_quarantine ADD CONSTRAINT intel_email_quarantine_reason_check
  CHECK (reason IN (
    'sender_not_allowlisted',
    'dkim_fail',
    'spf_fail',
    'oversized',
    'parse_failure',
    'suspicious_pattern',
    'google_alert'
  ));
