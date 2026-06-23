# Spec: Award-engine diagnostics + real-engine fuzz harness

**Status:** ready to execute. Design finalized against the live code (2026-06-23).
**Goal:** make silent award-chart failures visible, and fuzz the REAL engine — without a risky refactor of the Decision Engine.

---

## 0. Key design decision (READ FIRST)

The audit proposed changing `computeAwardCost`'s return type to a discriminated union and migrating all 8 call sites. **Do NOT do that.** It ripples through 4 Decision-Engine query files + 6 internal `computeOne*` helpers (all return `AwardCostResult | null`), high regression risk, low payoff.

**Instead: keep the hot path unchanged, add an additive diagnostic wrapper.**
- `computeAwardCost(...) : AwardCostResult | null` — UNCHANGED. The 8 value-path call sites and all internal helpers stay exactly as they are. Zero migration.
- New `diagnoseAwardCost(...) : AwardDiagnosis` — re-walks the same coverage logic with instrumentation, returns *why* a route did/didn't compute. Used ONLY by the new integrity check + the fuzz harness. Never on the render hot path.

This delivers chart-miss visibility with ~zero blast radius. The "discriminated union" lives in the diagnostic, not the engine return type.

---

## 1. Types (add to `lib/awardChart.compute.ts`)

```ts
export type AwardDiagnosisKind =
  | 'computed'            // a chart produced a number
  | 'no-structured-chart' // program.charts empty -> legit fallback to stored cost
  | 'not-covered'         // charts exist but none cover (partner, bucket) -> legit fallback
  | 'chart-miss'          // a chart COVERS (partner, bucket) but computeOne returned null -> BUG
  | 'invalid-input'       // null/partial airport, unknown cabin, etc.

export interface AwardDiagnosis {
  kind: AwardDiagnosisKind
  result: AwardCostResult | null   // set iff kind === 'computed'
  reason?: string                  // human detail for chart-miss / invalid-input
  programSlug?: string
  partnerSlug?: string
  bucket?: string | null
  cabin?: Cabin
}
```

## 2. `diagnoseAwardCost` — implementation contract

Mirror `computeAwardCost`'s walk, but classify:
```
if (!origin || !destination)               -> invalid-input ('null airport')
if (!program?.charts?.length)              -> no-structured-chart
bucket = mapRouteToBucket(origin, dest)
covering = charts.filter(c => chartCoversPartner(c, partner) && chartAppliesToBucket(c, bucket))
if (covering.length === 0)                 -> not-covered
for (chart of covering) {
  r = computeOne(chart, ...)
  if (r) return { kind:'computed', result:r, ... }
}
return { kind:'chart-miss', reason:`${covering.length} chart(s) cover ${partner}/${bucket} but none priced it` }
```
Also add a `diagnoseBucketTypicalCost(program, partner, bucket, cabin)` twin (same classification, no airports → never `invalid-input`).

**Wrap the existing `computeAwardCost` to reuse it (optional, keeps one source of truth):**
`computeAwardCost(...)` body can become `const d = diagnoseAwardCost(...); return d.kind === 'computed' ? d.result : null` — IFF that produces byte-identical behavior (verify against the existing 25-route test before/after). If any doubt, leave `computeAwardCost` untouched and let `diagnoseAwardCost` duplicate the walk — duplication is acceptable here because the fuzz harness (§5) pins both to the same outputs.

## 3. Logging / metrics

- `diagnoseAwardCost` is pure (no logging inside — keep it deterministic for tests).
- The integrity check (§4) is the metric surface: it counts `chart-miss` per program and emits one finding per program with misses. No new table; reuse `IntegrityFinding`.
- Optional later: a `chart_miss` counter in the daily integrity email summary line.

## 4. Integrity-check integration (`utils/integrity/runIntegrityChecks.ts`)

