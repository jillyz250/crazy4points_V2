-- Phase 2a.3 follow-up: extend intel_items.source_type CHECK constraint.
--
-- Migration 001 defined source_type as 'official' | 'blog' | 'reddit' | 'social'.
-- Phase 2 needs to also accept 'email' (forwarded email intake), 'ai-discovery'
-- (Grok poller, planned for Phase 2c), and 'manual' (paste-in via Triage).
--
-- Discovered during Phase 2a.3 integration test — email inbound was failing
-- with a CHECK violation. v9 plan called this out but migration 315 missed it.
--
-- Idempotent. Existing rows already satisfy the new wider constraint.

ALTER TABLE intel_items
  DROP CONSTRAINT IF EXISTS intel_items_source_type_check;

ALTER TABLE intel_items
  ADD CONSTRAINT intel_items_source_type_check
  CHECK (source_type IN (
    'official',
    'blog',
    'reddit',
    'social',
    'email',
    'ai-discovery',
    'manual'
  ));
