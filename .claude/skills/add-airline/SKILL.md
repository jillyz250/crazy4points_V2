---
name: add-airline
description: Orchestrate the full add-an-airline workflow on the crazy4points project — research, draft, fact-check, author, verify, index, and capture sources. ALWAYS trigger when user says "let's do <airline> next", "add airline X", "next airline", "start <airline>", "let's tackle <airline>", or any phrase indicating they want to author/refresh a per-program reference page at /programs/[slug]. Walks through the 11-step runbook one step at a time, never dumping the full sequence.
---

# add-airline — Per-Program Authoring Orchestrator

## Purpose

Every airline page on crazy4points goes through the same end-to-end pipeline: research, draft, hedge, cross-fact-check, author in admin, verify live, submit to search engines, capture sources, wire press-room RSS into Scout. This skill enforces that pipeline so it happens consistently — and so the user only has to remember the trigger phrase.

**Source of truth for the workflow:** `plans/airline-page-runbook.md` in the repo. Read it before drafting anything.

**Source of truth for voice/rules:** the memory index (`MEMORY.md`), specifically:
- `feedback_authoring_workflow.md` — surface one step at a time, never dump
- `feedback_brand_voice_sassy.md` — sassy traveler-friend, never obnoxious
- `feedback_pushback_manual_options.md` — push back when manual beats automation
- `feedback_writer_voice_useful_tangent.md` — two-tangent rule (upside + caveat)
- `project_resources_nav_trigger.md` — flag at airline #5
- `project_lounge_finder_trigger.md` — flag at airline #5 (lounge_access)

---

## Workflow — surface one step at a time

When triggered, FIRST do this:

1. Read `plans/airline-page-runbook.md` end-to-end
2. Read `plans/sources/_TEMPLATE.md` so the source doc structure is fresh
3. Identify the airline from the user's trigger phrase

THEN announce: "Starting <airline> — Step 0 first." Don't dump the full runbook. The user wants one step at a time.

### Step 0 — Confirm program row exists

- Have the user open `/admin/programs?type=airline` and filter by carrier name
- Confirm the program row exists with the right slug
- If missing, instruct them to add via "Add program" form
- Confirm any **co-brand credit cards** exist in the Credit Cards tab — note any that should be added but aren't (track for backlog, don't block)

Wait for confirmation before continuing.

### Step 1 — Web research (Claude does this)

- Use WebSearch to pull current data from at least 3 independent sources for each section
- Required sources to consult:
  - The Points Guy
  - One Mile at a Time OR Frequent Miler
  - AwardWallet OR NerdWallet
  - **Plus the official program site** for: expiration policy, family pooling, promo cadence, status tier rules, fuel-surcharge policy
- For **tier benefits**: prioritize the airline's official tier-benefits page above all third-party sources
- Cross-check current promo / sweet-spot examples against a 2026-dated article — historical articles often cite outdated discount levels (e.g. "up to 50%" when current is 25%)
- Save **every URL** consulted; they go in the per-airline source doc later

Don't move to drafting until you've consulted the official source AND ≥2 third-party sources per section.

### Step 2 — Draft hedged content (Claude does this)

Draft each of these 9 fields:

1. **alliance** — one of: skyteam, star_alliance, oneworld, none, other
2. **hubs** — array of airport codes
3. **intro** — 1-2 voicey paragraphs (sassy traveler-friend tone)
4. **transfer_partners** — JSON array of `{from_slug, ratio, notes, bonus_active}` rows
5. **how_to_spend** — markdown bullet list of redemption types
6. **sweet_spots** — markdown bullets with mile cost examples
7. **tier_benefits** — JSON array of `{name, qualification, benefits[]}` per tier
8. **lounge_access** — markdown w/ own-brand lounges + alliance access + eligibility + paid options + flagship callout
9. **quirks** — markdown bullets (expiry, pooling, stopovers, oddities)

**Banned absolute words** (rewrite if found):
- never → "do not under current rules"
- always / guaranteed → "typically", "as of [Month YYYY]"
- free → "no fee"
- instant → "usually near-instant"
- all → "most", "the major flexible currencies"
- no fuel surcharges → "typically $X-Y in surcharges"

Brand voice in **intro** and **sweet spots**: voicey. Brand voice in **transfer partners**, **tier benefits**, **lounge access**, **quirks**: neutral and factual.

Present all 9 drafts to the user in a single message structured as paste-ready blocks. Each block clearly labeled.

### Step 3 — Cross-fact-check via Copilot

- Tell user to paste your draft into Copilot with: "Fact-check this against current 2026 data. Flag anything outdated or unsourced."
- When user pastes Copilot's response back, diff it against your drafts
- For every disagreement, web-search a 2026-dated source to settle
- Don't blindly accept Copilot — Copilot also pulls from old evergreen articles
- Capture URLs Copilot cited (if available)

Iterate until both agree. Log every disagreement + resolution in the source doc later.

### Step 4 — Author in admin

