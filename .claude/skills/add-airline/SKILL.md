---
name: add-airline
description: Orchestrate the full add-a-program workflow on the crazy4points project (works for airlines, hotels, alliances, and credit cards — generic by data shape) — research, draft, fact-check, author, verify, index, and capture sources. ALWAYS trigger when user says "let's do <program> next", "add airline X", "next airline", "start <program>", "let's tackle <program>", "let's do <hotel> next", "let's do <alliance> next", or any phrase indicating they want to author/refresh a per-program reference page at /programs/[slug]. Walks through the 11-step runbook one step at a time, never dumping the full sequence.
---

# add-airline — Per-Program Authoring Orchestrator

(Skill is named "add-airline" because we built it for airlines first. It's generic by data shape — same 9 fields, same admin editor, same public render — and is the right skill for hotels too. Backlog: rename to `add-program` once 3+ hotels are authored.)

## Purpose

Every program page on crazy4points (airline, hotel, etc.) goes through the same end-to-end pipeline: research, draft, hedge, cross-fact-check, author in admin, verify live, submit to search engines, capture sources, wire press-room RSS into Scout, and (for hotels) seed the per-property Decision Engine dataset. This skill enforces that pipeline so it happens consistently.

**Target automation level — Claude drives end to end. The user does TWO things:**

1. **Spot-check the live page** after Claude reports completion (Step 8.5 full-page audit must pass first).
2. **Submit the URL to Google Search Console + Bing Webmaster Tools** (Step 6).

Everything else — research, drafting, SQL writes, migrations, source-doc generation, press-room source seeding, per-property scraping, Sonnet audit, full-page audit — Claude does. If a step still requires the user to click through admin or paste a CSV, that's a gap and Claude should flag it as an automation candidate against `plans/handoff-*.md` rather than letting it linger.

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

THEN announce: "Starting <airline> — Step 1 first." Don't dump the full runbook. The user wants one step at a time.

**Note on program-row existence:** Don't gate the workflow on a "Step 0" admin check. Trust that the row exists (most US airlines + alliance members have been seeded). If the row turns out to be missing, you'll catch it in Step 4 (admin paste — the edit page 404s) or Step 5 (live page renders raw slugs); resolve at that point with a small seed migration. This saves 1-2 round-trips per program.

### Step 1 — Research the program (automated via `research-program.mjs`)

**Primary workflow:** scrape the program's own pages directly via the research orchestrator, then WebSearch for gaps the orchestrator flags. User paste-in is only a last resort.

**Do this:**

1. Announce: "Step 1 — running research-program.mjs for `<slug>`."
2. Confirm the program has `scrape_urls` seeded:
   ```sh
   supabase db query --linked --execute "select slug, type, scrape_urls, refresh_tier from programs where slug = '<slug>';"
   ```
   If `scrape_urls` is `{}`, write a small migration seeding the canonical URLs (see existing migrations 099, 107 for shape). Standard keys per type:
   - **Airlines**: `partners`, `chart`, `tiers`, `tc`, `lounge`
   - **Hotels**: `tiers`, `outbound_transfers`, `chart` (or `free_night_caps` for dynamic-pricing programs like Marriott/Hilton), `tc`, `news`
   - **Alliances**: `members`, `award_rules`, `lounge_access`, `tier_mapping`, `news`
   - **Credit cards**: `offer_page`, `tc`, `benefits_guide`
3. Run the orchestrator:
   ```sh
   node scripts/research-program.mjs --slug=<slug>
   # add --skip-chart for dynamic-pricing programs with no published chart
   # add --wait=12000 if scrapes return chrome-only (some sites need longer)
   ```
4. **Immediately after the scrape finishes, fire ALL WebSearch topics from the printed queue in parallel — do NOT pause to ask the user first.** The queue is type-tailored (inbound transfers, sweet spots, SNA rules, recent news, etc.) and covers the things that aren't on the program's own site. Send all topics in a single message with multiple WebSearch tool calls so they run concurrently. Aim for 2026-dated results.
5. Read the scraped markdown in `/tmp/research/<slug>/` together with the WebSearch results to extract draft content for Step 2. Tag every claim's confidence: HIGH (2+ 2026 sources or scraped from official site), MEDIUM (1 source), LOW (training data only).

**When the orchestrator's scrape comes back chrome-only:**
- Try `--wait=12000` first (some SPAs need longer JS-render time)
- If still empty: the URL has likely moved. WebSearch `site:<domain> <topic>` to find the canonical path, update the migration, retry.
- If the program's site is fully Firecrawl-blocked (AA, Southwest, sometimes Hyatt's own site): the scrape will record `firecrawl_blocked` and the daily refresh will surface the gap. Fall back to WebSearch + ⚠️ third-party sources for those fields, flagged per `feedback_flag_non_official_sources.md`.

