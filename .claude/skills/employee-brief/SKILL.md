# employee-brief — a head's morning brief, in their own voice

## Mission
Every morning each department head hands Jill a **brief** for their domain, then walks her through their phase-slice. This skill is how a head-agent produces that brief: pull live data → narrate it tight → end with your ordered mini-agenda. Piloted with Kesha 2026-09-02 and approved by Jill.

## Who runs this
The head-agent whose brief it is (kesha-social, john-content, priya-sources, janet-growth, bill-security, charlie-legal, erica-finance, megan-partnerships). Morgan (the main session) invokes each head at the start of the morning ritual to collect their briefs.

## Steps
1. **Pull your live data:** run `node scripts/employee-brief.mjs <your-slug>` (e.g. `node scripts/employee-brief.mjs john-content`). It prints structured JSON of your domain's queues — the SAME queries the daily ritual uses, so your brief can never disagree with the board. Read the JSON. Do NOT invent numbers; if the engine returns `quiet: true`, your domain has no structured queue today — give an honest short brief around the `watch` line.
2. **Write Jill your brief, in your voice** (each head has a distinct persona — be yourself, but this is an internal brief so no customer-facing constraints beyond honesty). Keep it TIGHT and scannable — Jill reads it in ~20 seconds. Use this shape, skipping any section that's empty:
   - **One-line vibe** — how your domain looks today.
   - **What's queued / needs her** — your key counts with your 2-3 standouts worth her time. Be honest when a big count is mostly low-stakes noise you'll bulk-handle (don't dump the whole pile on her).
   - **Time-sensitive** — anything closing/expiring that changes the priority.
   - **My #1 rec today** — the single highest-leverage thing for Jill to green-light. Lead with it.
3. **End with "Here's how I'd walk you through it"** — your **phase-slice**: an ordered mini-agenda (3-5 steps) of how you'd take Jill through your domain this morning. This is what becomes "your phases" in the person-by-person ritual.

## Rules
- **Only real facts from the engine output.** Never fabricate a count, date, or item. (See [[feedback_multi_source_verify_before_draft]], [[feedback_no_unsourced_claims]].)
- **Lead with a recommendation**, don't just list. Jill wants an advisor. ([[feedback_always_recommend]])
- **Honest about noise:** a 200+ queue that's mostly directory junk → say so + say you'll bulk-skip, surface only the few that matter.
- **Office lore stays internal** — fine to show personality in the brief (it's internal), but nothing lore-related ever reaches customer-facing content. ([[project_ai_employee_team]])
- **Audience is NY-heavy**; priority weighting 50% points value / 25% timing / 25% cabin where relevant. ([[feedback_audience_new_york_heavy]], [[feedback_audience_priority]])

## The rail
- Data engine: `scripts/employee-brief.mjs <slug>` — per-head queue configs copied from `scripts/morning-snapshot.mjs`. To add/adjust a head's queues, edit that file's `CONFIGS` map.
- Thin heads (charlie/erica/megan) return a `quiet` brief until their tools/queues exist (e.g. Erica's `/admin/expenses`).

## Related
[[project_ai_employee_team]] (the org), the `daily-ritual` skill (this feeds the person-by-person ritual reorg), [[feedback_ritual_phase_setup_loved]] (greeting + one-phase-at-a-time presentation Jill loves).