Walk the user through pasting one field at a time:

1. `/admin/programs?type=airline` → filter by carrier → click **Edit** in Page column
2. **Alliance** dropdown → select
3. **Hubs** input → comma-separated airport codes
4. **Intro** field → paste markdown block
5. **Transfer partners** JSON → paste array
6. **How to spend** field → paste markdown bullets
7. **Sweet spots** field → paste markdown bullets
8. **Tier benefits** JSON → paste array
9. **Lounge access** field → paste markdown
10. **Tips & quirks** field → paste markdown bullets
11. Click **Save** → confirm pill flips to "Today" and completeness shows "9/9 all sections done"

Wait for "saved" before continuing.

### Step 5 — Verify live page

After Vercel deploys (~2 min), have user visit `https://crazy4points.com/programs/[slug]?nocache=1`.

Checklist:
- Hero header with alliance pill, hubs, active-alerts pill, last-reviewed date
- TOC strip listing all populated sections
- Active-alerts callout banner if any alerts exist
- Each section renders with anchor scroll
- Transfer partners table — every partner shows real name (not raw slug). Flag any that show as raw slugs (means partner program is missing from DB).
- Footer disclaimer with "Last reviewed [Month YYYY]"
- Mobile width — table scrolls cleanly

If any partner shows as a raw slug, capture it as a backlog item: "Add <slug> program row to DB."

### Step 6 — SEO + indexing

Walk through one at a time:

- **Google Search Console:** URL Inspection → paste full URL → Request Indexing
- **Bing Webmaster Tools:** URL Submission → Submit URLs → paste
- (Bing often flags new URLs as "cannot index" on first inspect — that's normal, click Request Indexing)

For section milestones (when 12 US done, then international done, etc.), also resubmit sitemap to both, request indexing for each section URL one at a time, and sanity-check one earlier page via `site:crazy4points.com <airline>` search.

### Step 7 — Save source list

Claude creates `plans/sources/[slug].md` from `plans/sources/_TEMPLATE.md`. Populate:

**Citations (audit trail for content):**
- Official program FAQ / Terms URL
- Official Promo Rewards / current promotions URL
- All article URLs cited from research (Step 1) and fact-check (Step 3)

**News & signal channels (Phase 6+ ingestion):**
- Press room / newsroom URL
- Loyalty program news URL
- Investor relations URL (public carriers)
- Email newsletter signup URL
- X / Twitter handle
- Instagram handle
- LinkedIn corporate URL
- YouTube channel URL

**Fact-check disagreements / resolutions table** — log every Copilot disagreement and how you settled it.

**Notes / followups** — anything to verify on next review.

Open as a small docs PR.

### Step 7.5 — Add press-room RSS to Scout

If the carrier has a working RSS press room:

- Test the URL with `curl -sLI <url>` — confirm 200 OK
- If 200: have user add via `/admin/sources/new` — Type: Official Partner, Tier: 1, Frequency: daily, Firecrawl: off
- If 403/blocked: have user add anyway with Firecrawl: on, check back in a week
- Notes field should reference program slugs the source covers

### Step 8 — Cross-linking (skip until cards exist)

Note in the source doc which co-brand credit cards earn into this program. When Credit Cards section starts authoring, those cards will link back automatically.

### Step 9 — Maintenance reminder (optional)

Suggest the user set a personal calendar reminder for 6 months out to re-review the page.

---

## Section milestone triggers

Watch the cumulative count of authored airlines:

- **Airline #5 (US)** → flag the Resources nav trigger (`project_resources_nav_trigger.md`). Stop, ship the Resources dropdown PR, then continue.
- **Airline #5 with `lounge_access` populated** → flag the Lounge Finder trigger (`project_lounge_finder_trigger.md`). Backlog it; don't block.
- **End of section (all 12 US done, all International done, etc.)** → run the Section Milestones checklist from `plans/airline-page-runbook.md`. Resubmit sitemap to GSC + Bing, request indexing for each new URL, log progress.

---

## Anti-patterns

- ❌ Dumping the whole 11-step list at once. Surface ONE step.
- ❌ Drafting from memory. Always web-search current 2026 sources.
- ❌ Accepting Copilot's fact-check uncritically. Settle disputes with date-checked sources.
- ❌ Skipping the source doc. Audit trail matters.
- ❌ Adding press-room RSS without testing the URL with curl first.
- ❌ Pasting all 9 fields into a single textarea. They go into 9 separate inputs.
- ❌ Using absolute words ("never", "always", "free") without conditional language.

---

## Self-check before starting

Before invoking any tools, confirm:
- [ ] Did the user mention a specific airline?
- [ ] Is the airline already in the programs DB? (Check via grep or have user confirm)
- [ ] Do I have all five memory references loaded (workflow, voice, pushback, tangent, triggers)?

If yes to all → start with "Step 0" prompt to user.
If user named an airline that isn't in DB → ask them to add it first via admin, OR offer to draft a migration row.
