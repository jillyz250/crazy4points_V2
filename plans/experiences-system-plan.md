# Plan: Loyalty "Experiences" System (crazy4points)

## Context for a reviewer
crazy4points.com is a points-and-miles site (Next.js 16, Supabase, Vercel). Several hotel loyalty programs run "experiences" platforms where members **bid or redeem points for bundled VIP packages** — not just event tickets. Example (Wyndham, Caesars Palace): ~100,000 points for a 3-night Caesars Palace stay + $300 dining credit + club admission for two + two show tickets. Two formats exist: **BID** (auction, can lose) and **REDEEM** (fixed price).

**The hook that makes this timely:** Chase Ultimate Rewards now transfers to Wyndham Rewards 1:1, so Chase's very large audience can suddenly reach these experiences. Almost no points site organizes this well.

## Goal
Build a repeatable **system** (not a one-off) that:
1. Monitors each program's experiences page automatically (daily).
2. Surfaces new/changed listings on our internal admin dashboard.
3. Turns findings into content: an interactive reader tool, per-program guides, social posts, newsletter items, and bid-deadline reminders.

## Programs in scope
- **Points-auction (the core, monitored):** Wyndham Rewards Experiences, Marriott Bonvoy Moments, Hilton Honors Experiences.
- **Card-issuer experiences (different model, informational only):** Chase Experiences, Amex, Capital One. These are cardmember-access, usually not points-bidding, so guides only, not monitored auctions.

## Architecture (one engine, several front-ends)
```
daily cron  ->  scrape each program's experiences page (Firecrawl)
            ->  parse listings to structured JSON (Claude Haiku)
            ->  upsert into `experiences` table (dedup per program)
            ->  detect NEW listings + ones that vanished (closed)
            ->  enrich each NEW listing's detail page for the bid-close date
                        |
      +-----------------+------------------+-------------------+
      v                 v                  v                   v
 admin dashboard   Experience Finder   bid-close reminders   social/newsletter
 "new experiences"  tool (/tools,       (auto-created as a    suggestions on
 surfacing          reader-facing,      deadline nears)       marquee finds
                    filterable mirror)
```

## Data model — `experiences` table
program_slug, dedup_key (unique per program), title, detail_url, points (current bid/redeem), format (bid|redeem), category, location, event_date, close_date, description, image_url, status (active|closed|removed), first_seen_at, last_seen_at. Follows our existing `content_questions` cron-table pattern.

## Reader-facing
- **Experience Finder tool** at `/tools/experience-finder` — interactive, reads the table, filter by program / category / points / bid-vs-redeem. Starts Wyndham-only; every program added to the cron just appears. This IS the "mirror."
- **Per-program "how it works" guides** — e.g. "How to use Chase points for Wyndham experiences." Evergreen, link out to the official page, linked from the tool.

## Phasing
- **Phase 1 (first):** `experiences` table + daily cron + dashboard surfacing + the Wyndham "how it works" guide. One program, full loop, proves the engine.
- **Phase 2:** the Experience Finder tool in `/tools`; add Marriott Moments + Hilton to the cron.
- **Phase 3:** card-issuer guides (Chase/Amex/CapOne); polish social/newsletter automation.

## Decisions already made (by the site owner)
- Cron cadence: **daily**.
- Reader side: per-program **guides + a live mirror**, mirror delivered as a **Tools "Experience Finder"**, phased in.
- Phase 1 = the **full Wyndham loop** (table + cron + dashboard + guide).

## Editorial guardrails (non-negotiable in any published content)
- These are **bundled VIP packages** — judge the whole bundle; several are genuinely good value, so don't dismiss, but don't hype either.
- **BID = auction, you can lose.** REDEEM = fixed. State which.
- Packages are **non-refundable, non-transferable, travel not included, 21+** (many casino-tied).
- **Point transfers are final** — never advise transferring Chase->Wyndham on spec to chase an auction they might not win.
- **No derived point-to-dollar / cents-per-point math** in copy; describe bundles plainly (nights, dining credit, tickets).

## Already validated (de-risked before building)
- **Scraping works:** Firecrawl pulls the Wyndham auction page (60KB markdown).
- **Parsing works:** Claude Haiku cleanly extracts structured listings (title, points, category, location, date, format) — tested, all 7 current listings parsed correctly.
- **Infra ready:** Supabase CLI present for the migration; an existing cron-fed table (`content_questions`) is the template.
- **Migration written** (additive: one new `experiences` table, reversible).

## Open questions / risks I want pressure-tested
1. **Terms-of-service / legal:** is scraping and *mirroring* another company's live commercial auction listings on our own site a problem? Guides + link-out are clearly fine; a live mirror is the question. Would attribution / "data from X" framing help, or should the mirror only show minimal fields and always link to the source to bid?
2. **Staleness / accuracy:** points and close-dates change; a daily mirror can be wrong between runs. Show a "last checked" timestamp? Only show format/category and link out for the live price?
3. **Scraper fragility:** JS auction sites change structure; the Haiku parse is resilient but the page URLs/layout may shift. How much monitoring/alerting on the cron is worth it?
4. **Cost:** daily Firecrawl + Haiku across 3 programs, plus per-new-listing detail scrapes. Is daily overkill vs 2-3x/week, given auctions run 1-2 weeks?
5. **Value/credibility:** how to consistently signal "good bundle vs meh" without doing banned cents-per-point math?
6. **Scope creep:** is a full interactive Finder tool warranted before proving readers care, or should Phase 1 stay backend + one guide and let demand justify the tool?

## Specific questions for the reviewer (Copilot)
- Is the phasing right, or should the reader-facing tool come earlier/later?
- Biggest risk we're underweighting (legal, staleness, cost, or effort-vs-payoff)?
- Anything about the data model or cron design that will bite us when we add Marriott/Hilton?