**When to fall back to user paste-in:**
- A high-importance fact has LOW confidence after both scrape + WebSearch
- The program's site is Firecrawl-blocked AND third-party sources disagree
- One specific data point (e.g. "current Diamond MQD threshold") needs a tiebreaker

When asking for paste-in, ask for ONE thing at a time, with the exact question. Examples:
> "What's the current Diamond MQD threshold? My sources disagree."
> "Has the Excursionist Perk officially returned in 2026?"

Never ask for a 6-URL paste list — that pattern is retired in favor of the orchestrator.

See `feedback_websearch_default_research.md` and `feedback_scrape_official_skip_copilot.md` for the underlying rules.

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
9. **Perpetual non-loyalty promo offers** — from the program's `/offers/` or `/promotions/` page. These are recurring discounts that aren't points plays (e.g. Accor Family & Co. = 50% off 2nd room with kids, Hilton suite-night offers, recurring resort-credit promos, member-only cash rates, friends-and-family rates). They belong in Sweet Spots (the offer itself) and Tips & Quirks (the fine print — stackability, exclusions). **Award blogs routinely miss these** because they're cash discounts, not points redemptions; pulling directly from the program's offers page is the only reliable way to surface them. Without this step we'll consistently under-author programs whose best benefits aren't points-based.

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

### Step 2 — Draft hedged content + emit Copilot fact-check block (Claude does this)

**LEAN WORKFLOW** — do NOT dump a full 10-field combined preview to the user. The user does NOT want to read scattered drafts inline. Instead, after drafting internally:

**Output ONE thing only: the Copilot fact-check block** (see Step 3 below for the exact format). The user pastes that into Copilot or ChatGPT, gets back per-claim validations, and shares the response.

Internal: keep the full 10-field draft in your head / scratch context, but DO NOT show the user. The Copilot block is the only artifact the user sees in Step 2.

After the user shares Copilot's response:
- Resolve disagreements (web-search 2026-dated source for any flagged claim)
- Apply confirmed corrections to the internal draft
- Then proceed directly to Step 4 (SQL migration write) — no separate "ready-to-paste blocks" stage

**Why this format:** the user has explicitly asked for less Claude output. They prefer to drive the editorial pass via Copilot rather than read combined-preview text. Save the user's reading time; rely on Copilot for the cross-check.

**After user approval, write a single SQL UPDATE migration directly.** Do NOT re-output the content as paste-ready blocks per field. Per `feedback_prefer_sql_over_admin_forms.md`, SQL migrations are the default path: faster to apply, ASCII-scrubbed automatically, no admin form click-through required. Output structure:

- One migration file per program at `supabase/migrations/<NNN>_seed_<slug>_page.sql`.
- Header comment summarizing what's seeded and any non-obvious decisions (e.g. "Marriott eliminated chart in 2022; award_chart field uses dynamic-pricing framing with FNA caps as de-facto bands").
- One `UPDATE programs SET ... WHERE slug = '<slug>';` covering all 9–10 populated fields.
- ASCII-only inside JSON / text strings — replace em-dashes with " - ", smart quotes with straight quotes, ellipsis with "..." (per `feedback_ascii_only_in_sql_data.md`).
- If the page references transfer-source slugs that aren't yet seeded, include `INSERT ... ON CONFLICT DO NOTHING` for skeleton rows in the same migration so the public render shows real names instead of raw slugs.

Apply via `supabase db query --linked --file supabase/migrations/<NNN>_*.sql`. Confirm by SELECT of the same row + immediate run of `verify-program.mjs --slug=<slug>` once Vercel redeploy lands.

Draft each of these **10 fields** (non-alliance programs require all 10 for completeness; alliance pages skip `award_chart`):

