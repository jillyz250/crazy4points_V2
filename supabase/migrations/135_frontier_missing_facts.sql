-- Add facts I missed in the original Frontier seed (mig 132).
--
-- Caught by the new auto-grep summary feature added to research-program.mjs
-- after the Frontier session - re-running the script against the same
-- scraped markdown surfaced these ground-truth facts that I'd skipped.
--
-- Four adds:
-- 1. Stopovers NOT permitted for Award travel (T&C line 163) - meaningful
--    redemption restriction readers will want to know.
-- 2. Last Seat availability is "not guaranteed" - tighten the existing
--    "available whenever unsold seats remain" wording in award_chart.
-- 3. 180-day retroactive mile credit window from T&C - useful tip.
-- 4. Frontier Airlines BUSINESS Mastercard (also Barclays-issued, special
--    offers) - I only mentioned the consumer World Mastercard.

update programs set
  quirks = quirks || '
- **Stopovers are NOT permitted on Frontier award travel.** Per Frontier''s T&C, you cannot have an overnight stay at a connecting city on a single award itinerary. Each award redemption is one continuous one-way journey; book separately if you want to break a trip.
- **180-day retroactive mile credit window** - if you forgot to add your FRONTIER Miles number when booking, you can request retroactive credit up to 180 days back. Travel partners may have shorter windows but Frontier''s outer cap is 180 days.
- **Frontier Airlines Business Mastercard** also exists alongside the consumer World Mastercard - both are Barclays-issued. The Business card is offered through special targeted offers rather than a permanent public application page; if you''re a small-business owner who flies Frontier regularly, watch the Barclays cards page or status-match-style offers.',

  award_chart = replace(award_chart,
    '| **Last Seat** | Elite-only (Silver and above). Most miles. Available whenever seats remain. | Always |',
    '| **Last Seat** | Elite-only (Silver and above). Most miles. Per Frontier T&C, "Last seat availability is not guaranteed" - inventory is generally available when unsold seats remain on the flight, but Frontier reserves the right to limit. | Generally yes (not guaranteed) |'
  ),
  last_verified = now(),
  content_updated_at = now(),
  updated_at = now()
where slug = 'frontier';
