# Facts Ledger — Full Design Spec

Authored 2026-05-27 during a Step 1 → Step 3 design walkthrough with Jill + Copilot feedback validation. Memory entry: `~/.claude/projects/.../memory/project_facts_ledger.md`.

## Why

Today's fact-checking pattern:
- Jill pastes a draft to Claude
- Claude WebSearches + Firecrawls + replies inline
- Cross-check with Copilot/ChatGPT via copy-paste
- Repeat per claim
- No record of WHICH source backed WHICH claim
- Drift goes silent until a reader catches it OR the 90-day refresh queue fires
- Every program-page authoring re-invents the wheel

**Cost per program:** 1-2 hours of back-and-forth. Cost per published alert: 5-15 min. Cost per drift incident: unbounded reader-trust damage.

## Vision

A structured ledger of atomic facts per program. Every prose claim on the public site links to one or more ledger facts. Drift surfaces in the admin the moment a fact changes upstream. Publishing is one button.

---

## Step 1 — Research + verification

### Flow

1. `node scripts/research-program.mjs --slug=<slug>` (existing) scrapes official sources + emits WebSearch queue
2. `node scripts/factcheck-program.mjs --slug=<slug>` (new) runs after, doing all of the following:
   - Reads the scrape output
   - Extracts factual claims via pattern matching (dates, percentages, ratios, point thresholds, brand names, partnership claims, etc.)
   - For each claim: runs parallel WebSearch + Firecrawl across known-good sources
   - Applies verification rule tiers to assign a verdict + risk level
   - Writes results to `program_facts` table
   - Outputs a human-readable report to stdout

### Verification rule tiers (HARDCODED)

| Tier | Source mix | Verdict |
|---|---|---|
| 1 | 1 OFFICIAL issuer source (hilton.com, amex.com, etc.) dated < 6 months | ✅ VERIFIED |
| 2 | Official source 404/silent + 2+ trusted-blog 2026 sources agreeing | ✅ VERIFIED with `third_party_fallback = true` flag |
| 3 | Only 1 third-party source | ⚠️ NEEDS CLARIFICATION |
| 4 | Sources disagree (official vs. blog, or blog vs. blog) | ⚠️ NEEDS CLARIFICATION (never auto-pick winner) |
| 5 | No 2026-dated source found | ❌ INCORRECT (likely from training data) |

Guardrails:
- Same source can't double-count (de-dupe by domain)
- Date floor: 6 months for stable facts, 90 days for volatile (welcome bonuses, transfer bonuses, point values); older auto-downgrades verdict by one tier
- Trusted-blog allowlist:
  - thepointsguy.com
  - onemileatatime.com
  - frequentmiler.com
  - awardwallet.com
  - upgradedpoints.com
  - viewfromthewing.com
  - nerdwallet.com (transfer ratios only)
  - loyaltylobby.com (esp. non-US programs)
  - doctorofcredit.com (esp. issuer policy)
  - milesopedia.com (non-US programs)
  - australianfrequentflyer.com.au
  - 10xtravel.com
  - awardtravelfinder.com
- Any source outside the allowlist counts as 0 sources for verdict purposes
- NerdWallet special case: when 3+ other sources disagree, NerdWallet is treated as outlier (Singapore KrisFlyer ratio incident 2026-05-26)

Risk-level criteria:
- **HIGH** — affects booking math, money, points, dates, eligibility (anything that could lead a reader to lose money or miles)
- **MEDIUM** — affects strategy framing (which card to apply for, when to transfer)
- **LOW** — tone, phrasing, marketing language, secondary context

### Report output format