1. **alliance** — one of: skyteam, star_alliance, oneworld, none, other
2. **hubs** — array of airport codes
3. **intro** — 1-2 voicey paragraphs (sassy traveler-friend tone)
4. **transfer_partners** — JSON array of `{from_slug, ratio, notes, bonus_active}` rows. The `notes` field MUST mention transfer tax/fee status — even when there is no tax, say so. Watch for Amex MR -> US-domiciled airlines (Delta, JetBlue, Virgin Atlantic with US-issued cards) which trigger a federal excise tax pass-through (~$0.0006/point, capped $99 personal / $200 business per year). Foreign carrier transfers from Amex typically have no tax. Marriott + most other hotel-to-airline transfers also have no tax. See `feedback_capture_transfer_fees.md` in memory for the full rule.

   **Issuer-page-only rule for transfer ratios (HARD RULE — burned by this on 2026-05-07 with Aer Lingus + Capital One):** When verifying whether an issuer transfers to a target program, check the **issuer's own published partner page**, not blogs. Blog posts conflate Avios programs and miss recent additions/removals. Authoritative sources:
   - Capital One: `capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships`
   - Amex MR: `americanexpress.com/transfer-partners`
   - Chase UR: the Ultimate Rewards portal
   - Citi: `thankyou.com`
   - Bilt: `bilt.com`
   - Wells Fargo: `wellsfargo.com/credit-cards/rewards`

   **Avios-family disambiguation rule:** When WebSearch returns "X transfers to Avios," resist the urge to apply the claim to *all* Avios programs. Avios is shared across BA / Iberia / Aer Lingus AerClub / Vueling / Finnair / Qatar / Loganair, but **each has its own direct-transfer-partner roster.** Default assumption "Cap One -> Avios = Cap One -> AerClub" is the trap that bit us. The right move: for each Avios program, look up its specific direct partners on the issuer's own page. Combine My Avios (free, instant, second hop after BA) covers the rest — but document it as second-hop in `notes`, not as a direct ratio. The `error-pattern-check.mjs` script has guards for this conflation since 2026-05-07.

   **Conflict-escalation rule:** When WebSearch and Copilot disagree on a transfer ratio (or alliance status, or chart, or any verifiable fact), **surface the conflict to the user before resolving** — same protocol as the Sonnet contradiction rule. Do not auto-pick a winner. Quote both sources verbatim and let the user adjudicate. The 2026-05-07 Aer Lingus + Capital One incident happened because Claude resolved a Copilot-vs-WebSearch disagreement in the wrong direction.
5. **how_to_spend** — markdown bullet list of redemption types
6. **sweet_spots** — markdown bullets with mile cost examples
7. **tier_benefits** — JSON array of `{name, qualification, benefits[]}` per tier
8. **lounge_access** — markdown w/ own-brand lounges + alliance access + eligibility + paid options + flagship callout. **Day passes / single-visit passes require four facts, not just price**: (1) same-day ticketed boarding pass required, (2) time window before departure (typically 3 hours), (3) discounted-cabin exclusion if any — RESEARCH per carrier, fare class names vary (Delta = "Main Basic", United = "Basic Economy", Alaska = "Saver", BA = "Basic"); some carriers have no exclusion at all, (4) carrier scope. See `feedback_lounge_day_pass_rules.md` in memory.
9. **quirks** — markdown bullets (expiry, pooling, stopovers, oddities)
10. **award_chart** — markdown text. The official redemption chart (or a faithful summary of it) for partner awards and AA/program-operated baseline. **Required for all non-alliance programs.** This field also feeds `programSourceText.ts` as "OFFICIAL AWARD CHART (source of truth for redemption costs)" — the AI writer + fact-checker use it to verify redemption-cost claims in alerts. Format: markdown headings + tables. Hotels = full category chart with off-peak / standard / peak point bands per category. Airlines = MileSAAver baseline + partner zone chart. Loyalty programs (Atmos, Flying Blue, Avios) = same as airlines. Alliance pages = skip; award charts live on member program pages.

**Banned absolute words** (rewrite if found):
- never → "do not under current rules"
- always / guaranteed → "typically", "as of [Month YYYY]"
- free → "no fee"
- instant → "usually near-instant"
- all → "most", "the major flexible currencies"
- no fuel surcharges → "typically $X-Y in surcharges"

Brand voice in **intro** and **sweet spots**: voicey. Brand voice in **transfer partners**, **tier benefits**, **lounge access**, **quirks**: neutral and factual.

Present all 9 drafts to the user in a single message structured as paste-ready blocks. Each block clearly labeled.

### Step 3 — Cross-fact-check via Copilot (THE Step 2 output)

