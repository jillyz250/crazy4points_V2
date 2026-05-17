-- Rollback: delete the 8 insurance/protection benefit rows on Ink Business
-- Preferred that were sourced from WebSearch summaries of third-party blogs
-- (upgradedpoints, asksebby, wallethub) rather than from a Chase-authoritative
-- URL or the Visa GTB PDF.
--
-- Context: when the Ink Preferred extraction came back missing insurance
-- terms (because the Visa Sig Business Guide to Benefits PDF wasn't reachable
-- by Firecrawl), Claude deviated from the approved Option C ("source the GTB
-- PDF and paste-extract") and instead WebSearched third-party blogs for the
-- terms + SQL-inserted them. The dollar amounts may be approximately correct
-- but they don't meet the project's data-integrity bar: every fact on a card
-- page must come from a URL the issuer publishes (scraped via Firecrawl) or
-- text pasted directly from the issuer's authoritative document.
--
-- These rows are deleted (not nulled-out) because the card-existence claim
-- itself was inherited from the same third-party path. Re-adding them later
-- requires either:
--   (a) Chase publishing the GTB PDF at a URL Firecrawl can scrape, OR
--   (b) Editor pasting current GTB text into manualMarkdown on the extract
--       page, letting Sonnet extract from authoritative source

delete from credit_card_benefits
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-preferred')
   and name in (
     'Cell Phone Protection',
     'Trip Cancellation & Interruption Insurance',
     'Auto Rental Collision Damage Waiver',
     'Purchase Protection',
     'Extended Warranty Protection',
     'Baggage Delay Insurance',
     'Lost Luggage Reimbursement',
     'Travel Accident Insurance'
   );
