# Handoff — Dashboard triage (2026-07-31)

Continuity note for picking up in a fresh session. Everything below was verified against official/issuer sources.

## Done this session
- **Overdue reminders cleared** (11 → 0): 8 stale/expired archived; IHG APAC social snoozed to Aug 2 (offer ends Aug 3); Delta SUBs + broken-links actioned (below).
- **Broken-links reminder**: 6 of 7 were false positives (bot-walled, live). Only Turkish Miles&Smiles was truly dead → fixed `programs.partner_chart_url` + `award_chart` prose to `.../miles-and-smiles/redeem-miles`. Also fixed the auditor (`utils/integrity/auditLinks.ts`, PR #1107 merged) to escalate unreachable/4xx to Firecrawl before flagging.
- **Delta Amex SUBs re-verified** vs Amex apply page (`delta-bau-jul26`): Gold 70k/$3k → **80k/$2k**; Platinum 80k/$4k → **90k/$3k**; Reserve 100k/$6k → **100k/$5k**. All in `credit_card_welcome_bonuses`, `last_verified=2026-07-31`.
- **Drafts (1–3)**: Atmos points-sale rewritten (verified, derived-cpp stripped) — **still in needs_review, awaiting Jill** at `/admin/drafts/7e8d2f90-dde4-4d16-984b-ed3cd1de0d12`. Virgin Red archived (dup). Calm Air folded into Aeroplan page (quirks note) + archived.
- **Citi → Flying Blue alert** (variant e355146c): added `start_date=2026-07-19`, fixed an em-dash. Intel marked processed.
- **CSP prose (#7)**: Chase now shows 75k standard (100k ended Jul 30). Bonus record already correct; good_to_know prose de-staled to 75k, review advanced to 2026-10-29.
- **Amex + Leading Hotels (#5)**: page ALREADY had it correctly (1:0.25 = 4:1, launched Jul 28) — 2 change_signals were stale leftovers → resolved. No Amex+LHW alert exists (the one Jill recalled was the archived Citi→Leaders Club).
- **Amex page correctness pass**: stripped expired-bonus notes on Avianca (Jul 15) and Marriott (Jun 30) back to base ratios.

## Still open (the fresh-session work)
- **Intel to triage: ~16 open** (`/admin/triage`) — only 1 was fresh (Wyndham 15K/4-night); rest older.
- **Alert-updates: ~9** (`intel_items` with `update_to_alert_id`, processed=false) — fold new facts into existing live alerts, don't publish dupes. Includes: IHG cobrand EQP correction, IHG email-support killed, Marriott Homes&Villas bonus tiers, Iberia 40% (was 30%), Amex Germany Centurion guest cut, Choice app-booking promo, United intl bag-recheck, CLEAR+ price rise.
- **Program-fact drift: 17** (`/admin/program-drift`) — verify vs issuer, fix page, resolve. Top: Emirates first-class award pricing tightened, Choice 2nd devaluation, Singapore award-search block, resort-fee-on-points, tiered signup 70k+30k, Group 5 boarding.
- **Source gaps**: Spirit (defunct, skip), Miles & More (verify before adding).

## Jill's outstanding decisions
1. Review + publish the **Atmos draft** (URL above).
2. **Amex+LHW alert** — optional; page already covers it, news ~3 days old.
3. Optionally write the **IHG APAC 30% FB post** before Aug 3 (reminder set Aug 2).

## Standing rules reminder
Card/hotel data from issuer sources ONLY; no em/en-dashes; no derived point-to-dollar math; no foreign-currency valuations; alert writes via `content_variants` (not the alerts mirror); ASCII-only in SQL data; verify before publish; put Jill's actions last.