After Step 2 drafts are signed off (combined preview approved), give the user **one consolidated block** they can paste into Copilot — never make them copy six separate fields one by one. The block has two parts: the prompt, then the content. ALL-CAPS section labels help Copilot anchor each fact-check to the right field.

**Format to deliver to the user:**

````
**Copilot / ChatGPT fact-check prompt:**

> Fact-check the following content for the [Carrier Name] carrier page. Today's real-world date is [Month DD, YYYY].
>
> **REQUIRED METHOD:** Use web search / browsing tools to verify each claim against current sources. Do NOT rely on training data alone — for events from 2024 onward, training data may be stale or incomplete. If you cannot search, say so up front and stop.
>
> **For each claim:**
> 1. Search the open web with a 2026-dated source filter when relevant.
> 2. Cite the source URL + publication date for any disagreement, AND for confirmation of any recent (post-2024) event.
> 3. If you can't find a 2026-dated source that confirms OR denies a claim, return "❓ UNVERIFIED — needs current source." Do NOT mark a claim incorrect based on training-data memory alone — that's how you fabricate denials of real events.
>
> **Output format per claim:**
> > [claim] — [✅ CORRECT / ⚠️ NEEDS CLARIFICATION / ❌ INCORRECT / ❓ UNVERIFIED] — [URL + publication date if you found one]
>
> Flag only what is factually wrong by current evidence. Do NOT comment on style or voice.

---

**Content block to paste:**

```
INTRO
[intro draft]

LOUNGE ACCESS
[lounge_access draft]

QUIRKS
[quirks draft]
```
````

Adjust the field list based on what's populated. For a carrier row, it's typically INTRO + LOUNGE ACCESS + QUIRKS. For a program row, add TRANSFER PARTNERS + TIER BENEFITS + SWEET SPOTS. For a credit card, swap to the card-specific fields (good_to_know, welcome bonus, earn rates, benefits).

**Why the prompt is shaped this way:**
- "REQUIRED METHOD: web search" forces the LLM to actually browse — without this, ChatGPT in particular falls back to training data and confidently denies post-2024 events (e.g. denying that Atmos Rewards exists, that Hawaiian joined oneworld, etc.).
- The "❓ UNVERIFIED" verdict prevents the model from marking real events as wrong just because they're not in its memory. Forces honest "I don't know" instead of fabricated denials.
- Explicit citation per claim (URL + publication date) makes diffing fast and gives us audit material for the source doc.
- "Today's real-world date" anchors the fact-check temporally — without it, models sometimes assume the current date is their training cutoff.

When the user pastes Copilot's response back:
- Diff it against your drafts claim by claim
- For every disagreement, **web-search a 2026-dated source to settle** — don't blindly accept Copilot
- Copilot also pulls from old evergreen articles; settle disputes with the official source
- Capture URLs Copilot cites (ask for them if missing: "list every URL you used")
- Log every disagreement + resolution in the source doc (Step 7) under the Fact-check disagreements table

Iterate until both agree, then move to Step 4 (admin paste).

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
11. **Award chart** field → paste markdown (skip for alliance pages)
12. Click **Save** → confirm pill flips to "Today" and completeness shows "10/10 all sections done" (or "9/9" for alliance pages)

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

### Step 5.5 — MANDATORY: Structured `partner_redemptions` seeding (Partner Booking Tool data)

**Required for every airline / loyalty_program page.** The Partner Booking Tool's MVP returns a list of programs that can book a user-entered route. Every authored program must contribute its piece of that list — otherwise the tool has missing data and reader trust collapses.

For each authored currency program (the airline's own loyalty program OR the joint loyalty program if it's a carrier feeding into one), seed:

**1. `programs.partner_chart_url`** — the official URL where this program publishes its partner award pricing (or the search engine URL for dynamic-pricing programs). One UPDATE per program.

**2. `partner_redemptions` rows** — one row per (currency_program_id, operating_carrier_id) pair this program can book. Pricing fields can be NULL initially; what's mandatory:
- `currency_program_id` (the program being authored)
- `operating_carrier_id` (every airline this currency can book)
- `cabin` (Economy default; add Business / First / Premium Economy rows separately if pricing differs)
- `pricing_model` — one of `'fixed'` (chart-priced), `'dynamic'` (revenue-based), `'hybrid'` (chart for partners, dynamic for own metal)
- `notes` — single line summarizing the pricing structure (e.g. "0-700 mi = 4,500 points / 701-1400 = 7,500 / 1401-2125 = 12,500" for distance-banded programs)
- `confidence` — HIGH / MED / LOW based on source quality

