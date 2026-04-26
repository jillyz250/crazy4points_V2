# Tomorrow morning, do this 🏨

Quick-start cheat sheet for adding the next **hotel** program. Open Claude, paste the trigger phrase below.

---

## Step 1 — Trigger Claude

Type one of these **exact phrases** into Claude:

```
let's do <hotel program> next
```

Examples:
- `let's do Hyatt next`
- `let's do Marriott next`
- `let's do Hilton next`
- `let's do IHG next`

Claude will recognize the trigger, load the `add-airline` skill (named for airlines but generic-by-data-shape — works for any program), and walk you through 11 numbered steps one at a time.

**Reference: `plans/hotel-page-runbook.md` for hotel-specific guidance per step.**

## What's different from airlines

The 11-step shape is identical. Field meanings shift:

| Field | Hotel-specific guidance |
|---|---|
| **alliance** | Set to **"None"** — hotels don't do alliances |
| **hubs** | Leave empty (or repurpose for flagship properties) |
| **intro** | Mention brand portfolio (e.g. Park Hyatt, Andaz, Thompson) |
| **transfer_partners** | Usually fewer entries; for Hyatt, Chase UR is the headline |
| **how_to_spend** | Award nights, Suite Upgrade Awards, Free Night Certs, 4th-night-free |
| **sweet_spots** | Category-based sweet spots, 4th-night plays |
| **tier_benefits** | Stay-based qualification (nights / base points / dollars) — NOT XP |
| **lounge_access** | Club lounge / Regency Club access (different from airline alliance lounges) |
| **quirks** | Free Night Certificate breakdown per co-brand card; peak/off-peak; lifetime status |

## Per-step time

| Step | Time |
|---|---|
| 0. Confirm program row + co-brand cards exist | 1 min |
| 1. Web research (Claude) | ~5 min |
| 2. Draft hedged content (Claude) | ~5 min |
| 3. Cross-fact-check via Copilot | ~3 min |
| 4. Author 9 fields in admin | ~3 min |
| 5. Verify live page | ~2 min |
| 6. Submit to Search Console + Bing | ~3 min |
| 7. Save source list | Claude does it |
| 7.5. Add press-room RSS | ~2 min |
| 8. Cross-linking | — |
| 9. Set 6-month review reminder | optional |

**~30 min total for you.** Claude does the heavy lifting.

## Hotel-specific things to make sure surface

- Award category chart (Hyatt's 1-8, Bonvoy's peak/off-peak ranges, etc.)
- Free Night Certificate rules per co-brand card (which categories each unlocks)
- Top-tier suite upgrade rules (Globalist Suite Upgrade Awards, Bonvoy Ambassador Your24, etc.)
- 4th-night-free rules where they exist (Hyatt Globalist on standard awards)
- Stay-based tier qualification (nights / base points / dollars) — NOT XP
- Brand portfolio (luxury → midscale → budget tiers)
- Lifetime status achievements
- Limited transfer partners (most hotel programs have fewer than airlines)

## Hotel programs roster (15 to cover)

Recommended order based on US-reader value:

1. ☐ **Hyatt** (start here — highest cents-per-point for US audiences)
2. ☐ **Marriott Bonvoy** (largest portfolio; most readers have a Bonvoy card)
3. ☐ **Hilton Honors** (massive portfolio; Amex co-brand depth)
4. ☐ **IHG One Rewards** (Holiday Inn / Intercontinental; Chase IHG card)
5. ☐ **Wyndham Rewards** (Caesars reciprocal; budget-tier breadth)
6. ☐ **Choice Privileges** (Ascend portfolio; transferable currency target)
7. ☐ **Best Western Rewards**
8. ☐ **Radisson Rewards Americas**
9. ☐ **Accor Live Limitless** (European-leaning; status match)
10. ☐ Others as you find traffic for them

## Reference docs

- **Full runbook:** `plans/hotel-page-runbook.md` (hotel-specific guidance per step)
- **Skill source:** `.claude/skills/add-airline/SKILL.md` (named for airlines; generic by data shape)
- **Authoring rules:** memory `feedback_authoring_workflow.md`
- **Brand voice:** memory `feedback_brand_voice_sassy.md`
- **Per-program source archive:** `plans/sources/[slug].md` (one per program)

## Standing instructions (Claude already knows these)

- Push back when manual is better than automation
- No drafting from memory — always web-search current 2026-dated sources
- Hedge absolute language: no "never", "always", "free", "instant", "all"
- Two-tangent rule for the AI writer when generating alerts (upside hook + caveat)
- Don't dump the whole runbook — surface one step at a time
- Capture every URL in the per-program source doc

---

## Note on the skill name

The skill is `.claude/skills/add-airline/SKILL.md` because we built it for airlines first. It works fine for hotels (same data shape) but the name is misleading. Backlog item: rename to `add-program` once we've authored 3+ hotels and confirmed the workflow generalizes cleanly.
