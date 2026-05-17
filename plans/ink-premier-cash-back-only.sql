-- Chase Ink Business Premier — cash-back-only correction.
--
-- Per Chase's own published rules (confirmed 2026-05-17 via Chase's redemption
-- page, MilesTalk, and TPG):
--   - Points earned on Ink Business Premier CANNOT transfer to any airline
--     or hotel partner.
--   - Points CANNOT be pooled with other Chase Ultimate Rewards cards to
--     unlock transfers (unlike Freedom Flex/Unlimited and Ink Cash/Unlimited,
--     which CAN be pooled into a Sapphire Preferred/Reserve or Ink Preferred).
--   - Redemption is cash-back only: statement credit, deposit to checking/
--     savings, or 1 cpp travel through Chase Travel portal.
--
-- The Ink Premier extraction defaulted currency_program_id to
-- chase-ultimate-rewards (because the card name has "Ink" in it), which would
-- cause the public card page to show the full UR partner table — misleading.
--
-- Fix: null out the currency_program_id so neither the transfer-partners
-- table NOR the sibling-unlock alert renders. Also flip the transferable
-- flag to false for completeness (matches the family-pairing logic).

update credit_cards
   set currency_program_id = null,
       points_transferable_to_partners = false
 where slug = 'chase-ink-business-premier';
