---
name: add-airline
description: Orchestrate the full add-a-program workflow on the crazy4points project (works for airlines, hotels, alliances, and credit cards — generic by data shape) — research, draft, fact-check, author, verify, index, and capture sources. ALWAYS trigger when user says "let's do <program> next", "add airline X", "next airline", "start <program>", "let's tackle <program>", "let's do <hotel> next", "let's do <alliance> next", or any phrase indicating they want to author/refresh a per-program reference page at /programs/[slug]. Walks through the 11-step runbook one step at a time, never dumping the full sequence.
---

# add-airline — Per-Program Authoring Orchestrator

(Skill is named "add-airline" because we built it for airlines first. It's generic by data shape — same 9 fields, same admin editor, same public render — and is the right skill for hotels too. Backlog: rename to `add-program` once 3+ hotels are authored.)

## Purpose

Every program page on crazy4points (airline, hotel, etc.) goes through the same end-to-end pipeline: research, draft, hedge, cross-fact-check, author in admin, verify live, submit to search engines, capture sources, wire press-room RSS into Scout. This skill enforces that pipeline so it happens consistently — and so the user only has to remember the trigger phrase.

**Source of truth for the workflow** — pick the type-matched runbook based on what's being authored:

| Program type | Runbook |
|---|---|
| Airlines | `plans/airline-page-runbook.md` |
| Hotels | `plans/hotel-page-runbook.md` |

The 11 steps are identical across types; per-step content guidance shifts (e.g. hotels set alliance to "None", use stay-based tiers, surface Free Night Certificates). **Read the type-matched runbook before drafting anything.**

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

### Step 1 — Surface the COMPLETE paste-in list up front (BLOCKING)

**Before drafting anything, surface the COMPLETE paste-in list to the user in a single message — every URL, all at once.** LLMs (Claude, Copilot, GPT) all draw from the same pool of secondary blog summaries. When two LLMs disagree on a fact, neither is authoritative — only the official source is. So we read the official source FIRST, draft directly from it, and use third-party blogs only for context/sweet-spot color.

**The user prefers to gather every source in one batch.** Do NOT trickle URLs out one section at a time, do NOT ask "want me to list more?", do NOT wait for one paste before requesting the next. List ALL paste-in items for the program type in a single numbered list, then let the user knock them out at their own pace. Even if some items are optional, surface them — let the user decide what they have time to grab.

**ALWAYS provide a clickable markdown URL for every paste-in item.** Don't just describe the source ("the alliance's lounges page") — give the actual link as a markdown hyperlink the user can cmd-click. If you don't know the exact URL, WebSearch first to find it, THEN list. Never make the user hunt for the URL themselves. Format every paste-in line as:

> 1. **[What to paste]** — [URL](https://...) (one-line description of what section to grab)

Example (good):
> 1. **SkyTeam lounge eligibility text** — [skyteam.com/en/lounges](https://www.skyteam.com/en/lounges) (the eligibility paragraph above the Lounge Finder, not the airport directory)

Example (bad — DO NOT do this):
> 1. SkyTeam lounge eligibility from the alliance's lounges page

If a URL might vary by region/login (e.g. Flying Blue has `flyingblue.com/en/...` vs `flyingblue.com/fr/...`, or a Chase offer page redirects based on cookie), provide the most universal URL and note the variant in parentheses.

**Airlines — request these official paste-ins:**
1. **Alliance lounge eligibility section** — from the alliance's own lounges page (e.g. `skyteam.com/en/lounges`, `staralliance.com/en/lounge-access`, `oneworld.com/lounges`). Just the eligibility rules, not the lounge directory.
2. **Carrier-specific lounge partner rules** — if the carrier operates lounges that have separate partner-access rules (e.g. Delta Sky Club partner access, AA Admirals Club partner access, UA Club partner access). Paste the eligibility text from the carrier's own page.
3. **Tier benefits page** — the airline's official elite-tier benefits page. Full benefit text per tier.
4. **Mile expiry / inactivity policy** — from the program's T&C or FAQ.
5. **Family / household pooling rules** — from the program's official pooling page (if any).
6. **Fuel surcharge / carrier-imposed surcharges policy** — from the program's award booking T&C if available.
7. **Stopover / open-jaw rules** — from the award booking rules page.
8. **Current promo rewards page URL** — bookmark for sweet-spots research.

**Hotels — request these official paste-ins:**
1. **Award category chart** — full chart with off-peak / standard / peak point bands per category.
2. **Tier benefits page** — full benefit text per stay-based tier.
3. **Free Night Certificate rules** — from the program's terms (which co-brand cards unlock which categories, blackout rules, expiry).
4. **Suite Upgrade Award rules** (if applicable, e.g. Hyatt, Marriott).
5. **Club lounge / executive lounge access policy** — which tiers, which brands.
6. **Points expiry / inactivity policy.**
7. **Peak/off-peak pricing methodology** — from the program's official explanation page.
8. **All-inclusive / resort property award rules** (if the program has them).

**Alliances — request these official paste-ins:**
1. **Member airlines list with destinations + countries** — the alliance's official members page (e.g. [oneworld.com/members](https://www.oneworld.com/members), [skyteam.com/en/about/members](https://www.skyteam.com/en/about/members), [staralliance.com/en/member-airlines](https://www.staralliance.com/en/member-airlines)). Paste the full member list including any suspended carriers and any oneworld connect / regional affiliates.
2. **Alliance-wide tier benefits** — the alliance's benefits page covering what each tier (Emerald/Sapphire/Ruby on oneworld; Elite Plus/Elite on SkyTeam; Gold/Silver on Star Alliance) gets globally beyond lounge access. Priority boarding, extra baggage, fast-track security, priority check-in, etc.
3. **Tier crossover from each member program** — the alliance's "Check Your Tier By Airline" page or each member airline's elite-tier mapping page. Tells us which member-program tier maps to which alliance tier (e.g. Atmos Titanium = oneworld Emerald). For oneworld: [oneworld.com/benefits](https://www.oneworld.com/benefits) has the dropdown.
4. **Round-the-world / alliance award product rules** — the alliance's RTW page if they sell one (oneworld Explorer, Global Explorer, Circle Pacific; SkyTeam doesn't sell one; Star Alliance Round the World). Paste pricing structure, segment caps, mile bands, booking process.
5. **Alliance lounge eligibility** — the alliance's lounges page (eligibility paragraph above the lounge finder, not the airport directory). This is the same Step-1 lounge text we ask for on carrier pages — for the alliance page it's the canonical source.
6. **About / overview** — the alliance's "About" page for founded date, HQ, member count, market position. Used for the intro paragraph.
7. **Recent news / membership changes** — the alliance's news page. Surface any 2025-2026 headline that affects: new full member additions, oneworld connect / SkyTeam affiliates / Star Alliance connecting partner changes, member exits, suspensions.
8. **Optional but useful** — Wikipedia infobox + recent history section. Has the cleanest summary of founding date, member count, and recent changes.

**Credit cards — request these official paste-ins:**
1. **Issuer offer page URL + current SUB language** — from the issuer's marketing page (e.g. chase.com/sapphire-reserve). The marketing page is authoritative even if the PDF agreement lags.
2. **Cardmember agreement PDF URL** — for fee/APR disclosures.
3. **Benefits guide / Guide to Benefits PDF** — for travel insurance, purchase protection, lounge access details.
4. **Welcome offer T&C** — full SUB terms (spend window, eligibility, exclusions).
5. **Annual fee + authorized user fee** — from the issuer page.
6. **5/24 / family rules / once-per-lifetime SUB rules** — from issuer or commonly-cited issuer policy page.
7. **Co-brand-specific benefits** (if applicable) — Free Night Cert tier, anniversary points, status conferral, lounge access. Paste from the issuer page (which usually shows what the program publishes).
8. **Foreign transaction fee + insurance eligibility** — from the issuer page.

**Required parallel research (Claude does this while waiting for official paste-ins):**

Run WebSearch with **2026 date filters** against trusted blogs and compare findings against the official paste-ins when they arrive. Your training data is older than the current date — assume any policy/promo/chart you "remember" may have changed. Required sources to scan:
- The Points Guy (TPG)
- One Mile at a Time (OMAAT)
- Frequent Miler
- AwardWallet
- Upgraded Points
- NerdWallet (transfer ratios)
- Milesopedia (esp. non-US programs)

Use blogs for: sweet-spot examples with current mile costs, recent devaluations, promo cadence patterns, brand color, traveler-experience context. **Do NOT use blogs to fill fields where the user pasted official text** — official wins.

When a 2026-dated blog disagrees with the official paste-in: official wins. Capture the disagreement in the source doc.
When 2026-dated blogs disagree with my training-data recollection: blogs win. Update.
When two blogs disagree: pull a third 2026-dated source to break the tie.

If the user can't easily get certain official text (e.g. behind login, regionally gated), they'll say so — then it's okay to fall back to ≥2 third-party sources for that specific item, and flag it in the draft as "third-party only — verify on next review."

Save **every URL** consulted; they go in the per-airline source doc later.

### Step 2 — Draft hedged content (Claude does this)

**Two-pass output: combined preview first, then paste-ready blocks.**

When drafts are ready, surface the entire content set as a single combined preview message FIRST so the user can verify the whole thing at once before any field-by-field paste. Format the preview as a labeled section per field with the actual draft text inline. The user reviews the preview, requests edits, and only when they say "looks good" / "ready to paste" / similar do you re-output as paste-ready code blocks per field.

**Why this exists:** Going straight to per-field paste blocks means the user has to read scattered code blocks and mentally stitch them together to verify coherence. The combined preview is a single readable artifact they can scan in one pass — catching tone inconsistencies, factual issues, or missing pieces before any pasting begins.

Format:
```
# Combined preview — {program name}

## 1. Alliance / type
{value}

## 2. Hubs
{value}

## 3. Intro
{markdown text}

## 4. Transfer partners (or Member programs for alliances)
{JSON, formatted readable}

## 5. How to spend
{markdown text}

## 6. Sweet spots
{markdown text}

## 7. Tier benefits
{JSON, formatted readable}

## 8. Lounge access
{markdown text}

## 9. Tips & quirks
{markdown text}

---

Review the combined preview. Reply "looks good" / "ready to paste" and I'll re-output as paste-ready blocks per field.
Or call out anything to change first.
```

After user approval, output each field as a separate fenced code block tagged with the field name in the heading above it.

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

Checklist (program pages):
- Hero header with alliance pill, hubs, active-alerts pill, last-reviewed date
- TOC strip listing all populated sections
- Active-alerts callout banner if any alerts exist
- Each section renders with anchor scroll
- Transfer partners table — every partner shows real name (not raw slug). Flag any that show as raw slugs (means partner program is missing from DB).
- "Cards that earn into [program]" section auto-renders if any credit cards have `co_brand_program_id` or `currency_program_id` matching this program. Don't author this manually — it's derived from the credit_cards table.
- Footer disclaimer with "Last reviewed [Month YYYY]"
- Mobile width — table scrolls cleanly

If the entity is a **credit card** (URL is `/cards/[slug]`), the verify checklist is different:
- Hero with issuer chip, tier badge, co-brand link, AF, current SUB, FX fee, Apply CTA
- **"Good to know before you apply" callout box** below the hero (above the intro) — 3-7 bullet points covering 5/24 rule, free-night exclusions, mechanic gotchas, sibling-card differences, hard-cap surprises. REQUIRED on every card page. Stored in `credit_cards.good_to_know` (newline-separated bullets, each starting with "- "). Step 2 of the workflow MUST author this field.
- **Section TOC bar (sticky) below the callout** with anchor links to: Welcome bonus, Earn rates, and each populated benefits category. Required on every card page. Auto-generated from sections that have content.
- JSON-LD `CreditCard` schema in page source (view source, search for `application/ld+json`)
- Affiliate disclosure renders only when `affiliate_url` is null
- Apply button uses `affiliate_url` if set, else `official_url`

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

### Step 7.6 — Seed per-property data (HOTELS ONLY — skip for airlines)

Hotels have a per-property table at `/admin/programs/[slug]/properties` that the public page, the writer, the fact-checker, and (eventually) the Decision Engine all read from.

- Page through the program's official property finder, filtered by award category
- Build CSV at `data/[slug]-properties-current.csv` with columns: `name,brand,city,country,region,category,off_peak_points,standard_points,peak_points,hotel_url,all_inclusive,notes`. Leave points columns blank — the SQL backfill below fills them in.
- Have user paste the CSV at `/admin/programs/[slug]/properties` → Bulk import → Import. Confirm inserted/updated counts.
- Write a one-shot SQL backfill at `data/[slug]-points-backfill.sql` joining to a `VALUES` table mapping category → points (use the program's published chart from `programs.[slug].award_chart`).
- Have user paste the SQL into Supabase Studio → SQL Editor → Run.
- Spot-check the admin properties page — Off-peak / Standard / Peak columns should be populated.

Watch out: Supabase REST default caps SELECT at 1,000 rows. Any new query helper that reads `hotel_properties` must paginate (see `getPropertiesForProgram` for the pattern).

### Step 8 — Cross-linking (skip until cards exist)

Note in the source doc which co-brand credit cards earn into this program. When Credit Cards section starts authoring, those cards will link back automatically.

For hotels, also note: once Step 7.6 is done, `hotel_properties` is automatically wired into the fact-checker (verifies property/category claims) and the Decision Engine (surfaces hotels in destination searches). No per-program work beyond seeding the table.

### Step 9 — Maintenance — handled by admin, no per-program reminder needed

Do NOT suggest a personal calendar reminder or schedule a routine. The admin programs list surfaces stale + review-due pills automatically:

- Yellow "Stale (Nd)" pill at 60 days since last edit
- Red "Review (Nd)" pill at 180 days (6 months) — these need refreshing

The user reviews `/admin/programs` periodically, sorts by staleness or toggles "Review-due only," and works through the red pills. No per-program reminder needed.

If the user explicitly asks for a one-time scheduled refresh agent for a particular program (e.g. "remind me in 3 months to refresh Alaska because Hawaiian integration is still in flux"), that's fine — but don't proactively offer it. The default is the admin badge does the work.

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
