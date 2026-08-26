# crazy4points — AI Agents Roadmap

> **Status: FINALIZED (v3) — this is the plan of record.** It began as a document sent to two
> independent AI reviewers for critique; their feedback is now incorporated and locked in the **v2 + v3
> decision blocks below**. Build from the **v2 Final build order** and the **v3 operating guarantees**.
> Sections 0–7 preserve the original business context and the review questions (now answered) so the
> reasoning stays legible — they are history, not open items.

---

## STATUS: v2 — Final decisions (locked after two independent review rounds)

Two AI reviews are complete and converged. **Adopted changes:**

1. **Add a Source Canonicalization Layer** (lightweight — extends the existing `programs.scrape_urls`):
   per official source store `canonical_url`, `fetch_method` (browser / Firecrawl / static),
   `expected_markers`, and a `stable | volatile` flag. A small table, **not** a subsystem. It must exist
   **before** the scheduled drift re-verifier (A2), or drift becomes a false-positive machine.
2. **Split A1 (draft-time) and A2 (scheduled) into separate pipelines that SHARE a fact-extraction
   module** — not one merged engine. *Shared:* claim extraction, fact-type definitions, source registry,
   the ledger. *Separate:* scraping logic, severity thresholds, retry/caching, drift heuristics.
   ("Shared brain, separate bodies.")
3. **Build G0 as a real `verifyClaim()` tool** — not a prose rule. The assistant must call it before
   asserting any correction/negative; it checks the DB + official source, returns a structured verdict,
   the assistant rewrites using that result, and the call logs to the ledger. Enforceable fix for the
   exact failure that started this project.

**Right-sized OUT (deliberately NOT building):** anti-bot scraping fortress (residential proxies,
cookie-chain simulation, human-like timing) → use in-app browser + Firecrawl + human confirm; ML drift
classifier → volatile/stable flag + multi-scrape + heuristics; giant fact-type registry → start with
~6–8 types; separate drift-review queue → it's the `/admin/agents` inbox with a good diff view.

**Final build order:**
- **Phase 1:** A1 Fact Ledger + publish gate + backfill 105 · **G0 `verifyClaim()` tool (BUILD FIRST)** ·
  `/admin/agents` shell.
- **Phase 2:** Source Canonicalization registry (precedes drift) → A2 Scheduled Re-verifier → B1 Intel
  Triage → C1 Sweet Spot.
- **Phase 3:** Newsletter · Social · Curator · Site-Health.

*Sections 4–6 below are the original v1 proposal; this block supersedes them where they differ.*

---

## STATUS: v3 — Four operating guarantees (added after solo-operator review)

These are **cross-cutting design requirements** (not new agents). Every agent must honor them, or the
system fails the solo operator it's built for.

**G-1. Precision + auto-fix — don't rebuild the pile.** If agents are good they'll surface a LOT of
findings; a one-person team can drown in a queue of cards. So:
- Agents must be **high-precision** (few false positives — tune thresholds, multi-scrape confirm).
- **Auto-fix only truly unambiguous, high-confidence, official-source-confirmed** discrepancies — with a
  logged, reversible receipt (see G-4). Everything ambiguous goes to the findings inbox.
- A **confidence threshold** gates auto-fix vs. human review. The inbox shows judgment calls, not noise.

**G-2. Measurement — an accuracy scorecard, not just a to-do list.** The dashboard must track and show
over time:
- discrepancies found + fixed, unsourced claims blocked at publish, **average staleness** (age since a
  fact was last verified), % of pages verified in the last N days, and error rate trend.
- A monthly "here's what I caught" view, so in 3 months we can prove it earned its keep.

**G-3. "Unverifiable" is a first-class outcome.** Issuer pages block bots (the Southwest offer needed the
live browser). When an agent **can't** confirm — page blocked, ambiguous, source missing — it must return
**"needs your manual check"** and route to the inbox. Never guess, never silently pass. `verifyClaim()`
returns `unverified` explicitly and the system surfaces it as a finding, not a shrug.

