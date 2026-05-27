# Three-Layer Knowledge Graph — Full Design Spec

Authored 2026-05-27 after Phase 2c of the facts ledger shipped. Validated through two rounds of Copilot feedback (both confirmed the architecture as the correct long-term foundation).

Memory entry: `~/.claude/projects/.../memory/project_three_layer_knowledge_graph.md`

## Audit-locked phase summary (2026-05-27)

| Phase | Scope | Estimate |
|---|---|---|
| **A** | sweet_spots: table + 8 schema fixes + Haiku backfill (default `is_active=false`) + dual-path render + cross-program reverse lookup + structured CRUD + paste-markdown escape hatch + draft-program integration | **8-10 hrs** |
| **A.5** | Citation tracking wired into blog/alert/newsletter publish paths + orphan cleanup script | 3-4 hrs |
| **B1** | quirks structuring | **3-4 hrs (OPTIONAL — consider skipping)** |
| **B2** | lounge_access structuring (matrix-shaped, most complex) | 5-6 hrs |
| **B3** | how_to_spend structuring | 3-4 hrs |
| **C** | Drift propagation (extend facts-ledger Phase 4 cron to walk citation graph) | 3 hrs |
| **D1+** | Cross-program UI features (Sweet Spot of the Week, comparison, etc.) | 4-6 hrs per feature |

**Realistic total to ship the foundation (A through C):** 25-30 hrs.
**With first cross-program UI feature (D1):** 30-35 hrs.

Phase A schema is audit-locked below. 8 schema fixes baked in. Cross-program
authority rule (currency owns, partner reverse-queries) baked in. Paste-markdown
admin escape hatch baked in. Backfill default `is_active=false` baked in.
90-day deprecation deadline for prose fallback baked in.

---

## The shift

From "CMS with prose fields" → "knowledge graph with three layers of citation."

Today: sweet_spots, quirks, lounge_access, how_to_spend are markdown blobs in `programs` table. They look like content but they're structured data pretending to be prose. Result: can't query, can't reuse, can't diff, can't cite cleanly from blogs.

Tomorrow: same data exists as first-class entities with stable IDs. Blogs/alerts cite by ID. Drift propagates through citation graph.

---

## The three layers

```
┌──────────────────────────────────────────────────────────┐
│ LAYER 3: Narratives                                       │
│ - blogs (content_ideas where type='blog')                 │
│ - alerts                                                  │
│ - newsletter sections                                     │
│ - social posts (drafts)                                   │
│                                                            │
│ Cite layer 2 (sweet spots) and layer 1 (facts) by UUID.  │
│ When a cited entity drifts, narrative is flagged stale.   │
└──────────────────────────────────────────────────────────┘
                            ▲
                       cites│
                            │
┌──────────────────────────────────────────────────────────┐
│ LAYER 2: Compositions (OWNED BY PROGRAM)                  │
│ - program_sweet_spots                                     │
│ - program_quirks (Phase B)                                │
│ - program_lounge_access_rules (Phase B)                   │
│ - program_redemption_types (Phase B)                      │
│                                                            │
│ Each row has UUID + cites layer 1 facts by fact_ids[].    │
│ Authority: lives with the program. Blogs reference.       │
└──────────────────────────────────────────────────────────┘
                            ▲
                       cites│
                            │
┌──────────────────────────────────────────────────────────┐
│ LAYER 1: Facts Ledger (already shipped Phase 1 + 2)       │
│ - program_facts                                           │
│                                                            │
│ Atomic verified claims with sources + drift detection.    │
└──────────────────────────────────────────────────────────┘
```

Properties of every layer:
- Stable UUID primary keys
- Cites the layer below (by UUID array or join table)
- Drift detection — when a cited entity changes, citing entity is flagged
- No cycles. No shared ownership. No duplication.

---

## Authority model

**Programs own layer 2 entities.** Blogs and alerts CITE them.

Concrete: when a blog about a 20% Amex→Hilton transfer bonus needs to suggest a redemption:
1. Blog queries `program_sweet_spots WHERE program_slug='hilton' AND 'amex' = ANY(applies_to_transfers_from)` ORDER BY cpp_estimate DESC LIMIT 3
2. Blog picks one and cites by UUID
3. Citation written to `content_sweet_spot_citations`
4. If the cited sweet spot's underlying fact drifts later, the blog is flagged in admin

