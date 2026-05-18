# Hilton Honors — Candidate Outbound Transfer Partners (NEEDS ISSUER VERIFICATION)

**Status: 🔴 DO NOT WRITE TO DB.** This data comes from third-party blogs, NOT issuer-direct. Per editorial policy (2026-05-17 Ink Preferred rollback), no third-party blogs may be propagated into programs.* without verification against Hilton's own logged-in conversion page.

**Hilton's logged-in page was not returning results on 2026-05-18.** Retry steps:
1. Different browser / incognito
2. Hilton mobile app: Use Points → Airline Exchange
3. Phone Diamond Desk → request current airline exchange table
4. `newsroom.hilton.com` press releases for partner adds/drops

## Candidate list — conflicts flagged

Three blog sources cross-referenced on 2026-05-18 disagreed on key ratios. Treat **every row** as "unconfirmed — needs issuer verification."

| Partner | Candidate ratio | Conflict notes |
|---|---|---|
| Aeroplan (Air Canada) | 10:1 | Consistent |
| Flying Blue (Air France/KLM) | 10:1 | Consistent — 20,000 min noted by one source |
| AirAsia BIG | 10:2 (5:1) | Consistent |
| Aeromexico Rewards | ~25:6.5 (or 50:13) | ⚠️ Minimum + ratio vary by source |
| ANA Mileage Club | 10:1 | Consistent |
| British Airways Avios | 10:1 | Consistent |
| Cathay Pacific Asia Miles | 10:1 | Consistent |
| China Eastern | 10:1 | Single source |
| Delta SkyMiles | 10:1 | Consistent |
| Emirates Skywards | 10:1 | Consistent |
| Ethiopian ShebaMiles | 10:1 | Single source |
| Etihad Guest | 10:1 | Single source |
| EVA Air | 10:1 | Single source |
| Hainan Fortune Wings | 2.5:1 | Consistent (much better than default) |
| InterMiles | 10:1 | Single source |
| JAL Mileage Bank | 10:1 | Single source |
| Malaysia Airlines Enrich | 10:1.2 | Consistent |
| Qantas Frequent Flyer | 10:1.5 | Consistent |
| Qatar Privilege Club | 10:1 | Single source |
| Saudia Alfursan | 10:1 | Single source |
| Singapore KrisFlyer | ⚠️ **8:1, 10:500, or 10:1000** | ❌ Three sources, three different answers |
| Turkish Miles&Smiles | 10:1 | Single source |
| United MileagePlus | 10:1 | Consistent |
| Virgin Atlantic Flying Club | ⚠️ **10:1 or 10:1.5** | ❌ Conflict between sources |
| Virgin Australia Velocity | 10:1.5 | Single source |
| AAdvantage (American) | 10:1 | Single source — but AA isn't always on Hilton's list; verify |
| Alaska Mileage Plan | 10:1 | Single source — possibly removed (Hawaiian merger) |

**Total claimed: ~26 partners. At least 2 ratios in active dispute. Hilton's actual current list and ratios MUST be verified against the issuer's own portal before any of this goes into the DB.**

## When verification is complete

Run an UPDATE on `programs WHERE slug = 'hilton-honors'` setting `transfer_partners_outbound` and `transfer_partners_verified_at = now()`. Until then, the row stays empty and shows as "critical" in the admin Refresh Hub.