```
== <Program Name> research complete ==
50 factual claims extracted. All verified.

✅ VERIFIED (43) — auto-locked
[collapsed by default; expandable list, each with full claim + 2+ source URLs + dates + snippets]

⚠️ NEEDS CLARIFICATION (5) — your action required
[expanded by default]
1. CLAIM: "<claim text>"
   PROBLEM: <why sources disagree or are insufficient>
   SOURCES: <list with URLs + dates + snippets>
   RISK: <HIGH | MEDIUM | LOW>
   ACTION: Re-check current <issuer page> and update claim to match current language

[...4 more in same format]

❌ INCORRECT (2) — will remove from draft unless overridden
[expanded by default]
1. CLAIM: "<claim text>"
   EVIDENCE OF INCORRECT: <source + date + snippet showing contradicting fact>
   ACTION: Remove from draft (default), or override with `override_reason`

Run /admin/programs/<slug>/edit to triage.
```

### Admin UI — per-program Facts tab

`/admin/programs/<slug>/edit` gains a "Facts" tab next to existing fields. Lists all facts grouped by verdict, with:
- Claim text
- Category badge (tier_threshold, transfer_ratio, fnr_rule, etc.)
- Verdict badge (✅ / ⚠️ / ❌)
- Risk-level chip
- Source count + expandable source detail (URL + publication date + snippet + optional "why chosen" note)
- Disposition select (auto_locked | kept | reworded | removed | deferred)
- Per-fact "Re-verify" button
- Top-of-page "Run full fact-check" button

---

## Step 2 — Drafting from ledger

### Flow

1. `node scripts/draft-program.mjs --slug=<slug>` (new) reads verified facts from `program_facts`
2. Generates draft prose for each program field (intro, tier_benefits, sweet_spots, etc.) using ONLY verified facts
3. Writes drafts into the existing `programs` table fields
4. Writes prose-fact linkages into `prose_fact_links` table
5. Editor opens `/admin/programs/<slug>/edit` to review

### Voice preservation rule

The AI handles factual scaffolding. The editor (Jill) rewrites for voice. Re-running the draft script does NOT overwrite hand-edited prose without explicit confirmation.

### Admin UI — inline fact markers

In each editable field, prose claims have footnote-style markers:

```
Diamond qualifies at 50 nights, 25 stays, or $11,500 spend per year [¹²³]
```

Hover/click reveals:
```
¹ Fact #42 — "Diamond at 50 nights"
  ✅ verified · hilton.com · 2 days ago

² Fact #43 — "Diamond at 25 stays"
  ✅ verified · hilton.com · 2 days ago

³ Fact #44 — "$11,500 USD threshold"
  ✅ verified · hilton.com · 2 days ago
```

Plus a right sidebar listing all facts referenced in the section.

Editor introduces a NEW claim not backed by a ledger fact:
```
Diamond gets free room upgrades at every Hilton property [⚠ unbacked]
```

Hover reveals:
```
⚠️ This claim doesn't link to any verified fact.
Either add a source via Re-check, reword to a backed claim, or remove.
[Add source]  [Reword]  [Remove]
```

---

## Step 3 — Publishing + maintaining

### Part A — One-button publish

`/admin/programs/<slug>/edit` gains a `[Publish]` button at the top + a `[Run checks only]` dry-run button.

When clicked, the script runs in sequence with inline progress (~30 seconds):

```
✓ Verifying all facts in ledger are current (last re-check < 7 days old)
✓ Verifying every prose claim is backed by a ledger fact (none unbacked)
✓ Running banned-words sweep (no absolutes like "never", "free")
✓ Running mobile-contract check (no overflow at 375px on live preview)
✓ Updating programs.last_verified
✓ Triggering Vercel revalidation for /programs/<slug>
✓ Submitting URL to Google Search Console API
✓ Submitting URL to Bing Webmaster Tools API
✓ Auto-generating plans/sources/<slug>.md from ledger sources
✓ Done — live at https://crazy4points.com/programs/<slug>
```

Failures surface inline. No SQL paste workaround. No admin form re-clicking.

### Part B — Weekly auto-re-verify (Vercel cron)

`/api/cron/reverify-ledger` runs once a week.

For each fact in the ledger:
- Re-runs WebSearch + Firecrawl checks
- Compares new verdict against stored
- If unchanged: updates `reviewed_at` timestamp silently
- If changed: creates NEW fact row with `prior_version_id` pointing to old; old marked `superseded_at = now()`

