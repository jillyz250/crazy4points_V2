# Writer & Alert Pipeline Redesign

**Status:** Draft · 2026-05-14
**Owner:** Jill
**Problem:** Generated alerts come out flavorless, miss program sweet spots, and ship without verified T&Cs. The Flying Blue 45% buy-miles alert exposed the failure: Scout captured the headline, writer was called blind (no program context), no T&C gate, no voice gate — straight to publish-ready with zero personality.

---

## Root cause (one paragraph)

The current pipeline is opt-in to quality. Scout → writer → admin publish is the happy path; every quality lever (program context injection, fact-check chips, verified T&Cs, voice editor pass) only activates if a human clicks the right button. The writer is called blind on the first draft and only sees `programs.sweet_spots` / `quirks` / `how_to_spend` if an admin clicks "Regenerate." `verified_terms` is an optional field nobody fills. Voice rules exist in `editorialRules.ts` but aren't enforced as a gate. Net effect: alerts ship lazy.

---

## Target pipeline (7 stages)

```
1. Triage           → Scout creates intel entry with proposed headline; no draft yet
2. T&C gate         → Paste verified terms OR waive with reason (logged)
3. Context load     → Auto-pull program sweet_spots, quirks, related active alerts
4. Generate         → Writer reads persona file first, then T&Cs, then context
5. Fact-check       → HIGH chips block publish unless overridden with reason
6. Voice check      → Haiku scores against persona; auto-rewrites once if score < 4
7. Review & publish → Three green gates (T&Cs · Facts · Voice); override always available, always logged
```

Each stage is a real gate, not a warning. Overrides are always allowed but always logged with a written reason — intentional, not accidental.

---

## Stage detail

### Stage 1 — Triage
- Scout RSS/Firecrawl/Reddit runs unchanged, produces `ScoutFinding[]`.
- Findings become **intel entries** (not draft alerts) with: `proposed_headline`, `proposed_alert_type`, `programs[]`, `source_url`, `raw_text`, `confidence`, `status='intel'`.
- Admin sees the proposed headline first. Decides: **Promote** (move to Stage 2), **Kill**, or **Snooze**.
- Killed/snoozed entries stay in the intel table for audit.

### Stage 2 — T&C gate
- Required for: `transfer_bonus`, `buy_miles`, `status_promo`, `award_availability`, `limited_time_offer`.
- Optional for: `devaluation`, `partner_change`, `category_change`, `policy_change`, `program_change`, `earn_rate_change`.
- Admin pastes:
  - `verified_terms_text` (the actual official T&C copy), OR
  - `verified_terms_url` (which the system can fetch and store at promote time)
- Override path: leave both blank, fill `terms_waived_reason` (free text, required). Override flags the alert with a "developing — terms unverified" badge throughout.
- Generation blocked until field state is valid.

### Stage 3 — Context load (automatic, no admin action)
- On promote, system pulls for every linked program:
  - `programs.sweet_spots`, `quirks`, `how_to_spend`, `tier_benefits`, `transfer_partners`
  - Top 3 active `partner_redemptions` rows
  - Concurrent active alerts on the same program (e.g. "Chase UR → Flying Blue 20% running until May 27" — surfaces cross-pollination opportunities)
  - Alliance context if program has alliance
- All packaged into `context_bundle` field on the alert.
- `context_loaded_at` timestamp set.

### Stage 4 — Generate
- Writer prompt construction:
  1. **Persona file** — `utils/ai/personas/c4p-writer.md` (read first, top of prompt)
  2. **T&Cs** — verified terms text/URL content
  3. **Context bundle** — program sweet spots, quirks, related alerts
  4. **Raw text** — Scout-captured source content
  5. **Recent samples** — 3 most-recent published alerts of same type (for shape/cadence reference)
  6. **Alert-type rules** — type-specific structure (promo bullets, deval before/after, etc.)
- Writer must produce: `title`, `summary` (opener + outro paragraphs around bullets), `description` bullets, `gaps[]` (any unfilled required fields).

### Stage 5 — Fact-check
- Existing `verifyAlertDraft` runs unchanged on output.
- Returns: chips array with `severity`, `claim`, `evidence`, `status`.
- **Gate behavior:** Every HIGH-severity chip must be in one of three states before publish:
  - **Resolved** — admin cites supporting source (T&C line, official URL, DB field)
  - **Stripped** — admin removes the claim from the draft
  - **Overridden** — admin writes a reason; logged to `alert_overrides`

### Stage 6 — Voice check (Haiku)
- New file: `utils/ai/voiceCheckDraft.ts`
- Reads persona file + draft.
- Returns:
  ```ts
  {
    score: 1 | 2 | 3 | 4 | 5,
    lead_mode_detected: 'A' | 'B' | 'C' | 'none',
    banned_phrases_found: string[],
    em_dash_count: number,
    hyphen_pause_count: number,
    issues: string[],
    sounds_like_ai: boolean
  }
  ```
- Pass threshold: `score >= 4` AND `banned_phrases_found.length === 0` AND `hyphen_pause_count === 0` AND `sounds_like_ai === false`.
- If fail: auto-rewrite once with issues fed back to writer. If still fail: kick to admin with issues highlighted.
- Cost: ~$0.001 per alert. ~1s latency.

### Stage 7 — Review & publish
- Admin UI shows three gates as colored badges: **T&Cs · Facts · Voice**
- All three green = Publish button enabled
- Any red = Publish button disabled, but **Override & Publish** button available (requires reason, logged)
- Override reasons rendered on the alert's audit-log view

