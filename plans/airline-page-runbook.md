# Airline Page — Authoring Runbook

Step-by-step checklist for adding (or refreshing) an airline's public page at `/programs/[slug]`. Goal: comprehensive, sourced, hedged, indexed.

Run through this top-to-bottom for every airline. Don't skip — items that look optional are the ones that bite later.

---

## 0. Prep — does the program row exist?

- [ ] Open `/admin/programs`, switch to **Airlines** tab, filter by carrier name
- [ ] If missing, add it via "Add program" form (slug convention: see existing rows — typically carrier name lowercase with underscores, or iconic FFP-brand)
- [ ] Verify any **co-brand credit cards** that earn into this program also exist in the **Credit Cards** tab (Bilt, Delta Amex, BA Avios cards, etc.). If not, add them — transfer-partner table on the airline page links to them.

---

## 1. Web research (NO drafting from memory)

- [ ] Pull current data from at least **3 independent points-and-miles sources** for each of the four content sections:
  - The Points Guy (TPG)
  - One Mile at a Time
  - Frequent Miler
  - AwardWallet
  - NerdWallet (for transfer-partner ratios)
  - Upgraded Points
  - Milesopedia (especially for non-US programs)
- [ ] Pull from the **official program site** for: expiration policy, family pooling, promo cadence, status tier rules, fuel-surcharge policy
- [ ] Cross-check current promo / sweet-spot examples against **a 2026-dated** article — historical articles often cite old discount levels (e.g., "up to 50%" when current is 25%)
- [ ] Save **all source URLs** as you go — they go into the source list at the end

---

## 2. Draft each block, then hedge

For every claim you write down, ask:
- "Is this 100% true today, or just usually true?"
- "Could this change next month?"
- "Did the program announce a policy update I haven't reflected?"

Banned absolute words (rewrite if found):
| Avoid | Use instead |
|---|---|
| never | "do not expire under current rules" / "currently exempt" |
| always / guaranteed | "typically", "as of [Month YYYY]" |
| free | "no fee" |
| instant | "usually near-instant" |
| all | "most", "the major flexible currencies" |
| no fuel surcharges | "typically $X–Y in surcharges/taxes" |

Brand voice still applies in **Intro** and **Sweet spots**: sassy traveler-friend, never obnoxious. **Transfer partners** and **Tips & quirks** stay neutral and factual.

---

## 3. Cross-fact-check with Copilot (or another model)

- [ ] Paste your draft into Copilot (or another fact-checker) with: "Fact-check this against current 2026 data. Flag anything outdated or unsourced."
- [ ] Diff what Copilot says against your draft. **Don't blindly accept** — Copilot also pulls from old evergreen articles. If Copilot disagrees, search a 2026-dated source to settle.
- [ ] Capture any URLs Copilot cites — they go into the source list. (If your paste loses URLs, ask Copilot to "list every URL you used" at the end.)

---

## 4. Author in admin

- [ ] `/admin/programs?type=airline` → filter to the carrier
- [ ] Click **Add** in the **Page** column (NOT FAQ — that's deprecated)
- [ ] Paste **only the Intro** into Intro field
- [ ] Paste **only the JSON array** (`[...]`) into Transfer partners field
- [ ] Paste **only the bullets** for Sweet spots into Sweet spots field
- [ ] Paste **only the bullets** for Tips & quirks into Tips & quirks field
- [ ] Save → confirm pill flips to "Today"
- [ ] Re-open Edit to verify all four fields persisted

---

## 5. Post-merge (after Vercel deploys)

### Verify the live page
- [ ] Visit `https://crazy4points.com/programs/[slug]`
- [ ] Intro renders as expected
- [ ] Transfer partners table — every partner has a real name (not the raw slug like `chase`); if any show as raw slugs, the partner program row is missing from DB
- [ ] BONUS badge appears for any partner with `bonus_active: true`
- [ ] Sweet spots / quirks render with proper bullet formatting
- [ ] Footer disclaimer shows "Last reviewed [Month YYYY]"
- [ ] Mobile width — does the table scroll horizontally cleanly?
- [ ] Click a transfer-partner name — links to that program's page (or 404s if the partner program isn't seeded)

### Test writer grounding
- [ ] In admin, find an alert tagged to this program → click **Regenerate**
- [ ] Confirm the new draft reflects facts from your Page content (transfer ratios, expiry rules, promo cadence)
- [ ] If the writer hallucinates anything that contradicts your Page content, file a bug — that's a regression in the prompt

---

## 6. SEO + indexing