**G-4. Safety — audit trail + one-click undo.** Agents can WRITE to the database (fix pages). So every
agent DB write is **logged** (what changed, old → new value, source, which agent, timestamp) and
**reversible with one click**. No auto-fix ships without an undo path. This is what makes auto-fix (G-1)
safe to allow at all.

**Build discipline (matters as much as the guarantees): start small, prove, expand.** Ship Phase 1,
actually use it for a few weeks, watch G-2's numbers and the finding volume — *then* decide whether to
build Phase 2. The first agent has to earn the second. Do NOT build all ~10 up front.

**G-5. Verify at INTAKE, not only at publish.** Incoming intel (Scout scrapes + email forwards) must be
verifiable as it arrives — but efficiently: **triage FIRST** (dedup, kill noise, bucket non-US/recurring),
then run **only the surviving publish candidates** through the fact-checker against the official source,
scaling intensity by **source trust** (issuer email = high trust; blog = must-verify). You should only
ever see *already-verified* candidates; we do not burn tokens verifying the ~200 daily junk items. (This
is the Intel Triage agent, B1, calling the fact-checker.)

**G-6. Reconciliation is THREE-way: match / conflict / GAP.** When our page is *missing* a fact the
official source confirms, that is a **gap** finding — not a shrug "unverified." It becomes a proposed
**ADDITION** to the program/card page (with the official source), lands in the inbox, and on approval
updates the page + records the source (+ G-4 undo). **Absence in our DB is never treated as proof** — it
triggers the official check, and a confirmed official fact we lack gets added.

---

## 0. What we're doing + what feedback we want

We run a points-and-miles content website and want to build a suite of **AI agents** (scheduled and
on-demand LLM workers) that keep the site **accurate**, reduce daily manual toil, and produce more
good content. We've already done one internal review that collapsed ~21 agent ideas into ~10
systems; that feedback is baked into this version.

**Please critique:**
1. Is the **architecture** right — one shared "verification engine" with many triggers, vs. separate agents?
2. Is the **prioritization / build order** right for a solo operator whose #1 problem is accuracy?
3. **Overlaps** we should merge further, or **over-consolidation** we should split back out.
4. **Gaps** — high-value agents or safeguards missing.
5. **Feasibility & risk traps** — what's deceptively hard or dangerous.
6. Concrete take on the **in-session guardrail** (Section 5, item G0) — how would you actually enforce it?

---

## 1. The business (context)

- **crazy4points.com** — editorial site about credit-card points and airline/hotel miles. Audience is
  **US-based, New York-heavy**, mostly non-expert travelers.
- **Operator:** one person (non-engineer) working with an AI assistant that does the building, triage,
  authoring, and publishing. So "agents" must produce **drafts/findings a human approves**, not
  autonomous publishing.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, **Supabase (Postgres)** for all data,
  **Resend** for email, **Anthropic Claude** for AI features. Hosted on Vercel.
- **Content types:** *alerts* (short deal/news posts), *program reference pages* (per airline/hotel),
  *credit-card pages*, an *experiences* directory (points-bookable experiences), *sweepstakes*
  listings, a *biweekly newsletter*, and *social posts* (Facebook + Instagram).

## 2. The core problem: accuracy

Accuracy is the prime directive. Editorial rules are strict:
- **Every published claim must trace to an official / issuer source** (a bank's or loyalty program's
  own page) — **never a blog** (blogs contradict each other and themselves).
- **No derived math** (no "points are worth X cents" calculations), **no foreign-currency valuations**.
- **Always show the human the full draft before anything publishes.**

**The failure mode that triggered this project:** in one working session the AI assistant made **four
factual errors**, all the same shape — it **asserted a correction or a negative from memory**
("there's no such card", "that program doesn't transfer to X", "our page is missing Y") **instead of
verifying** against our own database or the official source. **Three of the four were already correct
in our own database.** Everything the assistant *did* verify against an official source first was
right. Key insight: **a publish-time gate would NOT have caught these** — they happened conversationally,
before anything reached the publish pipeline.

## 3. Existing systems (DO NOT propose rebuilding these)

- **"Scout"** — an intel pipeline that scrapes sources into an `intel_items` table for triage.
- **Morning ritual** — a daily human-in-the-loop routine (triage intel → publish alerts → fix pages →
  newsletter/social), plus dedup + triage tooling (`morning-dedup`, `triage-apply`).
