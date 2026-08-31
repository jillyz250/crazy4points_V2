# Award Change & Cancel Fees — research reference (UNVERIFIED)

**What this is:** a starting scaffold for the Phase 11 "Changes, Cancellations &
Delays" backfill (`programs.changes_policy`). Jill sourced this list on
2026-08-31. It lists, per airline, the award change/cancel deadline and fees.

**How to use it (do NOT publish it as-is):**
- **Cadence stays 1 airline/day** (Jill, 2026-08-31). This is a cross-check, not a
  bulk import.
- **Verify EVERY figure against the airline's OWN official change/cancel page**
  before writing the section. This list is corroboration, never the source, and it
  is already known to contain errors:
  - ⚠️ **American AAdvantage** — the list says "direct flight changes not allowed,
    must cancel and rebook." That is WRONG as of 2026-08-31: AA allows direct
    changes on many all-AA domestic awards (verified on aa.com). Corrected AA entry
    is already live on `/programs/aa`.
- **Reconcile:** when authoring an airline, compare official vs this list. If they
  agree, confidence is high. If they disagree, dig until you know which is right,
  and note it.
- **Strip foreign-currency valuations.** This list has "~$56 USD" style
  conversions throughout; those violate our no-foreign-currency-valuation rule.
  Published prose cites the native fee only (e.g. "TRY 150," "€50," "CAD 100").
- **Format:** author in the 4-bullet house format (How to change or cancel / Fees /
  If your flight is delayed or changed / How to reach the airline), matching
  `/programs/united` and `/programs/aa`.

**Done so far:** united, atmos, aa (verified). Delta + alaska still missing despite
earlier notes — re-author them from official.

---

## The list (verify each before publishing)

- **Aeromexico Rewards:** Change/cancel before flight. Change: 1,070 MXN domestic / 1,930 MXN international. Cancel: 1,930 MXN domestic / 2,900 MXN international.
- **Aer Lingus AerClub:** Change/cancel 24h prior. Change: GBP 35. Cancel: GBP 35.
- **Air Canada Aeroplan:** Change/cancel at least 2h prior. Change: CAD 0 to CAD 100 per direction depending on fare class. Cancel: CAD 75 to CAD 175 depending on fare class and channel.
- **Air France-KLM Flying Blue:** Change/cancel before check-in. Change: EUR 70 per ticket. Cancel: EUR 70 per ticket.
- **Air New Zealand Airpoints:** Change/cancel prior to departure. Change: 0 on flex fares, 50 NZD on other fare types. Cancel: 0 on flexirefund fares, non-refundable on others.
- **Alaska / Atmos Rewards:** Change/cancel prior to departure. Change: free (Saver non-changeable). Cancel: free (Saver non-refundable outside 24h of booking). Partner booking fee 12.50 USD non-refundable.
- **American AAdvantage:** Cancel prior to departure. Change: direct changes allowed on many all-AA domestic awards (LIST SAYS not allowed — WRONG, see above). Cancel: free; no-show forfeits the whole award.
- **ANA Mileage Club:** Cancel before departure, change 96h prior. Change: free. Cancel: 3,000 miles or 3,000 JPY.
- **Asiana Club:** Change/cancel prior to departure. Change: 3,000 miles. Cancel: free if 91+ days prior; 3,000 miles within 90 days.
- **Avianca LifeMiles:** Date changes only. Change: 210 USD per ticket. Cancel: 50 (single-region) to 200 (multi-region).
- **British Airways Avios:** Change/cancel 24h prior. Change: 55 USD or forfeit taxes/fees (lower). Cancel: same.
- **Cathay Pacific Asia Miles:** Rebook before original departure date. Change: 7,500 miles online. Cancel: 17,000 miles.
- **Delta SkyMiles:** Change/cancel before departure (to 10 min prior domestic). Change: free for North American origin (Basic Economy non-changeable). Cancel: free for standard; Basic Economy forfeits 9,900 to 19,900 miles.
- **Emirates Skywards:** Change/cancel prior to departure. Change: 25 USD Saver (0 Flex Plus). Cancel: 75 USD Saver (0 Flex Plus).
- **Etihad Guest:** Route changes not allowed (cancel and rebook); change >7 days prior. Change: AED 100 date change fee. Cancel: forfeit 25% of miles (21+ days), 50% (8-21 days), 75% (1-7 days), 100% (<24h/no-show).
- **EVA Air Infinity MileageLands:** Change/cancel prior to departure. Change: 50 USD. Cancel: 50 USD (100-150 if no-show).
- **Frontier Miles:** Change/cancel prior to departure. Change: 0 (60+ days), 49 (59-7 days), 99 (6 days or less) on standard fares (0 bundled). Cancel: 99 per direction standard (0 bundled).
- **Hawaiian Airlines HawaiianMiles:** Change/cancel prior to departure. Change: free. Cancel: free.
- **Iberia Plus:** Iberia/BA operated only; request 24h prior. Change: EUR 25 (0 Full Fare Economy). Cancel: EUR 25 (0 Full Fare Economy).
- **JAL Mileage Bank:** Direct changes not permitted. Change: N/A (cancel and rebook). Cancel: 3,100 JPY.
- **JetBlue TrueBlue:** Change/cancel prior to departure. Change: free standard (Blue Basic not changeable). Cancel: free standard (100-200 penalty Blue Basic).
- **Korean Air SKYPASS:** International flights. Change: KRW 30,000. Cancel: free 91+ days; 3,000 miles within 90 days; 10,000 miles after expiration.
- **LATAM Pass:** Depends on route. Change: 15-200 USD. Cancel: 25-250 USD.
- **Lufthansa Miles & More:** Date/time changes only on standard awards. Change: EUR 50 per person. Cancel: EUR 50 per ticket.
- **Qantas Frequent Flyer:** Change/cancel at least 24h prior. Change: 5,000 points. Cancel: 6,000 points.
- **Qatar Privilege Club:** Request at least 3h prior. Change: 25 USD (>24h) or 100 USD (3-24h). Cancel: same.
- **SAS EuroBonus:** Change/cancel 1h prior SAS (24h partner). Change: EUR 25 short-haul / EUR 75 long-haul (0 Pro fare). Cancel: same.
- **Singapore KrisFlyer:** Change/cancel prior to departure. Change: 25 USD SQ Saver (0 Advantage), 50 USD partner. Cancel: 75 USD Saver (50 Advantage).
- **Southwest Rapid Rewards:** Change/cancel to 10 min prior. Change: free (pay point difference). Cancel: free.
- **Spirit Free Spirit:** Change/cancel prior to departure. Change: free (point fare difference). Cancel: free.
- **TAP Miles&Go:** Varies by route. Change: 25 to 150 EUR/USD. Cancel: 75 to 100 EUR/USD.
- **Turkish Miles&Smiles:** Change/cancel prior to departure. Change: TRY 150 domestic / 70 USD international. Cancel: same (150 USD no-show).
- **United MileagePlus:** Cancel prior to departure. Change: free. Cancel: free (125 no-show). (Matches our live page.)
- **Virgin Atlantic Flying Club:** Change/cancel 24h prior. Change: GBP 30 departing UK / 50 USD departing US. Cancel: same.