---

## Schema changes

```sql
-- New alert fields
ALTER TABLE alerts
  ADD COLUMN verified_terms_text text,
  ADD COLUMN verified_terms_url text,
  ADD COLUMN terms_waived_reason text,
  ADD COLUMN context_bundle jsonb,
  ADD COLUMN context_loaded_at timestamptz,
  ADD COLUMN voice_score smallint,
  ADD COLUMN voice_check_passed boolean,
  ADD COLUMN voice_check_issues jsonb,
  ADD COLUMN voice_lead_mode text;

-- Audit log for overrides
CREATE TABLE alert_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  gate text NOT NULL CHECK (gate IN ('tnc', 'factcheck', 'voice')),
  reason text NOT NULL,
  overridden_by text,
  overridden_at timestamptz NOT NULL DEFAULT now()
);

-- Intel status state machine
-- Existing alerts.status enum likely needs: 'intel' added before 'pending_review'
-- (or use a new intel table — see Open Questions)
```

---

## Information architecture cleanup

**Today's confusion:** intel / blog / news / alerts / newsletter — too many overlapping concepts.

**New model:**

| Concept | What it is | Where it lives |
|---|---|---|
| **Intel** | Scout findings + proposed alerts in any pre-published state (raw, reviewing, promoted, draft) | Single admin tab with status filter |
| **Published** | Live public alerts of any type (transfer_bonus, devaluation, partner_change, etc.) | Admin tab + public site |
| **Newsletter** | (Unchanged for now) | Existing pages |

**Killed concepts:** "blog" and "news" as separate content types. Everything public is an alert with a `type` field. If an alert needs long-form treatment, it's just a longer alert.

**Admin nav becomes:**
- **Intel** (combined: raw scout findings + triage + drafts; status filter at top)
- **Published**
- **Newsletter** (untouched)
- **Programs** (unchanged)
- **Sources** (unchanged)

---

## Rollout — 5 phases

### Phase 1 — Persona + auto context load (biggest immediate win)
**Effort:** ~3 hours
- Persona file already saved at [utils/ai/personas/c4p-writer.md](utils/ai/personas/c4p-writer.md)
- Inject persona into writer prompt as first system message
- Move `buildProgramContext` call so it runs on **every** generation, not just regeneration
- No schema change required
- **Outcome:** New alerts have voice + program context on first draft. Fixes the #1 failure.

### Phase 2 — Voice check Haiku pass
**Effort:** ~4 hours
- Build `utils/ai/voiceCheckDraft.ts`
- Add `voice_score`, `voice_check_passed`, `voice_check_issues`, `voice_lead_mode` columns
- Wire into write pipeline after `editAlertDraft`
- Auto-rewrite once on fail
- **Outcome:** Drafts that miss voice get caught and rewritten before admin sees them.

### Phase 3 — T&C gate + Intel state machine
**Effort:** ~6 hours
- Schema migration: new alert fields + `alert_overrides` table
- Update Scout to write intel entries (status='intel') instead of pending_review alerts
- Admin UI: triage view with proposed headlines, promote/kill/snooze actions
- T&C paste/URL flow with required-fields validation
- Override path with reason logging
- **Outcome:** You see headlines first and explicitly opt into generation with verified terms.

### Phase 4 — Fact-check gate + publish enforcement
**Effort:** ~3 hours
- Update publishAlertAction to check all three gates
- Override path with reason logging
- Admin UI: three-badge status row, Override & Publish button
- **Outcome:** Lazy publishes blocked. Overrides explicit and logged.

### Phase 5 — IA cleanup + backfill
**Effort:** ~4 hours
- Admin nav rename: Intel / Published / Newsletter / Programs / Sources
- Kill "blog" and "news" routes if present
- Backfill script: re-run every `pending_review` alert through Stages 3–6
- **Outcome:** Cleaner mental model. All in-flight alerts upgraded to new voice.

**Total estimated effort:** ~20 hours across 5 PRs.

---

## What stays unchanged

- Newsletter system (per Jill's call — out of scope)
- Scout RSS/Firecrawl/Reddit ingestion mechanics
- Public alert page rendering (`app/(site)/alerts/[slug]`)
- Existing fact-checker (`verifyAlertDraft`) — only its enforcement changes
- Programs system and admin
- All non-alert content (programs, sources, destinations)

---

## Open questions

1. **Intel as new table or alerts.status='intel'?**
   Cleaner separation = new `intel` table. Less migration work = status enum extension. My lean: new table; alerts table stays clean and only holds things headed for publish.

2. **Override threshold for voice check.** Should overrides require admin-only privilege, or anyone with write access? (Probably moot — solo system today.)

3. **Backfill behavior.** Re-run all 100+ pending_review alerts, or only the most recent N? Heavy regenerate = real Anthropic API spend. My lean: backfill last 30 days, archive the rest.

4. **Voice check on articles (not just alerts).** Articles are longer; the voice check rubric may need a different scoring approach. Treat as Phase 2.5 or defer to a later iteration.

---

## Success criteria

After this ships:
- An alert about a Flying Blue 45% buy-miles sale auto-loads the Mumbai 63,750 business sweet spot, the Paris/Amsterdam free-stopover quirk, and the concurrent Chase UR 20% bonus — without any human intervention.
- The first draft already sounds like the persona; voice check confirms it or rewrites once.
- The alert can't ship until T&Cs are pasted (or explicitly waived with a reason).
- "Where's the personality?" stops being a question.