- **Drift detectors** — `program-fact-drift`, `change-signals`, `card-bonus-signals`, a good_to_know
  welcome-bonus audit, a `refresh-queue`. **Limitation: these mostly detect drift by fuzzy
  text-matching, not by re-reading the official source** — which is why a stale transfer ratio slipped
  through recently.
- **`verifyAlertDraft.ts`** — already uses Claude to **extract every factual claim** in an alert draft
  and mark each **supported/unsupported** with a severity flag, at draft time. **BUT the results are
  not persisted:** the `fact_check_results` column exists and is **empty on all 105 published pieces**.
- **Skills** (packaged workflows): `facebook-post`, `instagram-post`, `add-airline` (authors program
  pages from official sources), `card-companion` (generates fillable benefit-checklist PDFs).
- **Other monitors that partly exist:** transfer-bonus monitor, schedule-open watcher, experiences
  directory + sold-out detection, a content roadmap + admin.

## 4. The architecture (the key idea)

~21 agent ideas collapse to **~10 systems around one shared substrate**:

> **The Verification Engine + Fact Ledger:** for any claim → find its official source → produce a
> verdict + a verified-date → write it to a per-piece **fact ledger** (populate the existing
> `fact_check_results`). Most "agents" are just **triggers or consumers** of this one engine.

Three foundational pieces:
- **A. Verification Engine + Fact Ledger** — the substrate above. Powers both a **pre-publish gate**
  (block any unsourced claim) and a **scheduled re-verify** (catch drift on already-published facts).
- **B. In-session verify-before-assert guardrail** — the behavioral/root-cause fix (see 5·G0).
- **C. `/admin/agents` dashboard** — a control center: agent roster (status, last/next run, health),
  a unified **findings inbox** (everything agents surface, approved/dismissed inline), and run
  controls. It **consolidates today's scattered admin queues** (triage, change-signals, program-drift,
  refresh-queue) into one place. Every agent action carries its source, tying back to the ledger.

## 5. The agents (grouped by system)

**Group A — Accuracy core (the engine + its triggers):**
- **A1. Accuracy Agent** — persist `verifyAlertDraft` output into the fact ledger; add a **publish gate**
  that blocks HIGH-severity unsourced claims; **backfill the 105 existing published pieces**.
- **A2. Drift / Page-Freshness Re-verifier** — the engine **on a schedule**: re-reads the *official*
  page for each time-sensitive claim (transfer ratios, signup bonuses, lounge/partner/benefit rules)
  and flags what actually changed. Upgrades the existing fuzzy drift detectors. *(Merges two earlier
  ideas: "Drift Re-verifier" + "Page-Freshness".)*
- **A3. Deal Verifier** — promo-specialized pre-publish check (dates, spend, US eligibility, strip
  foreign-currency valuations). **Folds into A1**, not a separate build.
- **G0. In-session verify-before-assert guardrail** — forces any correction / negative / "this changed"
  claim to hit the DB or official source **before it is stated in chat**. This is the actual root-cause
  fix and (per the first review) the single most valuable item; it's *not* a publish gate.

**Group B — Intake / throughput:**
- **B1. Intel Triage Agent** — auto-collapse benefits-email fan-outs, flag dupes/re-forwards, bucket
  non-US/recurring, surface real publish candidates. *(Extends existing dedup/triage.)*
- **B2. Watchers (merge)** — schedule-open + transfer-bonus + award-availability. All "watch external
  state → draft an alert." Mostly already exist; extend, don't rebuild. Must **stop at draft**.
- **B3. Chain-Finder** *(demoted from earlier top-5)* — scans intel/content for "perk chains" (one
  benefit unlocks another) for a specific guide. Content nicety, low leverage.

**Group C — Content production:**
- **C1. Sweet Spot Agent** — cross-references award charts, transfer ratios, and live cash-vs-points
  pricing to surface high-value redemptions; drafts the sweet-spot alert/guide; flags when a new sweet
  spot opens or a devaluation kills one. **Sweet-spot content is the site's best-performing evergreen
  format.** Rides entirely on the Accuracy engine for sourcing.