This eliminates:
- Duplication (12 blogs each fabricating their own "Hilton Cancun all-inclusive" reference)
- Divergence (each blog drifts independently as facts change)
- LLM hallucination risk (no AI synthesizing redemptions on the fly)
- Stale examples (single source of truth)

---

## Phase A — program_sweet_spots (~8-10 hrs realistic)

> **Audit verdict (2026-05-27):** original estimate of 6-7 hrs was optimistic.
> Realistic with all 8 schema fixes + cross-program reverse-lookup + paste-markdown
> admin path baked in from day 1 is 8-10 hrs. Don't underscope this.

### Migration: `program_sweet_spots` (audit-locked v2)

Changes from original draft: add `points_cost_type` enum, `expires_at`,
`partner_slugs` (plural), `created_by` + `updated_by`, `display_image_url`.

```sql
create type sweet_spot_points_cost_type as enum ('fixed', 'range', 'starts_at', 'dynamic');

create table program_sweet_spots (
  id                          uuid primary key default gen_random_uuid(),
  program_slug                text not null,
  title                       text not null,                            -- "Hilton Cancun all-inclusive"
  points_cost_type            sweet_spot_points_cost_type not null,     -- AUDIT FIX #1
  points_cost_text            text,                                     -- display string ("80K-130K pts/night")
  points_cost_low             integer,                                  -- nullable for 'dynamic' or 'starts_at'
  points_cost_high            integer,                                  -- nullable for 'dynamic' or 'starts_at'
  cpp_estimate                numeric(4,2),                             -- 0.65 = 0.65 cents per point
  cash_value_ref              text,                                     -- "$650+/night" — comparable rate
  description                 text not null,                            -- 1-3 sentence why-it-matters
  tags                        text[] default '{}',                      -- AUDIT FIX #2: controlled vocab needed (see below)
  applies_to_transfers_from   jsonb default '[]'::jsonb,                -- AUDIT FIX #3: was text[], now [{from_slug, optimal_when_bonus_active?}]
  partner_slugs               text[] default '{}',                      -- AUDIT FIX #7: was singular, multi-partner sweet spots exist
  fact_ids                    uuid[] default '{}',                      -- links to program_facts rows
  is_active                   boolean not null default false,           -- AUDIT FIX (Risk 2): default false; backfill rows need editor review
  display_order               integer default 0,
  display_image_url           text,                                     -- AUDIT FIX #8: for future image-rich rendering
  expires_at                  timestamptz,                              -- AUDIT FIX #5: temporary sweet spots (during bonus periods)
  verified_at                 timestamptz not null default now(),
  superseded_at               timestamptz,
  prior_version_id            uuid references program_sweet_spots(id),
  created_by                  text,                                     -- AUDIT FIX #6: editorial provenance
  updated_by                  text,                                     -- AUDIT FIX #6
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index program_sweet_spots_program_idx on program_sweet_spots (program_slug, superseded_at);
create index program_sweet_spots_active_idx on program_sweet_spots (is_active, program_slug)
  where superseded_at is null;
create index program_sweet_spots_partner_idx on program_sweet_spots using gin (partner_slugs);
create index program_sweet_spots_tags_idx on program_sweet_spots using gin (tags);
create index program_sweet_spots_facts_idx on program_sweet_spots using gin (fact_ids);
create index program_sweet_spots_expires_idx on program_sweet_spots (expires_at)
  where expires_at is not null and superseded_at is null;
```

### Controlled tag vocabulary (AUDIT FIX #2)

Either a separate `sweet_spot_tag_options` lookup table OR an autocomplete UI
backed by `SELECT DISTINCT unnest(tags) FROM program_sweet_spots`. Pick at
Phase A build time. Without this, tag drift kills queryability within 10 programs.

### Migration: `content_sweet_spot_citations`

```sql
create table content_sweet_spot_citations (
  id              uuid primary key default gen_random_uuid(),
  content_type    text not null check (content_type in ('blog', 'alert', 'newsletter', 'social')),
  content_id      uuid not null,  -- intentionally not FK'd — content lives in different tables
  sweet_spot_id   uuid not null references program_sweet_spots(id) on delete cascade,
  cited_at        timestamptz not null default now()
);

create index content_citations_sweet_spot_idx on content_sweet_spot_citations (sweet_spot_id);
create index content_citations_content_idx on content_sweet_spot_citations (content_type, content_id);
```

### One-off backfill script