- [ ] **Google Search Console** — submit the new URL: Search Console → URL Inspection → paste `https://crazy4points.com/programs/[slug]` → "Request Indexing"
- [ ] **Bing Webmaster Tools** — submit URL there too (free, ~10% of US traffic, often ignored)
- [ ] Verify the page is in the auto-generated sitemap (`/sitemap.xml`); if not, add it manually to `app/sitemap.ts`
- [ ] Confirm the page has a meaningful `<title>` and meta description (handled in `generateMetadata` — sanity check it surfaces the program name)

---

## 7. Source list — capture everything

Add to a permanent sources doc per airline (`plans/sources/[slug].md` or your knowledge tracker). Two purposes: audit trail (citations for content) AND a pre-built feed list for Phase 6+ news ingestion.

### Citations (sourced content)
- [ ] Official program FAQ / Terms URL
- [ ] Official Promo Rewards / current promotions URL
- [ ] All article URLs cited from research (Step 1) and fact-check (Step 3)

### News & signal channels (used in Phase 6+ ingestion)
- [ ] **Press room / newsroom URL** (e.g. news.klm.com, news.airfrance.com) — usually RSS-enabled, primary scrape target for Phase 6
- [ ] **Loyalty program news URL** if separate from main press room (e.g. flyingblue.com/en/news) — promo announcements live here
- [ ] **Investor relations URL** for public carriers (DAL, AAL, UAL, LUV) — strategic news
- [ ] **Email newsletter signup URL** — for Phase 6 inbound-email ingestion
- [ ] **X / Twitter handle** — for Phase 7+ social ingestion (skip if no free API access)
- [ ] **Instagram handle** — personal-follow only; not automating (Meta breaks scrapers)
- [ ] **LinkedIn corporate page URL** — corporate news source, low automation priority
- [ ] **YouTube channel URL** — useful for premium cabin pages later

---

## 8. Cross-linking & related content

- [ ] **Co-brand credit card pages** that earn into this program — make sure each card's page (when built) links back here, and this page's transfer partners table links to them
- [ ] **Alliance siblings** — if this carrier is in SkyTeam/Star Alliance/oneworld, eventually we want a "Partners in [alliance]" linked block. Note the alliance now in your Quirks section.
- [ ] **Existing alerts** on this program — they automatically appear under the editorial sections, no action needed. But verify the alerts grid renders correctly with your new editorial above it.

---

## 9. Maintenance reminder

- [ ] Set a personal calendar reminder for **6 months out** to re-review this page (faster for top-5 airlines, slower for long-tail carriers)
- [ ] The admin staleness pill turns yellow at 60 days — if you see it, check whether anything material has changed (transfer ratios, promo discounts, expiry policy) before just hitting Save again to reset the pill

---

---

## Section milestones (US, International, Hotels, etc.)

When you finish all the airlines in a "section" (e.g. all 13 US carriers, then all international, then on to hotels), run this end-of-section checklist:

- [ ] **Verify sitemap** at `https://crazy4points.com/sitemap.xml` includes every program-page URL from the section. Programs are auto-included if `is_active = true`. Spot-check 3-5 random ones.
- [ ] **Resubmit sitemap** to Google Search Console: Sitemaps → confirm `sitemap.xml` → click ⋯ → "Resubmit"
- [ ] **Resubmit sitemap** to Bing Webmaster Tools: Sitemaps → resubmit
- [ ] **Request indexing** on Google Search Console for each new program page in the section (one at a time — there's no bulk option). Especially important for the first 3-5 in the section, which seed Google's understanding of the URL pattern.
- [ ] Confirm at least one earlier-published page from the section appears in Google search by `site:crazy4points.com flying blue` etc. — sanity check that indexing actually started.
- [ ] Update the project tracker / changelog: "Section X complete — N pages live."
- [ ] Take a moment to celebrate. The compounding work is real.

### US airlines section (currently in progress)

Programs to cover (already seeded in DB; pages still to author):
- atmos (Alaska + Hawaiian)
- aa (American AAdvantage)
- delta
- united
- southwest
- jetblue
- spirit
- frontier
- allegiant
- avelo
- breeze
- sun_country
- (Note: FB is not US — it's the warm-up case)

---

## Anti-patterns to avoid

- Authoring from memory without a source URL
- Treating older "evergreen" articles as current data — date-check every source
- Filling FAQ as well as Page (FAQ is being retired; one source of truth)
- Saying "free" or "never" without conditional language
- Pasting all four content blocks into one field instead of four
- Skipping Google Search Console submission — pages can take weeks to index without nudging
- Adding a transfer partner whose program slug isn't in the DB — name will render as raw slug
