# Hotel Program Page — Authoring Runbook

Step-by-step checklist for adding (or refreshing) a hotel program's public page at `/programs/[slug]`. Goal: comprehensive, sourced, hedged, indexed.

This is the hotel-specific runbook. For airlines, see `airline-page-runbook.md`. The 11-step workflow is identical — only the per-step content shifts.

Run through this top-to-bottom for every hotel program. Don't skip — items that look optional are the ones that bite later.

---

## Schema mapping: airline fields → hotel meaning

The schema is identical across program types. The fields just hold different content:

| Field             | Airline meaning                | Hotel meaning                                         |
|-------------------|--------------------------------|-------------------------------------------------------|
| alliance          | SkyTeam / Star / oneworld      | Set to **"None"** — hotels don't do alliances         |
| hubs              | Major airports                 | Leave empty (or repurpose for flagship properties)    |
| intro             | Voicey program intro           | Same — sass + reader-fit framing + brand portfolio    |
| transfer_partners | Cards/programs that transfer   | Same JSONB shape; usually fewer entries than airlines |
| how_to_spend      | Award flights, upgrades, etc.  | Award nights, Suite Upgrade Awards, Free Night Certs  |
| sweet_spots       | Sweet redemption examples      | Category sweet spots, 4th-night-free plays            |
| tier_benefits     | XP-based tiers                 | Stay-based tiers (nights / base points / dollars)     |
| lounge_access     | Airline alliance lounges       | Club lounge / Regency Club access for top tier        |
| quirks            | Expiry, family pooling, etc.   | Free Night Cert categories, peak/off-peak, lifetime status |

---

## 0. Prep — does the program row exist?

- [ ] Open `/admin/programs`, switch to **Hotels** tab, filter by program name
- [ ] If missing, add it via "Add program" form (slug convention: see existing rows — usually FFP/program brand short name like `hyatt`, `marriott`, `hilton`, `ihg`)
- [ ] Verify any **co-brand credit cards** that earn into this program also exist in the **Credit Cards** tab. Hotels typically have multiple co-brands (e.g. Chase Hyatt personal + Chase Hyatt Business; Amex Bonvoy Brilliant + Bonvoy Bevy + Bonvoy Business). Add any missing — transfer-partner table on the hotel page links to them.

---

## 1. Web research (NO drafting from memory)

**OFFICIAL SOURCE FIRST — ASK THE USER TO PASTE.** Before drafting, surface a paste-in request for the official text (full checklist in `.claude/skills/add-airline/SKILL.md` Step 1, hotel section). For hotels, that means: award category chart with off-peak/standard/peak bands, official tier benefits page, Free Night Certificate rules (which co-brand cards unlock which categories, blackouts, expiry), Suite Upgrade Award rules (if applicable), club lounge / executive lounge access policy, points expiry/inactivity policy, peak/off-peak pricing methodology, all-inclusive resort award rules.

LLMs (Claude + any fact-checker) all draw from the same secondary blog pool — disagreements can't be settled without the official text. Don't draft program-rule fields from blogs.

**Run trusted-blog research in parallel** with 2026 date filters. Treat training data as stale by default — current date is 2026 and chart/category/tier rules may have shifted.

- [ ] Pull current data from at least **3 independent points-and-miles sources** for each section:
  - The Points Guy (TPG)
  - One Mile at a Time (OMAAT)
  - Frequent Miler
  - AwardWallet
  - Upgraded Points
  - NerdWallet (for transfer partners)
  - Milesopedia (good for cross-comparison)
- [ ] Pull from the **official program site** for: tier benefits, award category chart, free-night-certificate rules, suite upgrade rules, peak/off-peak pricing, expiration policy
- [ ] Confirm the **co-brand credit card free night certificate rules** — which categories does each card unlock? E.g. Chase Hyatt personal = Cat 1-4, Hyatt Biz = Cat 1-4, Bonvoy Boundless = up to 35K-point properties.
- [ ] Cross-check current peak/off-peak rates against a 2026-dated article — programs adjust pricing on a rolling basis
- [ ] Save **all source URLs** as you go — they go into the source list at the end

---

## 2. Draft each block, then hedge

For every claim you write down, ask:
- "Is this 100% true today, or just usually true?"
- "Could this change next month?"
- "Did the program announce a recent devaluation or restructure?"

Banned absolute words (rewrite if found):

| Avoid | Use instead |
|---|---|
| never | "do not expire under current rules" / "currently exempt" |
| always / guaranteed | "typically", "as of [Month YYYY]" |
| free | "no fee" / "no annual cost" |
| instant | "usually near-instant" |
| all properties | "most properties" / "the majority of [brand] hotels" |
| no resort fees | "many properties don't charge resort fees on award nights" |

