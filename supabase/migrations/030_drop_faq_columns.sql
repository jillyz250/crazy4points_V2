-- Phase 2.5: Retire the legacy faq_content / faq_updated_at columns.
--
-- Their job (grounding the AI writer with authoritative program facts) is
-- now handled by the structured Page content fields: intro, transfer_partners,
-- sweet_spots, quirks, how_to_spend, tier_benefits, lounge_access. Those
-- ship with both editorial and structured shapes the writer can ground
-- against more reliably than a free-text blob.
--
-- This is destructive — column data is gone. The writer rewiring already
-- prefers Page content over faq_content; this just removes the dead fallback.

alter table programs
  drop column if exists faq_content,
  drop column if exists faq_updated_at;
