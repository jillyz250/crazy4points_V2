# Guardian — Non-Destructive Extraction Pattern

**Status:** Cards shipped in PR #621 (2026-05-17). Programs shipped 2026-05-19.

## The bug class

A re-extraction (Firecrawl + Sonnet) returns `null` / `""` / `[]` for a field — because:

- The source URL went down or moved
- Firecrawl hit a bot wall on retry
- Sonnet couldn't find the field in the new page markdown
- The page was restructured and the field's locator no longer matches

The editor then clicks **Apply** on a "diff" that's secretly empty-vs-populated, and the previously-good content gets blanked. Editorial work disappears with no warning.

This bit the card-extraction path first (PR #621 fix: `utils/cards/saveExtractedBenefits.ts`) and then surfaced again in the program-extraction path (this fix).

## The pattern

Every "apply extracted value" code path MUST refuse to write an empty value over a populated previous value unless the editor opts in explicitly.

```ts
function isEmptyValue(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v as object).length === 0
  return false
}

// In the apply function:
if (!allowBlank && isEmptyValue(newValue) && !isEmptyValue(previousValue)) {
  return {
    ok: false,
    reason: 'blank_guard',
    error: 'Refusing to blank populated field "X". ...',
  }
}
```

### Required surfaces

1. **Apply function** — refuse with a clear `reason: 'blank_guard'` error.
2. **Server action** — when guard fires, mark the field's `applied_fields[field] = 'guard_blocked'` so the UI can render a visible badge.
3. **UI** — render a 🛡️ "Guard blocked" badge with a tooltip explaining what happened and how to override (the explicit "Clear field" action).
4. **Bypass parameter** — `allowBlank?: boolean` defaulting to `false`. Required for legitimate "Clear field" admin actions.

## Files implementing the pattern

### Cards (PR #621)
- `utils/cards/saveExtractedBenefits.ts`

### Programs (this fix)
- `utils/programs/applyProgramField.ts` — `isEmptyValue` + `allowBlank` gate
- `app/admin/(protected)/programs/[slug]/extract/actions.ts` — marks `guard_blocked` on the extraction row
- `components/admin/programs/ProgramFieldDiff.tsx` — renders the 🛡️ badge

## Smoke test plan (manual)

1. Pick a program with a populated `intro` field
2. Manually edit `program_extractions.extraction.intro.value = null` for the most recent extraction row
3. Visit `/admin/programs/<slug>/extract`
4. Click Apply on the intro field
5. Expected: the intro field renders the 🛡️ "Guard blocked" badge, `programs.intro` is UNCHANGED, console logs the guard error

## When to bypass (allowBlank=true)

Only one legitimate case: an editor explicitly wants to clear a field that's no longer accurate. This should be a separate "Clear field" admin action with a confirmation dialog, NOT the default Apply path.

Not yet built — currently the only way to clear a field is to manually run SQL. That's intentionally inconvenient.

## Related risk classes (NOT covered by Guardian)

- **Schema drift**: Sonnet returns wrong-shape JSON. Caught by `validateProgramExtraction.ts`.
- **Hallucinated source quotes**: Caught by `verifyExtractedField.ts`.
- **Wrong slug references**: Not yet caught — partner slug typos in `transfer_partners_outbound` silently render as title-cased slug. Backlog.