Brand voice in **Intro** and **Sweet spots**: sassy + funny traveler-friend. **Transfer partners**, **Tier benefits**, **Lounge access**, **Tips & quirks**: neutral and factual.

---

## 3. Cross-fact-check with Copilot (or another model)

- [ ] Paste your draft into Copilot with: "Fact-check this against current 2026 data. Flag anything outdated or unsourced."
- [ ] Diff what Copilot says against your draft. **Don't blindly accept** — Copilot also pulls from old evergreen articles. If Copilot disagrees, search a 2026-dated source to settle.
- [ ] Capture URLs Copilot cites — they go into the source list.

---

## 4. Author in admin

- [ ] `/admin/programs?type=hotel` → filter to the program → click **Edit** in the **Page** column
- [ ] **Alliance dropdown** → select **"None (independent)"**
- [ ] **Hubs** → leave empty (or paste flagship property city codes if your strategy uses them — TBD)
- [ ] **Intro** → paste markdown
- [ ] **Transfer partners** JSON → paste
- [ ] **How to spend miles** → paste markdown (frame as "How to spend points")
- [ ] **Sweet spots** → paste markdown
- [ ] **Tier benefits** JSON → paste (use stay-based qualifications, not XP)
- [ ] **Lounge access** → paste markdown (frame as "club lounge access")
- [ ] **Tips & quirks** → paste markdown (Free Night Cert breakdown lives here)
- [ ] Save → confirm pill flips to "Today" and completeness shows "9/9 all sections done"

---

## 5. Post-merge (after Vercel deploys)

### Verify the live page
- [ ] Visit `https://crazy4points.com/programs/[slug]`
- [ ] Hero strip shows program name and "**Independent**" badge (not an alliance label)
- [ ] No HUBS pill (since hubs is empty)
- [ ] Intro mentions the brand portfolio if applicable
- [ ] Transfer partners table renders real names (not raw slugs)
- [ ] Tier benefits cards render with stay-based qualifications
- [ ] Lounge access section reads as club-lounge framing, not airport-lounge framing
- [ ] Footer disclaimer shows "Last reviewed [Month YYYY]"
- [ ] Mobile width — table scrolls cleanly

### Test writer grounding
- [ ] In admin, find an alert tagged to this hotel program → click **Regenerate**
- [ ] Confirm the new draft reflects facts from your Page content (categories, tier names, transfer ratios)
- [ ] If the writer hallucinates anything that contradicts Page content, file a bug

---

## 6. SEO + indexing

- [ ] **Google Search Console** — URL Inspection → paste full URL → "Request Indexing"
- [ ] **Bing Webmaster Tools** — submit URL there too
  - Bing often flags brand-new URLs as "URL cannot appear on Bing — issues preventing indexation" on first inspection. Normal for fresh content. Click **Request indexing** and check back in 24-48h.
- [ ] Verify the page is in the auto-generated sitemap (`/sitemap.xml`)
- [ ] Confirm the page has a meaningful `<title>` and meta description

---

## 7. Source list — capture everything

Add to a permanent source doc per program (`plans/sources/[slug].md`):

### Citations (sourced content)
- [ ] Official program FAQ / member benefits URL
- [ ] Award category chart URL
- [ ] Free Night Certificate rules URL (per card if multiple)
- [ ] All article URLs cited from research (Step 1) and fact-check (Step 3)

### News & signal channels (used in Phase 6+ ingestion)
- [ ] **Press room / newsroom URL** (e.g. newsroom.hyatt.com)
- [ ] **Loyalty program news URL** if separate
- [ ] **Investor relations URL** for public hotel cos (Hyatt, Marriott, Hilton, IHG, Choice)
- [ ] **Email newsletter signup URL**
- [ ] **X / Twitter handle**
- [ ] **Instagram handle** (personal-follow only — not automating)
- [ ] **LinkedIn corporate page URL**
- [ ] **YouTube channel URL** if the program has one

---

## 7.5 Add press-room RSS to Scout's source list

If the program has a working RSS press room, add it to `/admin/sources`.

- [ ] Test the RSS URL with `curl -sLI <url>` first to confirm it returns 200 OK
- [ ] If 200: add via `/admin/sources/new` — Type: Official Partner, Tier: 1, Frequency: daily, Firecrawl: off
- [ ] If 403/blocked: add anyway with Firecrawl: on, check back in a week
- [ ] Notes field should reference the program slugs the source covers (e.g. `Programs: hyatt`)

---

## 7.6 Seed per-property data (hotels only)

Hotels have a per-property table at `/admin/programs/[slug]/properties` that the public page, the writer, the fact-checker, and (eventually) the Decision Engine all read from. Skip this step for airlines.

