-- Writer redesign — Phase 3 & 4 schema additions for the new gated alert
-- pipeline (T&C gate + voice gate + override audit log).
--
-- Plan reference: plans/writer-redesign.md
--
-- What this adds:
--   alerts.terms_waived_reason  — text logged when admin skips T&Cs intentionally
--   alerts.voice_score          — 1..5 score from voiceCheckDraft
--   alerts.voice_lead_mode      — 'A' | 'B' | 'C' | 'none' opener mode detected
--   alerts.context_loaded_at    — timestamp when buildExtraContext last ran for
--                                 the alert (debugging signal)
--   alert_overrides             — audit log of every gate override + reason
--
-- Existing alerts columns reused:
--   alerts.verified_terms    (migration 070) — admin-pasted authoritative T&Cs
--   alerts.voice_pass        — boolean: did the voice gate pass on the last run?
--   alerts.voice_notes       — text: structured failure details (banned phrases,
--                              em-dash count, hyphen-pause count, issues list)
--   alerts.voice_checked_at  — timestamptz of last voice check

alter table alerts
  add column if not exists terms_waived_reason text,
  add column if not exists voice_score smallint check (voice_score between 1 and 5),
  add column if not exists voice_lead_mode text check (voice_lead_mode in ('A','B','C','none')),
  add column if not exists context_loaded_at timestamptz;

comment on column alerts.terms_waived_reason is
  'Admin reason for shipping without verified_terms (e.g. "developing — terms not yet public"). Surfaced on the public alert as a "terms unverified" badge.';
comment on column alerts.voice_score is
  'Voice-gate score from voiceCheckDraft (1=pure AI, 5=nails persona). Pass threshold: >= 4. Companion to existing voice_pass boolean.';
comment on column alerts.voice_lead_mode is
  'Lead opener mode detected in summary: A=stakes, B=visual, C=punchy, none=AI/press-release.';
comment on column alerts.context_loaded_at is
  'Timestamp of last buildExtraContext run for this alert. Debug signal — should be near every writer run.';

-- Override audit log — every time admin bypasses a gate (T&Cs, fact-check,
-- voice) they leave a written reason. Overrides are always allowed; they
-- must always be intentional and traceable.
create table if not exists alert_overrides (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(id) on delete cascade,
  gate text not null check (gate in ('tnc', 'factcheck', 'voice')),
  reason text not null check (length(trim(reason)) > 0),
  overridden_by text,
  overridden_at timestamptz not null default now()
);

create index if not exists alert_overrides_alert_id_idx on alert_overrides(alert_id);
create index if not exists alert_overrides_overridden_at_idx on alert_overrides(overridden_at desc);

comment on table alert_overrides is
  'Audit log of admin gate-bypass actions. Every override (T&Cs, fact-check, voice) records gate + reason. Surfaces on alert audit-log view.';