Risk-tiered frequency:
- HIGH risk: weekly
- MEDIUM: every 2 weeks
- LOW: every 30 days

Monday morning email summary:

```
Subject: Crazy4Points facts ledger — weekly drift report

12 facts re-checked across 9 programs.
✅ 11 still verified (no change since last week).
⚠️  1 drift detected:

  Hilton Honors — "Diamond status threshold"
  Was:  50 nights (verified 2026-05-26)
  Now:  45 nights (hilton.com updated 2026-06-03)
  Risk: HIGH
  Confidence delta: still ✅ verified (Tier 1 official source)
  Affects: programs/hilton (intro, tier_benefits)
  → Review at /admin/programs/hilton/edit
```

### Part C — Drift handling

When a fact drifts:
1. Ledger updates (new row + prior_version_id linkage)
2. Admin dashboard banner at `/admin`:
   ```
   ⚠️ 1 fact drift detected — Hilton Diamond threshold changed [Review]
   ```
3. Affected program edit pages show inline warning:
   ```
   ⚠️ Diamond tier paragraph references a fact that changed 3 days ago.
      Old: "50 nights"
      New: "45 nights"
      [Auto-rewrite] [Show diff] [Mark intentional + override]
   ```

Auto-rewrite: spawns AI to rewrite ONLY the affected paragraph using the new fact. Editor reviews diff → approves → publish.

### Part D — Auto-generated source doc

`plans/sources/<slug>.md` becomes generated on every publish. Contains:
- All sources used per fact (URL + publication date + snippet + optional why_chosen)
- Disagreements + resolutions table (from fact verdicts)
- Drift history per fact (from `prior_version_id` chain)
- Last-reviewed timestamp

A `## Editor notes` section is preserved between regenerations for manual additions.

---

## Schema

```sql
create table program_facts (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null,
  claim_text text not null,
  category text,                   -- 'tier_threshold' | 'transfer_ratio' | 'fnr_rule' | 'earn_rate' | 'partnership' | etc.
  verdict text not null check (verdict in ('verified', 'needs_clarification', 'incorrect')),
  risk_level text not null check (risk_level in ('high', 'medium', 'low')),
  sources jsonb not null,          -- [{ url, publication_date, snippet, why_chosen? }]
  third_party_fallback boolean default false,  -- true if Tier 2 (official source unavailable)
  disposition text check (disposition in ('auto_locked', 'kept', 'reworded', 'removed', 'deferred')),
  override_reason text,
  reviewed_at timestamptz not null default now(),
  reviewed_by text,
  program_state_context text,
  prior_version_id uuid references program_facts(id),
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);

create index program_facts_slug_idx on program_facts (program_slug, superseded_at);
create index program_facts_verdict_idx on program_facts (verdict, risk_level);
create index program_facts_drift_idx on program_facts (reviewed_at, risk_level) where superseded_at is null;

create table prose_fact_links (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null,
  field_name text not null,        -- 'intro' | 'tier_benefits' | 'sweet_spots' | etc.
  fragment_anchor text,            -- paragraph-level anchor or sequence number
  fact_id uuid not null references program_facts(id),
  created_at timestamptz not null default now()
);

create index prose_fact_links_program_idx on prose_fact_links (program_slug, field_name);
create index prose_fact_links_fact_idx on prose_fact_links (fact_id);
```

---

## Phased build

### Phase 1 — Ledger foundation (~6-8 hours)

- [ ] Migration: `program_facts` table + indexes
- [ ] `scripts/factcheck-program.mjs` — extract claims, run parallel WebSearch + Firecrawl, write to ledger, output report
- [ ] `app/admin/(protected)/programs/[slug]/edit/page.tsx` — add Facts tab
- [ ] Per-fact UI components: claim card, source expand, disposition select, re-verify button
- [ ] Top-of-page "Run fact-check" button + inline progress
- [ ] No AI drafting, no auto-publish, no cron yet

**Replaces:** conversational fact-checking pattern, creates audit trail
**Test:** run `factcheck-program.mjs --slug=hilton` → spot-check Facts tab shows the 50 facts we manually verified during Hilton authoring

