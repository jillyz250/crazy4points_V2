# Three-Layer Knowledge Graph — Full Design Spec

Authored 2026-05-27 after Phase 2c of the facts ledger shipped. Validated through two rounds of Copilot feedback (both confirmed the architecture as the correct long-term foundation).

Memory entry: `~/.claude/projects/.../memory/project_three_layer_knowledge_graph.md`

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

## Phase A — program_sweet_spots (~6-7 hrs)

### Migration: `program_sweet_spots`

```sql
create table program_sweet_spots (
  id                          uuid primary key default gen_random_uuid(),
  program_slug                text not null,
  title                       text not null,        -- "Hilton Cancun all-inclusive"
  points_cost_text            text,                 -- display string ("80K-130K pts/night")
  points_cost_low             integer,              -- band low (for sortable queries)
  points_cost_high            integer,              -- band high
  cpp_estimate                numeric(4,2),         -- 0.65 = 0.65 cents per point
  cash_value_ref              text,                 -- "$650+/night" — comparable rate
  description                 text not null,        -- 1-3 sentence why-it-matters
  tags                        text[] default '{}',  -- ['all-inclusive', 'caribbean', '5th-night-eligible']
  applies_to_transfers_from   text[] default '{}',  -- slugs of currencies that transfer in
  partner_slug                text,                 -- if cross-program redemption (e.g. via airline transfer)
  fact_ids                    uuid[] default '{}',  -- links to program_facts rows that back this
  is_active                   boolean not null default true,
  display_order               integer default 0,
  verified_at                 timestamptz not null default now(),
  superseded_at               timestamptz,
  prior_version_id            uuid references program_sweet_spots(id),
  created_at                  timestamptz not null default now()
);

create index program_sweet_spots_program_idx on program_sweet_spots (program_slug, superseded_at);
create index program_sweet_spots_active_idx on program_sweet_spots (is_active, program_slug)
  where superseded_at is null;
create index program_sweet_spots_tags_idx on program_sweet_spots using gin (tags);
create index program_sweet_spots_transfers_idx on program_sweet_spots using gin (applies_to_transfers_from);
create index program_sweet_spots_facts_idx on program_sweet_spots using gin (fact_ids);
```

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

### Public render update

`app/(site)/programs/[slug]/page.tsx` and any sweet-spot-rendering component:
- Query `program_sweet_spots WHERE program_slug = slug AND is_active = true AND superseded_at IS NULL`
- If non-empty: render from structured (newer path)
- Else: fall back to `programs.sweet_spots` markdown (legacy path)

This dual-render path lets us migrate programs gradually without breaking public pages.

### Admin editor

`app/admin/(protected)/programs/[slug]/edit/page.tsx`:
- Replace markdown textarea for `sweet_spots` with a structured CRUD list
- Per sweet spot row: inline form (title, points cost low/high/text, cpp, description, tags multiselect, applies_to_transfers_from multiselect, fact_ids picker)
- Add/remove/reorder buttons
- "+ New sweet spot" at bottom
- Each row links to `/admin/programs/[slug]/sweet-spots/[uuid]` for deep edit + citation tracking

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

## Phase B — Other prose fields (~10-15 hrs, later)

Same pattern, each its own table. Suggested order:
1. `program_quirks` (~4 hrs)
2. `program_lounge_access_rules` (~5 hrs — more complex with tier eligibility matrix)
3. `program_redemption_types` for how_to_spend (~3 hrs)

Each migration follows Phase A's template: table + backfill script (Haiku parses markdown) + dual-render + admin CRUD + draft-program writes structured.

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
