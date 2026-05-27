-- Facts Ledger Phase 1 — program_facts table.
--
-- Replaces today's conversational fact-checking pattern with a structured
-- ledger of atomic verified claims per program. Each fact has:
--   - claim_text: the assertion
--   - verdict: verified | needs_clarification | incorrect
--   - risk_level: high | medium | low
--   - sources: jsonb array of { url, publication_date, snippet, why_chosen? }
--   - disposition: editor's decision (auto_locked, kept, reworded, etc.)
--   - prior_version_id: link to predecessor for drift history
--
-- Full design + 4-phase roadmap at plans/facts-ledger.md.
-- Top-level memory: ~/.claude/.../memory/project_facts_ledger.md.
--
-- Phase 1 ships this table + scripts/factcheck-program.mjs + per-program
-- Facts tab in admin. Phases 2-4 layer in AI drafting from ledger,
-- one-button publish, and weekly drift detection.

create table if not exists program_facts (
  id                     uuid primary key default gen_random_uuid(),

  -- The program this fact is about. Stored by slug (not FK) so the ledger
  -- survives program-row renames + supports facts referencing programs that
  -- haven't been seeded yet.
  program_slug           text not null,

  -- The atomic factual claim, written as a single declarative sentence.
  -- Example: "Diamond status qualifies at 50 nights, 25 stays, or $11,500 USD spend"
  claim_text             text not null,

  -- Optional category tag to group claims for UI filtering.
  -- Examples: tier_threshold, transfer_ratio, fnr_rule, earn_rate, partnership,
  -- expiry_policy, welcome_bonus, lounge_access, etc.
  category               text,

  -- Verification verdict from the 5-tier rule (see plans/facts-ledger.md):
  --   verified           - Tier 1 (1 official source) or Tier 2 (no official + 2+ blogs)
  --   needs_clarification - Tier 3 (single blog) or Tier 4 (sources disagree)
  --   incorrect          - Tier 5 (no source found; likely training data)
  verdict                text not null
    check (verdict in ('verified', 'needs_clarification', 'incorrect')),

  -- Editor priority. Drives default expansion in admin + drift email weight.
  --   high   - affects booking math / money / points / dates / eligibility
  --   medium - affects strategy framing (which card, when to transfer)
  --   low    - tone, phrasing, secondary context
  risk_level             text not null
    check (risk_level in ('high', 'medium', 'low')),

  -- Source citations. Array of objects:
  --   { url, publication_date, snippet, why_chosen?, is_official? }
  -- Sources are deduped by domain. Trusted-blog allowlist enforced in script.
  sources                jsonb not null default '[]'::jsonb,

  -- True when verdict is verified via Tier 2 (official source 404/silent +
  -- 2+ blogs agreeing). Surfaced in admin UI so editor knows the audit trail
  -- has no official backing.
  third_party_fallback   boolean not null default false,

  -- Editor disposition. Verified facts default to auto_locked.
  -- needs_clarification + incorrect require editor action.
  --   auto_locked - Tier 1/2 verified, no review needed
  --   kept        - editor reviewed + accepted as-is
  --   reworded    - editor adjusted claim_text
  --   removed     - editor removed from public prose
  --   deferred    - flagged for later, not blocking publish
  disposition            text
    check (disposition in ('auto_locked', 'kept', 'reworded', 'removed', 'deferred')),

  -- When editor overrides default behavior (e.g. keeps an incorrect fact for
  -- historical context), this captures why. Mirrors content_ideas.override_reason.
  override_reason        text,

  -- When this fact was last re-checked (for drift detection cadence).
  reviewed_at            timestamptz not null default now(),

  -- Optional: who reviewed (email or 'system' for cron-run re-verifications).
  reviewed_by            text,

  -- Free-text context about the program's state at review time.
  -- Example: "Post-2026 Diamond Reserve launch; rollover nights ended"
  program_state_context  text,

  -- For drift history: when this fact supersedes a prior version, link back.
  -- Lets us reconstruct "this fact was X on date Y, then Z on date W".
  prior_version_id       uuid references program_facts(id),

  -- When a newer version of this fact replaces this row, mark when.
  -- Active facts have superseded_at IS NULL.
  superseded_at          timestamptz,

  created_at             timestamptz not null default now()
);

-- Most queries filter by program + active state (not superseded).
create index if not exists program_facts_slug_active_idx
  on program_facts (program_slug, superseded_at);

-- Admin Facts tab filters by verdict + risk to triage.
create index if not exists program_facts_verdict_risk_idx
  on program_facts (verdict, risk_level)
  where superseded_at is null;

-- Weekly cron picks facts due for re-verification based on reviewed_at +
-- risk_level cadence (HIGH weekly, MEDIUM biweekly, LOW monthly).
create index if not exists program_facts_drift_check_idx
  on program_facts (reviewed_at, risk_level)
  where superseded_at is null;

-- Drift history reverse-lookup (find all prior versions of a fact).
create index if not exists program_facts_prior_version_idx
  on program_facts (prior_version_id)
  where prior_version_id is not null;

-- Service-role-only RLS. Admin pages read via createAdminClient().
alter table program_facts enable row level security;
drop policy if exists "program_facts admin only" on program_facts;
create policy "program_facts admin only"
  on program_facts for select to authenticated using (true);

comment on table program_facts is
  'Atomic verified factual claims per program. Source of truth for prose-fact linkage + drift detection. See plans/facts-ledger.md for full design + 4-phase roadmap.';

comment on column program_facts.verdict is
  'Verification verdict per 5-tier rule. verified = Tier 1/2; needs_clarification = Tier 3/4; incorrect = Tier 5.';

comment on column program_facts.risk_level is
  'Editor priority. high = affects booking math/money/dates; medium = strategy framing; low = tone/phrasing.';

comment on column program_facts.prior_version_id is
  'When a newer fact supersedes this one, link back to predecessor for drift history reconstruction.';

comment on column program_facts.superseded_at is
  'NULL = currently active. Set when a newer fact supersedes this row during weekly drift re-verification.';
