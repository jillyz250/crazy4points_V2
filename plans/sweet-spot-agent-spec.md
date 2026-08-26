# Sweet-Spot Agent — Build Spec

> **Status: SPEC (ready to build). Do NOT run the full sweep until API budget is
> available** — Jill flagged low API resources ~2026-08-26 for ~9 days. Revisit
> ~2026-09-05 (a reminder is set). The foundation (the `sweet_spots` table + 51
> seeded single-source leads + the accuracy engine) is already merged and safe.

## Goal
An automated, self-improving **sweet-spots dataset across all 142 active
programs** — the redemptions readers actually want (free stopovers, cheap first
class, standout business, hotel gems, lounge value) — **vetted across multiple
blogs** and **verified against official sources AND our program pages**, that
**keeps improving** and factors in live alerts/bonuses.

## Requirements (Jill, 2026-08-26)
1. **Coverage:** all 142 active programs — hotels and airlines and all.
2. **Vetted:** each sweet spot corroborated across **≥2 independent blogs/aggregators** (not one source).
3. **Accurate:** verified against the **official source** AND reconciled with **our program-page data**.
4. **Constantly improving:** scheduled re-run; factors in **new alerts, transfer bonuses, buy-points bonuses, award-chart changes, partner-airline redemptions**.

## SOURCE OF TRUTH (updated 2026-08-26 — cross-referenced!)
**The authored `programs.sweet_spots` field is the source** — ~610 vetted bullets across 112 of 142 programs, already on each program page. The `/sweet-spots` explorer already aggregates them (built 2026-08-26, zero-API). The agent's job is NOT to re-research from scratch — it is to **(a) STRUCTURE** the authored bullets into `sweet_spots` rows, **(b) VERIFY** each against official (points/route/cabin), **(c) AUGMENT** the ~30 programs with no authored sweet spots via multi-blog research, and **(d) keep fresh** (retire deval'd, add new). Blog research is for the gap-fill + corroboration only.

## The pipeline (per program)
0. **Source from `programs.sweet_spots`** (authored) FIRST — parse bullets into structured candidates. Only fall through to blog discovery for programs with none.
1. **Discover sources (gap-fill / corroboration)** — Firecrawl search `"best <program> sweet spots 2026"` → top reliable aggregator URLs. Filter to a **trusted-domain allowlist** (awardwallet, upgradedpoints, awardtravelfinder, frequentmiler, thepointsguy, point.me, awardlocker, onemileatatime, etc.). Blogs are LEADS only — never cited in published content.
2. **Scrape each source** — `fetchFirecrawl` (or `fetchFirecrawlInteractive` for JS-heavy pages).
3. **Extract per source** — LLM (Haiku, **temperature 0**), extraction ONLY, no judgment (the `reverifyTransfers` lesson): `{title, value_type, cabin, points, route, operating_partner, value_angle}`.
4. **Vet by consensus** — merge semantically-equivalent spots across sources (LLM merge or fuzzy key of program+route+cabin), count **distinct sources** per merged spot; keep spots with **≥2 sources**. Record `source_count` + `source_urls`. *(Reuses the `verifyClaim.consensusVerify` mechanism.)*
5. **Verify accuracy** — run each vetted spot through the **accuracy engine** (`verifyClaim`): check points/route/cabin against the **official award chart** (`official_sources` / `programs.partner_chart_url` / `award_chart_structured`) AND reconcile with **our program-page data**. Set `verified = verified | conflict | unverified`.
6. **Populate + retire** — upsert vetted+verified spots into `sweet_spots` with sources + official URL; **retire** spots that stop appearing across sources (the devaluation/chart-change guard). Skip DEFUNCT programs (e.g. Spirit).

## Data model
- `sweet_spots` (exists, mig 634). **Add columns:** `source_count int default 0`, `source_urls text[]`. (Already have `lead_source_url`, `official_source_url`, `verified`, `value_type`, `program_slug`, `operating_partner`, `cabin`, `points`, `route`, `value_angle`, `status`.)
- Re-vet the 51 already-seeded single-source leads through the pipeline (they're drafts).

## Dynamic layer ("constantly improving")
- **Re-verify on each run** → catch devaluations / chart changes → retire or flag (rides the accuracy engine).
- **"Hot right now" booster** → cross-reference **active alerts** (`transfer_bonus`, `point_purchase`, `award_sale` types) against each spot's booking program: a live transfer bonus to Flying Blue boosts the Paris stopover; a buy-points sale on LifeMiles boosts Lufthansa First. Surface a "hot this week" flag.
- **New-spot detection** → spots newly appearing across ≥2 blogs get added.
- **Partner routing** is already core (book Cathay via Alaska, ANA via Virgin).

## Scheduling + cost control (IMPORTANT — this is the expensive part)
- Cron with **rotation**: process **N programs per run**, oldest-refreshed first (mirror `reverifyDue`'s `reverified_at` rotation), so cost/time stay bounded as coverage grows.
- Rough per-program cost: 1 search + 2–3 scrapes + 3–4 LLM calls. Over 142 programs that is hundreds–low-thousands of API calls per full sweep (Anthropic + Firecrawl). **Start with the top ~25 programs, then expand.**
- Trusted-domain allowlist prevents junk sources.

## Surfacing
- **`/sweet-spots` explorer** (public): filter by value type (stopover / first / business / lounge / hotel) + program; verified badge + "hot now" flag. *(Note the existing `hyatt-points-sweet-spots` guide — that content style is the target.)*
- **`/admin/agents`** (or a review queue): newly-found + conflicting spots for human confirm.
- Powers **sweet-spot alerts/guides** — the writer drafts from a verified spot (verified before publish).

## Build order
- **Phase A** — the researcher (discover → scrape → extract → vet) for ONE program; prove multi-source vetting.
- **Phase B** — the verifier: wire `verifyClaim` to check each vetted spot vs official + our page.
- **Phase C** — the cron + rotation + retire logic.
- **Phase D** — the `/sweet-spots` page + the "hot right now" booster (cross-ref alerts).
- **Phase E** — run the full 142-program sweep in controlled batches (top 25 first).

## Reuses (don't rebuild)
- Firecrawl helpers: `fetchFirecrawl`, `fetchFirecrawlInteractive`, `mapFirecrawl` (`utils/ai/firecrawl.ts`); search discovery pattern in `utils/programs/discoverSourceUrls.ts`.
- Multi-source consensus: `verifyClaim.consensusVerify` (`utils/ai/verifyClaim.ts`).
- Accuracy engine: `verifyClaim` + `official_sources` registry + `programs.award_chart_structured`.
- Deterministic extract-only pattern: `reverifyTransfers.extractSourceRoster`.
- `sweet_spots` table (mig 634) + the 51 seeded leads (re-vet them).

## Editorial rules (bake in)
- Blogs are leads for discovery/vetting only; **published content cites official/issuer**.
- Keep value **qualitative** — no cents-per-point, no foreign-currency valuations.
- Show the full draft before publishing; nothing goes live unseen.

## Related
- `plans/ai-agents-roadmap.md` (the Sweet-Spot Agent is C1 there).
- Memory: `reference_accuracy_agent_system.md`, `feedback_reddit_mine_for_data_not_posting` (mine sources for data, don't cite).