**Pricing-model checklist (use the right pattern for each program):**

| Pattern | Examples | What to populate |
|---|---|---|
| **Distance-banded** | Atmos partner chart, BA Avios, Aer Lingus, Cathay Asia Miles, JAL Mileage Bank | `distance_band_low/high` per band; `notes` summarizes the chart |
| **Region-paired** | AA partner chart, Flying Blue zones | `origin_region/dest_region` per zone pair; `notes` summarizes the chart |
| **Hybrid** | Atmos (distance for partners + dynamic for own metal), AA short-haul | Populate whichever applies per row; mark `pricing_model='hybrid'` |
| **Fully dynamic** | Delta own metal, Southwest, JetBlue | Both region and distance columns NULL; `pricing_model='dynamic'`; `notes` says "revenue-based, ~X cpp average; check official site for current pricing" |

**Coverage minimum (MVP, to unblock the tool):** every operating carrier this currency can book gets at least one row. That row tells the tool the bookability EXISTS even if exact pricing is NULL — the user can click through to `partner_chart_url` for authoritative cost.

**Coverage ideal (later, full tool fidelity):** every (operating carrier × cabin × distance band OR region pair) the program prices.

**Seed via SQL migration**, alongside the editorial PR. Include a header comment explaining the program's pricing model + source (link to the official chart used).

### Step 6 — SEO + indexing (one of the user's two manual steps)

This is one of only two things the user does manually per program (spot-check live page + submit to GSC/Bing). To make it as fast as possible, **always present each URL on its own line in a fenced code block** so the user gets a copy-to-clipboard button in their UI. Don't bury URLs inline in prose; don't combine multiple URLs in one code block.

When announcing this step, present exactly this format:

> Live URL to spot-check + submit:
> ```
> https://crazy4points.com/programs/<slug>
> ```
>
> Google Search Console — paste the URL above into the URL Inspection bar:
> ```
> https://search.google.com/search-console
> ```
> → paste the program URL into the inspection field → click "Request Indexing"
>
> Bing Webmaster Tools — URL Submission:
> ```
> https://www.bing.com/webmasters/url-submission
> ```
> → paste the program URL → click Submit

Bing often flags new URLs as "cannot index" on first inspect — that's normal, click Request Indexing anyway.

For section milestones (when 12 US done, then international done, etc.), also resubmit the sitemap to both:

> Google sitemap resubmit:
> ```
> https://search.google.com/search-console/sitemaps
> ```
>
> Bing sitemap resubmit:
> ```
> https://www.bing.com/webmasters/sitemaps
> ```

Then request indexing for each new section URL one at a time, and sanity-check one earlier page via `site:crazy4points.com <airline>` search.

**Universal copy-button rule:** any URL Claude hands the user — official source URLs, RSS feed URLs, admin paths, Stripe / Resend / Vercel dashboards — goes on its own line in a fenced code block. Never describe a URL in prose without surfacing the actual link in a copy-able form right after.

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

### Step 7.5 — Add press-room RSS to Scout (AUTOMATED via SQL)

The Supabase CLI is linked (one-time setup); no admin browser flow needed. I generate the SQL, run it via `supabase db query --linked --file <path>`, and confirm.

> This is what makes every NEW program monitored from day one (Jill, 2026-09-05). The source starts verified-working (curl-tested below), and the **weekly source-health cron** (`/api/cron/recheck-sources`, `lib/sources/recheckSources.ts`) keeps it healthy over time — auto-fixing it if the URL later moves/breaks, or flagging it (aging monitor `sources_recheck`) if it truly dies. So the loop is closed end-to-end: seeded healthy → kept healthy → flagged if it rots.

When announcing the discovered RSS feed to the user (so they can sanity-check it in a browser), present it on its own line in a fenced code block for copy-to-clipboard:

> Press-room RSS feed I'm seeding for `<slug>`:
> ```
> https://news.<carrier>.com/feed/
> ```
> Open in a browser to confirm it returns recent items before I run the SQL insert.

**Process:**

1. **Test the press-room URL with `curl -sLI <url>`** to determine Firecrawl on/off:
   - 200 OK → `use_firecrawl = false`
   - 403/blocked → `use_firecrawl = true` (Firecrawl bypasses CDN bot-blocks)

