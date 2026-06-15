-- Reconcile the admin "never extracted" count. The cards admin page counts any
-- card without a credit_card_extractions row as "never extracted", inflating the
-- figure to 39 when only 28 cards are actually left to author. 5 of the 39 are
-- fully authored but predate the extraction-marking convention -> mark them
-- 'saved' (manual), same fix as the JetBlue cards. (The other 11-vs-28 gap is 6
-- defunct/inactive cards; those carry credit_cards.status='defunct' already and
-- are handled at the UI layer, not by faking an extraction row - the extraction
-- status enum has no 'defunct' value.)
insert into credit_card_extractions (card_id, source_url, raw_markdown, markdown_chars, extraction, status, model, saved_at, created_at)
select c.id, coalesce(c.official_url, 'manual://'||c.slug),
       'Authored prior to the extraction-marking convention; marked saved on reconciliation.', 80,
       jsonb_build_object('source','manual','reconciled','2026-06-15'), 'saved', 'manual', now(), now()
from credit_cards c
where c.slug in ('amex-everyday','amex-everyday-preferred','bank-of-america-allegiant','chase-world-of-hyatt','citi-prestige');
