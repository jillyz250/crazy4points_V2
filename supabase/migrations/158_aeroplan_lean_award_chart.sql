-- Trim Aeroplan award_chart to lean Path-2 format.
--
-- Per project decision 2026-05-05: the exhaustive distance-band chart with
-- per-cabin pricing is tool-shaped data and belongs in the upcoming Booking
-- Tool (which reads from partner_redemptions). Program pages should keep:
--   - High-level structure callout (distance-banded, dynamic vs fixed, etc.)
--   - 3-5 narrative sweet-spot examples (already in sweet_spots)
--   - Co-brand card summary
--   - Link to official chart
-- Not the full table.
--
-- Same trim will apply to subsequent Batch A airlines (Singapore, ANA, BA,
-- etc.) and to a future trim-pass over already-shipped pages (AA, United,
-- Atmos, Delta, etc.).

update programs set
  award_chart = '## Aeroplan redemption structure

Aeroplan uses two pricing models depending on the operating carrier:

- **Star Alliance partner flights** are priced from a **fixed distance-banded chart** (not a range). Same point cost for every route in the same distance band, same cabin.
- **Air Canada-operated flights** use **dynamic pricing** with a published "starting from" floor that can rise based on demand and inventory.

**Carrier-imposed surcharges:** $0 on any award (Aeroplan eliminated YQ/YR in 2020 - one of the program''s biggest structural advantages over United, Lufthansa M&M, and most other Star Alliance currencies).

**Partner booking fee:** $39 CAD on awards that include a non-Air Canada segment.

**Optional stopover:** 5,000 points per direction, available only at points outside the US and Canada.

**No close-in award booking fee.**

The full distance-banded chart was updated effective June 1, 2026 (some premium-cabin transatlantic and transpacific bands rose 5,000-15,000 points one-way). For exact per-route pricing, use the official Flight Reward Chart linked below or the upcoming Booking Tool, which prices your route across all currencies that can book it.

**Official chart:** https://www.aircanada.com/content/dam/aircanada/loyalty-content/documents/flight-rewards-chart-en.pdf

### US co-brand card
**Chase Aeroplan World Elite Mastercard** ($95 annual fee):
- 3x grocery, dining, and Air Canada purchases; 1x other
- 75,000-point welcome offer after $4,000 spend in 3 months (current limited-time offer; standard offers vary)
- First checked bag free for cardholder + up to 8 companions on Air Canada
- 25% bonus on partner award redemptions

(Canada has 11 separate Aeroplan-branded cards via TD, CIBC, and Amex; out of scope for this US-focused page.)',
  updated_at = now()
where slug = 'aeroplan';