2. **Write the source-insert SQL** as a one-off file in `/tmp/`. Schema reminder for the `sources` table:
   - `name` text — human-readable source name (e.g. `"Delta News Hub"`)
   - `url` text — RSS or HTML newsroom URL
   - `type` text — `'official_partner'` for airline newsrooms, `'blog'` for TPG/OMAAT etc.
   - `tier` int — `1` (highest priority) for official; `2` for established blogs; `3` for everything else
   - `is_active` boolean — `true`
   - `scrape_frequency` text — `'daily'` for newsrooms, `'weekly'` for slower-moving sources
   - `use_firecrawl` boolean — based on curl test above
   - `notes` text — `Programs: <slug>. <one-line context>.` Cross-references which program slugs this source covers + any quirks (e.g. "Q4-platform CDN bot-blocks plain HTTP; Firecrawl required").

3. **Template SQL:**

```sql
insert into sources (name, url, type, tier, is_active, scrape_frequency, use_firecrawl, notes)
values (
  '<Program> News Hub',
  'https://news.<carrier>.com/feed/',
  'official_partner',
  1,
  true,
  'daily',
  false, -- or true if 403-blocked
  'Programs: <slug>. <quirk note if any>.'
)
on conflict do nothing;
```

4. **Run via Supabase CLI:**

```bash
supabase db query --linked --file /tmp/<slug>-source.sql
```

5. **For joint loyalty programs** (Atmos covers Alaska + Hawaiian; Flying Blue covers Air France + KLM): if the source feed already exists for the parent program, just append to the `notes` field instead of creating a duplicate row:

```sql
update sources set notes = notes || ', <slug>'
where url = '<existing-feed-url>';
```

6. **No browser/admin click-through required.** The CLI runs SQL directly against prod.

**No-RSS fallback:** if the carrier's newsroom is bot-blocked (403) on every URL pattern (Q4-platform sites — AA, JetBlue, Southwest), set `use_firecrawl = true` and use the HTML newsroom URL. Schedule a 1-week verifier routine if useful (`/schedule` skill).

### Step 7.6 — Scrape + seed per-property data (HOTELS ONLY — skip for airlines)

Hotels have a per-property table at `/admin/programs/[slug]/properties` that the public page, the writer, the fact-checker, and the **Decision Engine** all read from. Without this data the Decision Engine has nothing to surface in destination searches — so this step is mandatory for every hotel program, not optional.

**Goal: Claude scrapes the program's property finder + chart, builds the CSV, runs the SQL backfill, all without user paste-in.**