- **C2. Program/Card Authoring Agent** — drafts new reference pages from official sources. *(Extends
  the `add-airline` skill.)*
- **C3. Experiences & Sweepstakes Curator** — reviews new listings, flags alert-worthy ones, scrapes
  per-platform images, maintains directories + sold-out detection.
- **C4. Lead-Magnet Agent** — generates the per-card benefit-checklist PDFs + other opt-in magnets.
  *(Extends `card-companion`.)*

**Group D — Distribution / growth:**
- **D1. Newsletter Agent** — assembles the biweekly issue from *verified* alerts + parked items +
  recurring tips, respecting cadence + no-repeat. *(Promoted — retention asset, compounds with accuracy.)*
- **D2. Social Agent** — daily best-content pick + FB/IG drafts in brand voice.
- **D3. SEO / Content-Gap Agent** — finds uncovered search demand + internal-linking gaps; feeds roadmap.
- **D4. Monetization / Affiliate Agent** — surface referral/affiliate placements, track what converts.
- **D5. Competitive / Rank-Watch Agent** — monitor competitors + our search rankings; flag missed stories.

**Group E — Hygiene / ops:**
- **E1. Site-Health Agent** *(promoted)* — broken links, 404s, lingering expired-offer pages,
  date-guard leaks, mobile-layout regressions. Cheap; protects the "we're accurate" trust.
- **E2. Subscriber Health / Bot-Audit** — list hygiene, deliverability, engagement segments.
- **E3. FTC / Affiliate-Disclosure Linter** *(new, from review)* — verify required disclosure is
  present wherever we add referral/affiliate links. Legal-risk reduction.
- **E4. Correction / Erratum Workflow** *(new, from review)* — a defined fast fix-and-note path when
  drift or re-verify finds a live error. Trust is built on correcting fast, not just detecting.

**Deferred (real risk):**
- **On-site Q&A chatbot** — hallucination risk directly contradicts the accuracy brand. Only ever
  strictly extractive with citations to our own verified pages.
- **Reddit / forum redemption miner** — Reddit ToS/API cost + anecdotal, frequently-wrong data. If
  built, read-only, and treat everything as **leads to verify, never facts**.

## 6. Build order (v1 — SUPERSEDED by the "Final build order" in the v2 block above; note the source-canonicalization layer now precedes A2)

- **Phase 1 — Accuracy foundation:** A1 Fact Ledger + publish gate + backfill the 105; G0 in-session
  guardrail; C the `/admin/agents` dashboard shell (so A1's findings have a home).
- **Phase 2 — Reuse the engine + cut toil:** A2 Scheduled Re-verifier (drift/page-freshness); B1 Intel
  Triage; C1 Sweet Spot Agent.
- **Phase 3 — Output + growth:** D1 Newsletter; D2 Social; C3 Curator; E1 Site-Health.
- **Ongoing / later:** B2 watchers (extend existing), C2/C4 authoring + magnets, D3/D4/D5 growth,
  E2/E3/E4 hygiene. **Deferred:** chatbot, Reddit miner.

## 7. Known risks / open questions (ANSWERED — resolutions are in the v2 + v3 blocks above)

1. **Issuer-page scraping is the hardest, load-bearing tech** (A2, and the freshness half of A1). Bank
   pages are JS-heavy, anti-bot/geo-gated, and offers are **targeted/personalized + A/B-tested**, so a
   scrape can show *false* drift. Plan: use a scraping API already in-stack, and treat every scrape as a
   **candidate needing human confirm — never auto-publish**. Is there a better approach?
2. **The in-session guardrail (G0)** is about *assistant behavior in chat*, not a code path. How would
   you actually enforce "verify before you assert a correction"? (Prompt/rule only? A tool the assistant
   must call? A checklist gate?)
3. **Backfilling 105 pieces** — batch LLM re-verification vs. manual? How to keep cost/accuracy sane?
4. **Over-consolidation risk** — is folding A2/A3 into one engine going to make it a monolith that's hard
   to change?
5. **What are we missing?**