### Phase 2 — AI drafting + linkage (~6 hours)

- [ ] Migration: `prose_fact_links` table
- [ ] `scripts/draft-program.mjs` — generate draft prose from verified facts
- [ ] Inline fact markers in admin editor (footnote-style + hover reveal)
- [ ] Right sidebar showing all facts referenced in current section
- [ ] Warning UI when editor introduces unbacked claim
- [ ] Voice-preservation guard (no overwrite of hand-edited prose without confirmation)

### Phase 3 — Publish pipeline (~4 hours)

- [ ] `[Publish]` button + `[Run checks only]` dry-run
- [ ] Inline check pipeline (ledger freshness, prose-fact linkage, banned-words, mobile contract)
- [ ] Google Search Console Indexing API integration
- [ ] Bing Webmaster Tools URL Submission API integration
- [ ] Auto-generated `plans/sources/<slug>.md` (preserving Editor notes section)

### Phase 4 — Drift detection + auto-fix (~6 hours)

- [ ] `/api/cron/reverify-ledger` Vercel cron
- [ ] Risk-tiered re-verification frequency (HIGH weekly / MEDIUM 2wk / LOW monthly)
- [ ] Monday email drift report (Resend integration; include confidence delta)
- [ ] `/admin` dashboard drift banner
- [ ] Inline drift warnings on affected program edit pages
- [ ] Auto-rewrite paragraph button + `[Show diff]` reveal
- [ ] Override flow for "Mark intentional"

---

## What this replaces / supersedes

| Today | Replaced by |
|---|---|
| Conversational fact-checking via chat | Phase 1: structured ledger + script |
| Per-claim copy-paste with Copilot/ChatGPT | Phase 1: parallel verification in one run |
| Manual draft of 10 program fields | Phase 2: AI draft from ledger |
| 6-step admin publish dance | Phase 3: one button |
| Manual `plans/sources/<slug>.md` authoring | Phase 3: auto-generated |
| Manual GSC + Bing submission | Phase 3: API integration |
| 90-day refresh queue (entity-level) | Phase 4: fact-level continuous re-verification (eventually retire refresh queue) |
| Reader catches stale facts before we do | Phase 4: drift surfaces in admin within a week |

---

## Open design questions (for future sessions)

1. **Should `prose_fact_links` track at paragraph or sentence granularity?** Current design: paragraph. Copilot agreed this is the right balance.
2. **How does ledger handle facts that span programs?** E.g. "Amex MR transfers to Aeromexico at 1:1.6" — is this a fact ON the Amex page or the Aeromexico page or both? Lean toward: lives on the originating issuer (Amex), referenced by the target.
3. **Should card detail pages share the same ledger pattern?** Yes — same schema, same flow. Phase 5 candidate after programs ship.
4. **Eventually subsume the existing `credit_card_extractions` table into the ledger?** Probably yes — same audit-trail problem, same drift problem, currently uses a parallel pattern.

---

## Related memory + plan files

- `~/.claude/projects/.../memory/project_facts_ledger.md` — top-level summary
- `~/.claude/projects/.../memory/feedback_firecrawl_official_sources.md` — official-source-first rule that drives Tier 1
- `~/.claude/projects/.../memory/feedback_scrape_official_skip_copilot.md` — same
- `~/.claude/projects/.../memory/feedback_card_data_issuer_source_only.md` — strict issuer-source rule for cards
- `~/.claude/projects/.../memory/project_transfer_bonus_monitor.md` — sibling pattern (scraper + admin queue) already shipped
- `plans/airline-page-runbook.md` and `plans/hotel-page-runbook.md` — current 11-step runbooks that phases 1-3 collapse

## Pickup triggers

Start Phase 1 when ANY of:
1. Next session begins with "let's build the facts ledger"
2. Adding another program (IHG / Wyndham / etc.) — pain point is fresh
3. A reader catches a stale fact on a live page
4. Fact-checking a single alert takes more than 15 minutes