- Use Firecrawl crawl mode (or extract-chart-style structured pulls) against the program's property finder URL (e.g. `marriott.com/hotel-search/`, `hilton.com/en/hotels/`). Page through the listings filtered by award category.
- Emit `data/[slug]-properties-current.csv` with columns: `name,brand,city,country,region,category,off_peak_points,standard_points,peak_points,hotel_url,all_inclusive,notes`. Leave points columns blank — the SQL backfill fills them in.
- Bulk-insert into `hotel_properties` via `supabase db query --linked --file <path>`. Don't ask the user to paste into the admin Bulk Import box — that's a CSV-paste workaround we used before SQL was the default.
- Write `data/[slug]-points-backfill.sql` joining to a `VALUES` table mapping category → points (use the program's published chart from `programs.[slug].award_chart`). Run via `supabase db query --linked --file <path>`.
- Spot-check via `select count(*), category from hotel_properties where program_id = (...) group by category` — counts should look right per category.

⚠️ **Current state (2026-05-05):** the property-finder scraper isn't built yet — Marriott authoring exposed this gap. Until it lands, this step still requires per-program manual scraping, which violates the "Claude drives end-to-end" goal. Capture as a top-priority backlog item: `scripts/scrape-properties.mjs --slug=<x>` using Firecrawl crawl mode + LLM-driven categorization. ~3-4 hrs to build. Pays off across Marriott / Hilton / IHG / Wyndham (4 hotels × ~200-1000 properties each).

Watch out: Supabase REST default caps SELECT at 1,000 rows. Any new query helper that reads `hotel_properties` must paginate (see `getPropertiesForProgram` for the pattern).

### Step 8 — Cross-linking (skip until cards exist)

Note in the source doc which co-brand credit cards earn into this program. When Credit Cards section starts authoring, those cards will link back automatically.

For hotels, also note: once Step 7.6 is done, `hotel_properties` is automatically wired into the fact-checker (verifies property/category claims) and the Decision Engine (surfaces hotels in destination searches). No per-program work beyond seeding the table.

### Step 8.5 — Full-page audit (final wrap before user spot-check)

This is the gate before the user is asked to spot-check the live page. Everything Claude has written — admin paste, source doc, press-room source, properties (hotels) — gets verified here. If anything fails, Claude fixes it without asking, then re-runs the audit. Only when 100% passes does Claude hand to the user.

**Run the existing audit scripts in sequence:**

```bash
node scripts/verify-program.mjs --slug=<slug>           # live page renders, no raw slugs, all sections
node scripts/llm-audit-program.mjs --slug=<slug>        # Sonnet pass: hedging, banned absolutes, comparative claims
node scripts/audit-program.mjs --slug=<slug>            # regex-based banned-words sweep (cheap, noisy)
```

**Then run the wider checklist (Claude does each by hand or via curl/HTTP fetch — eventually rolled into one `scripts/audit-program-full.mjs`):**

- [ ] `programs.last_verified` is today; completeness is N/N (10/10 for non-alliance, 9/9 for alliance)
- [ ] Every transfer-partner row in JSON renders a real name on the live page (no raw slugs)
- [ ] **Mobile contract** — fetch live page in headless mode at 375px width, run `document.documentElement.scrollWidth - clientWidth` — must be 0
- [ ] **TOC strip** lists every populated section
- [ ] **JSON-LD schema** present in page source if applicable (`view-source:` → search for `application/ld+json`)
- [ ] **Sources doc** at `plans/sources/<slug>.md` exists and lists every URL consulted during research
- [ ] **Press-room source** seeded in `sources` table with `Programs: <slug>` in notes (Step 7.5)
- [ ] **Hotel-only**: `hotel_properties` count > 0, all categories populated, off-peak/standard/peak columns filled (Step 7.6)
- [ ] **Airline/loyalty_program-only**: `partner_redemptions` rows exist for every operating carrier this currency books (Step 5.5)
- [ ] **Writer regen test**: pick an alert tagged to this program, hit Regenerate in admin, confirm new draft reflects facts from the new Page content (no contradictions with what was just authored)

**If any check fails, Claude fixes it without asking, then re-runs the audit.**

**MANDATORY COMPLETION ANNOUNCEMENT FORMAT** — when (and only when) all checks pass, Claude MUST output exactly this structured checklist as the final message. Do not skip items, do not paraphrase, do not consolidate. The user has flagged repeated frustration when steps get omitted from the closing handoff:

```
## Program shipped — final audit checklist

| Check | Status |
|---|---|
| verify-program.mjs | ✅ PASS |
| Sonnet audit (final round) | ✅ Clean (or HIGH/MED applied) |
| Source doc at plans/sources/<slug>.md | ✅ Created (X bytes) |
| Press-room source seeded in `sources` table | ✅ Row exists, `Programs: <slug>` in notes |
| partner_redemptions (airline / loyalty_program only) | ✅ N rows + programs.partner_chart_url set |
| hotel_properties (hotel only) | ✅ N rows seeded |
| JSON-LD on live page | ✅ Present |

Live URL to spot-check + submit:
\`\`\`
https://crazy4points.com/programs/<slug>
\`\`\`

Google Search Console — paste the URL above into the URL Inspection bar:
\`\`\`
https://search.google.com/search-console
\`\`\`

Bing Webmaster Tools — URL Submission:
\`\`\`
https://www.bing.com/webmasters/url-submission
\`\`\`
```

Every checklist row must report actual state from the verify run, not a placeholder. If a row would be ❌ or ⚠️, fix the gap before announcing — don't ship a checklist with red rows. The user's one-and-only manual cue is the live URL + GSC + Bing.

⚠️ **Current state:** these checks are partly automated (verify-program.mjs + llm-audit-program.mjs + audit-program.mjs all exist), partly manual. Backlog: roll the entire battery into `scripts/audit-program-full.mjs` so it's one command + a pass/fail report. ~1.5 hrs to build.

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

If yes to all → start with "Step 1" prompt to user (the paste-in list).
If user named an airline that isn't in DB → ask them to add it first via admin, OR offer to draft a migration row.
