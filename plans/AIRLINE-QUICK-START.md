# Tomorrow morning, do this 🚀

Quick-start cheat sheet for adding the next airline. Open Claude, paste the exact phrase below.

---

## Step 1 — Trigger Claude

Type one of these **exact phrases** into Claude:

```
let's do <airline> next
```

Examples:
- `let's do Atmos next`
- `let's do AA next`
- `let's do Delta next`
- `let's do KLM next`

Claude will recognize the trigger, load the skill (`add-airline`), and walk you through 11 numbered steps one at a time.

## What happens after the trigger

| Step | Who does it | Time |
|---|---|---|
| 0. Confirm program row exists in DB | You (paste into admin) | 1 min |
| 1. Web research (3+ sources) | **Claude** | ~5 min |
| 2. Draft hedged content | **Claude** | ~5 min |
| 3. Cross-fact-check via Copilot | You paste, Claude diffs | ~3 min |
| 4. Author 9 fields in admin | You paste | ~3 min |
| 5. Verify live page after Vercel | You glance | ~2 min |
| 6. Submit to Search Console + Bing | You click | ~3 min |
| 7. Save source list | **Claude** | — |
| 7.5. Add press-room RSS to Scout | You add via admin | ~2 min |
| 8. Cross-linking (skip until cards done) | — | — |
| 9. Set 6-month review reminder | Optional | — |

**~30 min total for you.** Claude does the heavy lifting.

## Section milestone — run when section finishes

When you finish a *section* (e.g. all 12 US carriers, then international, then hotels), Claude will prompt you to run the section-complete checklist:

- Verify sitemap includes all section URLs
- Resubmit sitemap to Google + Bing
- Request indexing for each new program page
- Sanity-check one earlier-published page in Google
- Update progress tracker

## Reference docs

- **Full runbook:** `plans/airline-page-runbook.md` (everything the skill orchestrates)
- **Skill source:** `.claude/skills/add-airline/SKILL.md`
- **Authoring rules:** memory `feedback_authoring_workflow.md`
- **Brand voice:** memory `feedback_brand_voice_sassy.md`
- **Per-airline source archive:** `plans/sources/[slug].md` (one per airline)

## Standing instructions (Claude already knows these)

- Push back when manual is better than automation
- No drafting from memory — always web-search current 2026-dated sources
- Hedge absolute language: no "never", "always", "free", "instant", "all"
- Two-tangent rule for the AI writer when generating alerts (upside hook + caveat)
- Don't dump the whole runbook — surface one step at a time
- Capture every URL in the per-airline source doc

## Order of US airlines (12 total)

Recommended order based on reader importance:

1. ✅ Flying Blue (warm-up, done)
2. ☐ Atmos (Alaska + Hawaiian — merger spotlight)
3. ☐ AA (American AAdvantage — biggest US program)
4. ☐ Delta (Delta SkyMiles)
5. ☐ United (MileagePlus)
6. ☐ Southwest (Rapid Rewards)
7. ☐ JetBlue (TrueBlue)
8. ☐ Spirit (Free Spirit)
9. ☐ Frontier (Frontier Miles)
10. ☐ Allegiant (Allways Rewards)
11. ☐ Avelo (Avelo Airlines)
12. ☐ Breeze (Breeze Airways)
13. ☐ Sun Country (Sun Country Rewards)

> 🔓 **At airline #5, the Resources nav trigger unlocks** (per memory `project_resources_nav_trigger.md`). Claude will proactively flag this — ship the Resources dropdown PR before continuing to airline #6.