`scripts/migrate-sweet-spots-to-structured.mjs`
- For each program with `programs.sweet_spots` non-empty:
- Send the markdown to Haiku with a structured-extraction prompt
- Parse response → array of sweet-spot objects
- Insert into `program_sweet_spots`
- Mark original prose with a `_migrated_at_` marker so we know not to re-migrate

Expected cost: ~$0.30 across all ~30 programs with sweet_spots.

### Cross-program authority + reverse lookup (AUDIT LOCK-IN)

**Ownership rule (locked):** sweet spots are owned by the CURRENCY program (the
program whose points are spent). Example: "ANA business class via Virgin Atlantic
Flying Club" lives on Virgin's program page, with `partner_slugs = ['ana']`.

**Visibility rule:** Public render on BOTH owner + partner program pages.

Render query for any program page:
```sql
SELECT * FROM program_sweet_spots
WHERE (program_slug = $slug OR $slug = ANY(partner_slugs))
  AND is_active = true
  AND superseded_at IS NULL
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY display_order, cpp_estimate DESC NULLS LAST;
```

UI groups results: "From {slug}'s own program" + "From partner currencies".

This MUST be implemented in Phase A render, not deferred.

### Public render update (with dual-path deprecation deadline)

`app/(site)/programs/[slug]/page.tsx` and any sweet-spot-rendering component:
- Use the cross-program query above to fetch structured rows
- If non-empty: render from structured (newer path)
- Else: fall back to `programs.sweet_spots` markdown (legacy path)