Add `checkAwardChartHealth(supabase)`, registered next to the others:
```ts
findings.push(...(await checkAwardChartHealth(supabase)))   // after checkCronHealth
```
Logic:
1. Load programs that HAVE a structured chart (`award_chart_structured` non-null) + their chart object.
2. For each program, for each (partner the chart claims to cover) × (each `RouteBucket` the chart's `applies_to_buckets` allows, or all buckets) × (each `Cabin`): call `diagnoseBucketTypicalCost`.
3. Count `chart-miss`. Emit ONE `IntegrityFinding` per program with >0 misses:
   - `check: 'award_chart_miss'`, `severity: 'med'`, `href: '/admin/programs/<slug>'` (use the `href`/`label` fields added this session), `detail: 'N (partner×bucket×cabin) combos the chart claims to cover but fails to price: <samples>'`.
4. Detection-only; never mutates. Runs on `/admin/data-integrity` load + the daily cron email — same as the cron-health + bonus-expiry checks added 2026-06-23.

## 5. Real-engine fuzz harness (replaces the JS-mirror test)

**Problem:** `scripts/award-chart-compute-tests.mjs` reimplements the engine in JS — it can pass while the real TS engine is broken (same drift hazard as the purged `* 2.*` files). Fix: run the REAL TS.

**Tooling:** add `tsx` as a devDependency; run `npx tsx scripts/award-chart-fuzz.ts` (TS, imports `lib/awardChart.compute.ts` directly). Keep the old `.mjs` only until the new harness covers its 25 routes, then delete it.

**Fuzz dimensions (cartesian, table-driven):**
- **program:** every program with `award_chart_structured`.
- **partner:** each carrier the program's chart covers + 2 it does NOT (expect `not-covered`).
- **origin/dest:** a fixed ~15-airport matrix (reuse the test's set) PLUS adversarial: same-airport (o===d), unknown IATA (→ findAirport returns null), antipodal pair, hemisphere crossings, and **null / `{}` / missing `region` / missing `country_code`** airports.
- **cabin:** all 4 valid + one invalid string (`'suite'`).
- **date (DPM/peak charts):** off-peak date, peak-window date, peak boundary ±1 day, `null`, malformed (`'2026-13-40'`).

**Assertions (per combo):**
1. **Never throws.** Any thrown error = hard fail (this is the crash class the null-guard was about).
2. `diagnoseAwardCost` returns a valid `AwardDiagnosisKind`.
3. When `computed`: `miles` ≥ 0; if `{low,high}` then `low ≤ high`; no `NaN`/`Infinity`.
4. Covered routes (partner the chart claims) on valid airports must be `computed` or `chart-miss` — never silently `not-covered`.
5. Adversarial inputs (null airport, unknown IATA) → `invalid-input` (or `no-structured-chart`), NOT a throw and NOT a bogus `computed`.

**Expected output:**
```
program        combos  computed  not-covered  chart-miss  invalid  THREW
aeroplan         420       310          92          0         18      0
united           ...
...
TOTALS          ...                                 0                 0
```
Exit non-zero if `THREW > 0` OR `chart-miss > 0` on a chart-claimed-covered route.

## 6. Safety rails

- **No hot-path change.** `computeAwardCost` / `computeBucketTypicalCost` signatures and the 8 call sites are untouched. Confirm with a diff + the existing 25-route test passing unchanged.
- **Diagnostic is pure + deterministic** — no DB, no `Date.now()` in the walk (pass dates in).
- **Integrity check is detection-only** — reuses the established no-mutate pattern; a chart-miss flag never edits data.
- **Fuzz runs in CI/local only** — not a cron, not in the request path.
- **Land in 3 commits:** (1) `diagnoseAwardCost` + types + unit test that it agrees with `computeAwardCost` on the 25 known routes; (2) `checkAwardChartHealth` integrity check; (3) `tsx` + `scripts/award-chart-fuzz.ts`, delete the JS mirror once parity is confirmed.

## 7. Acceptance criteria
- [ ] `computeAwardCost` unchanged; 25-route test green; Decision-Engine pages render identically.
- [ ] `diagnoseAwardCost`/`diagnoseBucketTypicalCost` classify all 5 kinds correctly (unit-tested).
- [ ] `/admin/data-integrity` shows `award_chart_miss` findings (or none, cleanly).
- [ ] Fuzz harness runs the REAL engine, 0 throws, reports chart-miss table; CI-fail on throw or claimed-covered miss.
- [ ] JS-mirror test deleted after parity.