- [ ] Page through Hyatt's / Marriott's / Hilton's etc. property finder, filtered by award category
- [ ] Build a CSV at `data/[slug]-properties-current.csv` with columns: `name,brand,city,country,region,category,off_peak_points,standard_points,peak_points,hotel_url,all_inclusive,notes`. Leave points columns blank — they get backfilled by SQL keyed on `(program_id, category)`.
- [ ] Open `/admin/programs/[slug]/properties`, paste the full CSV into the bulk import box, click Import. Confirm the inserted/updated counts match what you pasted.
- [ ] Write a one-shot SQL backfill at `data/[slug]-points-backfill.sql` that joins to a `VALUES` table mapping category → points (using the program's published chart). Run via Supabase SQL Editor.
- [ ] Hard-refresh the admin properties page — Off-peak / Standard / Peak columns should be populated.
- [ ] Spot-check the search box: filter by city ("Tokyo", "Madrid"), brand ("Park Hyatt"), category ("8") — the row count should look right.

> ⚠️ Supabase's REST default caps SELECT responses at 1,000 rows. `getPropertiesForProgram` already paginates past this; if you add new query helpers that read from `hotel_properties`, do the same.

---

## 8. Cross-linking & related content

- [ ] **Co-brand credit card pages** that earn into this program — make sure each card's program page (when built) links back here, and this hotel page's transfer partners table links to them
- [ ] **Reciprocal hotel benefits** — some programs have status-match-style relationships (M life Rewards reciprocal with Hyatt, Caesars Rewards with Wyndham, etc.). Note these in `quirks`.
- [ ] **Existing alerts** on this program — they automatically appear under the editorial sections
- [ ] **Fact-checker integration** — once seeded, `hotel_properties` is authoritative for any draft that names a property or asserts a category. The fact-check pipeline reads from this table; nothing additional to wire per-program.
- [ ] **Decision Engine integration** — once the "hotels in this destination" feature ships, every program with seeded `hotel_properties` automatically participates. No per-program work needed beyond seeding the table in Step 7.6.

---

## 9. Maintenance reminder

- [ ] Set a personal calendar reminder for **6 months out** to re-review this page
- [ ] The admin staleness pill turns yellow at 60 days — when you see it, check whether anything material has changed (devaluation announcements, new co-brand cards, removed transfer partners) before just hitting Save again

---

## Section milestones (when you finish all hotels)

When the hotel section is complete (~10-15 major programs depending on what you scope), run this end-of-section checklist:

- [ ] **Verify sitemap** at `https://crazy4points.com/sitemap.xml` includes every hotel-program URL. Spot-check 3-5.
- [ ] **Resubmit sitemap** to Google Search Console: Sitemaps → ⋯ → "Resubmit"
- [ ] **Resubmit sitemap** to Bing Webmaster Tools
- [ ] **Request indexing** on Google Search Console for each new program page (one at a time)
- [ ] Confirm at least one earlier-published hotel page appears in Google search by `site:crazy4points.com [program name]`
- [ ] Update the project tracker / changelog: "Hotels section complete — N pages live."

### Hotel programs to cover (suggested order)

Recommended order based on US-reader value:

1. ☐ **Hyatt** (Highest cents-per-point program for US audiences — start here)
2. ☐ **Marriott Bonvoy** (Largest portfolio; most readers have at least one Bonvoy card)
3. ☐ **Hilton Honors** (Massive portfolio; Amex co-brand depth)
4. ☐ **IHG One Rewards** (Holiday Inn / Intercontinental; Chase IHG card)
5. ☐ **Wyndham Rewards** (Caesars reciprocal; budget-tier portfolio)
6. ☐ **Choice Privileges** (Ascend portfolio; transferable currency target)
7. ☐ **Best Western Rewards**
8. ☐ **Radisson Rewards / Americas**
9. ☐ **Accor Live Limitless** (European-leaning; status match plays)

> 🔓 Resources nav trigger fires at **5 US airlines** (per `project_resources_nav_trigger.md`). Hotels likely have their own gating logic when that submenu surfaces — TBD when we ship the Resources nav PR.

---

## Anti-patterns to avoid

- Authoring from memory without a source URL
- Treating older "evergreen" articles as current data — date-check every source
- Using "elite status" alone when the program names tiers (Discoverist / Globalist / Lifetime Globalist for Hyatt — name them)
- Calling a program "free" without conditional language
- Pasting all 9 fields into one input — they go into 9 separate fields
- Skipping Free Night Certificate breakdown — it's a major redemption type for hotels
- Adding a transfer partner whose program slug isn't in the DB
- Generic "club lounge access" without naming which tier unlocks it and at which property types
- Skipping Step 7.6 (per-property seeding) — without it, the fact-checker has nothing to verify property/category claims against, and the Decision Engine can't surface this program's hotels in destination searches