**Deprecation deadline:** 90 days post-Phase-A-merge. All programs migrated to
structured, prose fallback path + `programs.sweet_spots` column DROPPED. Set
the deadline in a calendar reminder OR memory note. Without a deadline, the
dual path lingers indefinitely (AUDIT RISK #3).

### Admin editor (with paste-markdown escape hatch)

`app/admin/(protected)/programs/[slug]/edit/page.tsx`:

**Path 1 — Structured CRUD list (primary):**
- Per sweet spot row: inline form (title, points_cost_type, low/high/text, cpp,
  description, tags autocomplete, applies_to_transfers_from JSONB form,
  partner_slugs multiselect, expires_at date picker, fact_ids picker)
- Add/remove/reorder buttons
- "+ New sweet spot" at bottom
- Each row links to `/admin/programs/[slug]/sweet-spots/[uuid]` for deep edit

**Path 2 — "Paste raw markdown" escape hatch (AUDIT FIX Risk #1 mitigation):**
- Modal/expandable section: "Paste markdown bullets here, Haiku will parse them"
- User pastes markdown → preview shows parsed structured rows → user confirms or edits → save
- This keeps markdown's authoring speed for editors who prefer it
- Without this, editor adoption fails and structured data degrades

### Update `draft-program.mjs`

When drafting `sweet_spots` (Phase 2b):
- Write to `program_sweet_spots` table (not back to `programs.sweet_spots` prose)
- Populate `fact_ids` from the verified facts used in the prompt
- Optionally generate `programs.sweet_spots` as a rendered prose summary for the legacy fallback path

---

## Phase A.5 — Citation tracking (~2 hrs, with Phase A)

Wire `content_sweet_spot_citations` writes into:
- Blog publish action (`updateContentIdeaStatusAction` when status → published)
- Alert publish action
- Newsletter compose flow

Add admin reverse-query: per sweet spot, show "Cited in: 3 blogs · 1 alert" with links.

---

## Phase B — Other prose fields (~12-14 hrs total across 3 sub-phases)

**AUDIT VERDICT:** Lumping these together was wrong. Each is a separate phase
with different complexity. Phase B1 (quirks) may not be worth doing at all.

### Phase B1 — quirks structuring (~3-4 hrs) — **OPTIONAL, CONSIDER SKIPPING**

Quirks have low re-use (mostly per-program informational) and low drift
sensitivity. Structuring adds admin friction without unlocking much value
for blogs/alerts. Recommendation: leave as prose unless a specific use case
emerges that needs structured quirks.

### Phase B2 — lounge_access structuring (~5-6 hrs)

Most complex sub-phase. Schema must capture:
- `tier` (Silver / Gold / Diamond etc.)
- `lounge_type` (Executive Lounge / alliance partner / paid)
- `eligibility` (rules for guests, fare class exclusions, etc.)
- `paid_options` (day pass cost, eligibility rules)
- Matrix-shaped: one tier might have access to multiple lounge types with
  different rules per type.

### Phase B3 — how_to_spend structuring (~3-4 hrs)

Redemption type categories: award stays, suite upgrades, FNRs, transfers,
experiences. Each row is a redemption mechanic with cost framing.

---

## Phase C — Cross-program intelligence (free with the structure)

Once Phase A ships, these become trivial queries:

**Sweet Spot of the Week** (homepage feature):
```sql
select * from program_sweet_spots
where is_active = true and superseded_at is null
  and cpp_estimate >= 0.7
order by random()
limit 1;
```

**Best Amex MR redemptions**:
```sql
select * from program_sweet_spots
where 'amex' = any(applies_to_transfers_from)
  and is_active = true
order by cpp_estimate desc
limit 10;
```

**Sub-25K hotel sweet spots**:
```sql
select * from program_sweet_spots
where points_cost_high <= 25000
  and program_slug in (
    select slug from programs where type = 'hotel'
  )
order by cpp_estimate desc;
```

**Drift report — sweet spots affected by recent fact changes**:
```sql
select ss.* from program_sweet_spots ss
join program_facts pf on pf.id = any(ss.fact_ids)
where pf.prior_version_id is not null
  and pf.created_at > now() - interval '7 days';
```

---

## Phase D — Drift propagation (after Phase A + facts ledger Phase 4)

Weekly drift cron (from facts ledger Phase 4) gets extended:
1. Cron finds fact X drifted
2. Query: which sweet spots cite fact X? (via `program_sweet_spots.fact_ids`)
3. Mark those sweet spots `drift_pending = true`
4. Query: which content cites those sweet spots? (via `content_sweet_spot_citations`)
5. Mark those content items `cited_entity_drift = true`
6. Admin drift dashboard surfaces all three levels

---

## What this replaces

| Today | Tomorrow |
|---|---|
| `programs.sweet_spots` markdown blob | Structured `program_sweet_spots` table, prose rendered on demand |
| Manual "find me a Hilton sweet spot for this blog" | Structured query by tags / transfers / cpp |
| Blog cites a redemption that's stale 6 months later | Citation graph flags blog when underlying fact drifts |
| AI writer fabricates redemption examples | AI writer cites real sweet spots by UUID |
| Cross-program "best X under Y" features impossible | One-query feature |
| Editor rewrites whole sweet_spots blob for one change | Edit one row in structured table |

---

## Open design questions for future sessions

1. **Sweet-spot version history**: Phase A schema includes `prior_version_id` + `superseded_at`. When editor edits, do we always supersede + version, or sometimes mutate in place? Lean toward: supersede on any field change to `points_cost_*` or `description`; in-place mutate for tags/display_order.

2. **Cross-program sweet spots**: a sweet spot like "ANA business class via Virgin Atlantic Flying Club" — does it live on Virgin's program page or on ANA's? Lean toward: on the CURRENCY that holds the points (Virgin), with `partner_slug='ana'`. Argument: you spend Virgin points, ANA is the operator.

3. **Sweet spot localization**: as the site grows internationally, sweet spots might differ by audience region. Defer until non-US scale matters.

4. **Permalinks**: `/programs/hilton/sweet-spots/[uuid]` for shareable individual sweet spot pages? Worth it for SEO + citation? Defer until first reader requests a sharable link.

5. **Sweet-spot expiry**: sweet spots that depend on a specific bonus (e.g. "during Amex 20% transfer bonus through May 30") need an end_date. Add `expires_at` to schema. Phase D drift cron checks this nightly.

---

## Pickup triggers

Start Phase A when ANY of:
1. Next session starts and we want a fresh-build target
2. First blog/alert needs to cite a sweet spot and the editor wishes the data was queryable
3. A real sweet spot drifts (Hilton changes Cancun pricing) and no system flags it
4. Cross-program comparison feature gets requested
5. Authoring program #11+ and tired of markdown blobs

---

## Related

- `plans/facts-ledger.md` — layer 1, already shipped Phase 1 + 2
- `~/.claude/projects/.../memory/project_facts_ledger.md` — layer 1 memory
- `~/.claude/projects/.../memory/project_three_layer_knowledge_graph.md` — this design's memory
- `~/.claude/projects/.../memory/project_intro_token_audit_global.md` — sibling pattern (live counts in prose)
- `~/.claude/projects/.../memory/project_transfer_bonus_monitor.md` — sibling pattern (structured monitoring)
