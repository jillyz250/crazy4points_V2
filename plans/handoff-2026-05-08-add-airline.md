# Handoff — Adding an Airline (2026-05-08)

State of the add-airline workflow as of 2026-05-08. Pick up here when authoring the next program.

## Current state

- **76 airlines authored** in the DB (Caribbean Airlines shipped 2026-05-08, PR #390).
- Skill `add-airline` orchestrates the 11-step pipeline. Type-matched runbook at `plans/airline-page-runbook.md` is the source of truth.
- Most steps are now Claude-driven end-to-end. **User does TWO things only:** spot-check the live page after audit passes, and submit the URL to GSC + Bing.

## The lean workflow (as practiced today)

1. **Confirm program row exists.** If not, write a small seed migration (`supabase/migrations/NNN_seed_<slug>.sql`) with `slug`, `name`, `type`, `alliance`, `hubs`, `is_active=true`, `is_reference_stub=false`, `refresh_tier=2` (small carrier) or `1` (major), `scrape_urls` jsonb. Run via `supabase db query --linked --file <path>`.
2. **Run `node scripts/research-program.mjs --slug=<slug>`.** Fires Firecrawl scrapes against `scrape_urls` + emits a WebSearch queue.
3. **Fire ALL WebSearch topics from the queue in parallel.** One message, multiple WebSearch tool calls.
4. **Draft 10 fields internally. DO NOT dump combined preview to user.** Per lean workflow update, the user does NOT want to read scattered drafts inline.
5. **Output ONE thing: the Copilot fact-check block** (Step 3 format in SKILL.md). User pastes into Copilot, returns verdicts.
6. **Resolve disagreements with WebSearch + 2026-dated sources.** Conflicts get surfaced to the user verbatim — never auto-resolve.
7. **Write SQL migration directly** (`supabase/migrations/NNN_seed_<slug>_page.sql`). One UPDATE covering all populated fields. **MUST set `content_updated_at = now()`** (see gotcha below).
8. **Step 5.5 — partner_redemptions seed.** Mandatory. Even if dynamic-pricing or chart-unverified, seed at least one row per (currency × operating_carrier × cabin) with `confidence='LOW'` and pricing structure described in `notes`.
9. **Source doc** at `plans/sources/<slug>.md`. Use `_TEMPLATE.md`. Log every Copilot disagreement + resolution.
10. **Press-room source** in `sources` table (Step 7.5). Curl-test the URL first; set `use_firecrawl=true` if SPA or 403.
11. **Audit** — `verify-program.mjs --program=<slug>` + `llm-audit-program.mjs` + `audit-program.mjs`. All must pass before announcing.
12. **Commit + PR + merge.** Final message uses the MANDATORY checklist format from SKILL.md Step 8.5.

## Gotchas — read these before authoring the next one

### 1. `content_updated_at` is the public-render gate

`app/(site)/programs/[slug]/page.tsx` line 96:
```ts
if (!program.content_updated_at) { notFound() }
```

Skeleton rows (seeded for slug-resolution but no editorial) hide from the public site. **The editorial migration MUST set `content_updated_at = now()`** alongside the field updates, or the live page 404s after deploy. Caught on Caribbean Airlines 2026-05-08; took a one-line follow-up SQL to unhide. Don't repeat it.

### 2. Hash-routing SPAs return shell-only content

Some airline sites (Caribbean Airlines, possibly more) use client-side hash routing (`/#/loyalty-programmes/...`). Firecrawl scrapes the homepage shell for every URL, not real loyalty content. Symptom: every scraped markdown file is 740-741 lines and identical. Fall back to:
- WebSearch + 2026-dated third-party sources (TPG, OMAAT, Frequent Miler, Upgraded Points)
- Official email/PDF the user has in hand
- Vendor enrolment PDFs hosted at canonical CDN paths
- Tag every field that lacks an official source with "verify on next review"

Set the press-room source to `use_firecrawl=true` so future Scout runs can JS-render.

### 3. Avios-family conflation trap (still active)

When WebSearch returns "X transfers to Avios," DO NOT apply to all 7 Avios programs. Each Avios program (BA / Iberia / Aer Lingus / Vueling / Finnair / Qatar / Loganair) has its own direct-transfer-partner roster on the issuer's own page. Combine My Avios is second-hop, not direct.

**Issuer-page-only rule:** verify ratios against `capitalone.com/.../venture-miles-transfer-partnerships`, `americanexpress.com/transfer-partners`, etc. — never blogs. `error-pattern-check.mjs` has guards since 2026-05-07.

### 4. `transfer_partners` empty array is valid

Some carriers genuinely have no flexible-currency transfer-in (Caribbean Airlines confirmed). Set `transfer_partners = '[]'::jsonb` in the migration. Don't invent partners.

### 5. ASCII-only in SQL string data

Scrub em-dashes, smart quotes, ellipsis before applying. Replace `—` with ` - `, `'`/`'` with `'`, `…` with `...`. Per `feedback_ascii_only_in_sql_data.md`.

### 6. The CLI returns the LAST query's results only

`supabase db query --linked --file <multi-statement.sql>` only shows the final statement's output. To verify intermediate state, split queries.

## Mandatory completion announcement format

When all checks pass, output exactly this (from SKILL.md Step 8.5):

```
## Program shipped — final audit checklist

| Check | Status |
|---|---|
| verify-program.mjs | ✅ PASS |
| Sonnet audit (final round) | ✅ Clean |
| Source doc at plans/sources/<slug>.md | ✅ Created (X bytes) |
| Press-room source seeded in `sources` table | ✅ Row exists, `Programs: <slug>` in notes |
| partner_redemptions | ✅ N rows + programs.partner_chart_url set |
| JSON-LD on live page | ✅ Present |

Live URL to spot-check + submit:
\`\`\`
https://crazy4points.com/programs/<slug>
\`\`\`

Google Search Console:
\`\`\`
https://search.google.com/search-console
\`\`\`

Bing Webmaster Tools:
\`\`\`
https://www.bing.com/webmasters/url-submission
\`\`\`
```

Every URL on its own line in a fenced code block (copy-button rule).

## Backlog identified, not yet built

- **`scripts/scrape-properties.mjs`** for hotels (Marriott authoring exposed the gap; ~3-4 hrs to build, pays off across Hilton/IHG/Wyndham).
- **`scripts/audit-program-full.mjs`** to roll verify + llm-audit + audit + JSON-LD check + mobile-overflow check into one pass/fail. ~1.5 hrs.
- **JS-rendering Firecrawl mode** for hash-routing SPAs (Caribbean Airlines was the trigger). Currently must hand-curate WebSearch fallback when it happens.
- **`scripts/research-program.mjs` → emit Copilot block directly** instead of just emitting the WebSearch queue. Would save one round-trip per program.

## Next likely program

User has expressed interest in:
1. Hotels (Hilton / IHG / Wyndham) — biggest remaining gap; Hyatt + Marriott done.
2. Tier D Copilot verification pass (9 programs authored without cross-check).
3. Credit cards — Chase Sapphire Reserve was queued.
4. Partner-booking tool launch (data foundation complete; 76 programs × ~400 partner_redemption rows).

## Pickup prompt for next session

> Read `plans/handoff-2026-05-08-add-airline.md`. I want to add `<program>`. Run the lean add-airline workflow: confirm row exists, run research-program.mjs, fire WebSearch queue in parallel, draft internally, emit ONE Copilot fact-check block, wait for verdicts, write SQL migration with `content_updated_at = now()`, seed partner_redemptions + source doc + Scout source, audit, commit + PR + merge. Use the mandatory completion checklist when done.

## Memory references that still apply

- `feedback_authoring_workflow.md` — surface one step at a time
- `feedback_brand_voice_sassy.md` — sassy traveler-friend, never obnoxious
- `feedback_avios_family_transfer_partner_check.md` — issuer-page-only rule
- `feedback_capture_transfer_fees.md` — every transfer-partner row notes tax status
- `feedback_lounge_day_pass_rules.md` — 4 facts per day-pass row, not just price
- `feedback_ascii_only_in_sql_data.md` — em-dash / smart-quote scrub
- `feedback_prefer_sql_over_admin_forms.md` — SQL migration is the default path
- `feedback_writer_voice_useful_tangent.md` — two-tangent rule (upside + caveat)
- `feedback_flag_non_official_sources.md` — ⚠️ on third-party-only fields
