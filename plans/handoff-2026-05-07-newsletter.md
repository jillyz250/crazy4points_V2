# Handoff — Newsletter Redesign (2026-05-07)

Plan for restructuring the weekly newsletter on crazy4points. **No code written yet.** Pick up here in the next session. (Games plan is a separate handoff: [handoff-2026-05-07.md](handoff-2026-05-07.md). Newsletter game-teaser slot depends on at least one game being live.)

## Locked decisions (no need to re-ask)

| # | Decision | Value |
|---|---|---|
| 1 | Structure | Header → Game teaser → Big Story → Also Happening → Jill's Take → Footer |
| 2 | Admin editor | Slot-based at `/admin/newsletter/[id]/edit` (not one big textarea) |
| 3 | Also Happening count | Admin chooses per send |
| 4 | Also Happening categories | **Free-text** field per blurb (no fixed enum) |
| 5 | Jill's Take steering | New `newsletters.jill_prompt` scratchpad. Fill anytime before Wed 10pm cron; cron picks up whatever's there. Empty = Claude picks topic from week's intel. |
| 6 | Big Story scope | Both published alerts AND raw intel that didn't get promoted (admin picks from unified dropdown) |
| 7 | Game teaser format | Redacted preview — show clue #1 in email + "play to reveal the rest →" CTA |
| 8 | Game gate | Hide game section entirely if no game built/scheduled that week |
| 8a | Game cadence | **Weekly rotation** from a pool of 5–8 games. One game per newsletter, swap each week. CTA: **"Play this week's puzzle →"**. Confirmed 2026-05-07. |
| 9 | Cadence | Unchanged — Wed 10pm generate / Thu manual send |

## Final structure

```
┌────────────────────────────────────┐
│ HEADER — rotating cover / villain  │
├────────────────────────────────────┤
│ 🎮 GAME OF THE WEEK (hide if none) │
│ Redacted clue #1                   │
│ "Play to reveal the rest →"        │
│ → /games/[slug]                    │
├────────────────────────────────────┤
│ 🚨 THIS WEEK'S BIG STORY           │
│ ~150w Jill voice, link to source   │
│ (alert OR raw intel, admin picks)  │
├────────────────────────────────────┤
│ 📍 ALSO HAPPENING                  │
│ N blurbs (admin chooses count)     │
│ Each: free-text category + 1-2     │
│ lines + link                       │
├────────────────────────────────────┤
│ 💬 JILL'S TAKE                     │
│ AI draft from week's intel +       │
│ jill_prompt scratchpad             │
├────────────────────────────────────┤
│ ✈️ FOOTER (sub CTA, social, unsub) │
└────────────────────────────────────┘
```

## Schema migration (planned)

```sql
-- supabase/migrations/220_newsletter_slots.sql
alter table newsletters
  add column if not exists jill_prompt text,
  add column if not exists big_story_ref_type text check (big_story_ref_type in ('alert', 'intel')),
  add column if not exists big_story_ref_id uuid,
  add column if not exists big_story_html text,
  add column if not exists also_happening jsonb default '[]'::jsonb,
  -- shape: [{ ref_type: 'alert'|'intel', ref_id: uuid, category: text, blurb: text, link_url: text }]
  add column if not exists jills_take_html text,
  add column if not exists game_slug text,
  add column if not exists game_clue_text text;

comment on column newsletters.jill_prompt is
  'Optional admin scratchpad: "what Jill wants this week''s take to focus on." Generator passes to Claude as steering context. Empty = Claude picks topic from intel.';
comment on column newsletters.big_story_ref_type is
  'Source of big story: alert (published alert this week) or intel (raw intel item that did not get promoted).';
comment on column newsletters.also_happening is
  'JSONB array of blurb objects. Free-text category (no enum). Admin chooses count.';
```

Existing newsletter columns stay; this adds slot fields alongside.

## Generator rewrite — `utils/ai/runBuildNewsletter.ts`

Current behavior: produces one HTML blob from week's intel/alerts.

New behavior:
1. Fetch this week's published alerts + non-promoted intel items (last 7 days)
2. Auto-pick big story = highest-impact alert (current logic), write the ~150-word draft
3. Auto-pick 3-5 also-happening candidates by recency × confidence; assign a free-text category to each via Claude (e.g. "Devaluation," "Bonus transfer," "New partner"); write 1-2 line blurb each
4. Read `jill_prompt` from the newsletter row. Generate Jill's Take using the week's intel as raw material + scratchpad as steering. If empty, Claude picks topic.
5. Fetch today's game from `/api/games/today` (returns `{ slug, clue_1, ... }`). If response is null or empty, leave `game_slug` null → admin UI/email both hide section.
6. Write structured slots to the row, not one HTML blob:
   - `big_story_html`, `big_story_ref_type/_id`
   - `also_happening` (jsonb)
   - `jills_take_html`
   - `game_slug`, `game_clue_text`
7. Email-render step (separate, runs at send time) composes the slots into HTML.

## Admin slot editor — `/admin/newsletter/[id]/edit`

Replaces existing single-textarea edit page. Each slot is its own card:

### Game slot
```
🎮 Game of the Week
Slug: [routle ▾]   Clue #1: "Distance: 6,832 mi"
[ Override clue ] [ Hide section ]
```

### Big Story slot
```
🚨 Big Story
Source: ( ● Alert  ○ Intel )    [ Pick one ▾ ]
  → "Marriott eliminates Ambassador $25K spend req"
[ ~150-word editor with regenerate button ]
```

### Also Happening slot
```
📍 Also Happening                    [ + Add blurb ]
┌──────────────────────────────────────────────┐
│ [Devaluation         ] (free-text category)   │
│ Source: alert ▾ → "Hyatt cat 6 cap..."        │
│ [Blurb editor: 1-2 lines]                     │
│ Link: [auto from source]                      │
│ [↑] [↓] [✕]                                   │
└──────────────────────────────────────────────┘
[ + Add blurb ] (no fixed count cap)
```

Drawer of candidates pulls from this week's published alerts + non-promoted intel.

### Jill's Take slot
```
💬 Jill's Take
What should Jill write about this week? (steers AI)
[ Scratchpad textarea, persists to newsletters.jill_prompt ]

Draft:
[ Rich-text editor seeded with Claude output ]
[ Regenerate from scratchpad ]
```

The scratchpad lives on the newsletter row, so it persists between visits. Admin can fill it any time during the week; the Wed 10pm cron picks up whatever's there.

## Email render

Composer reads slot fields and assembles HTML at send time. Hide rules:
- `game_slug` null → skip game section
- `big_story_html` empty → skip big story section
- `also_happening` empty array → skip also-happening section
- `jills_take_html` empty → skip jill's-take section

Each section is independent. Admin can choose to skip any of them by clearing the slot.

## Build phases

| Phase | Ships | Notes |
|---|---|---|
| **N1** | Schema migration + slot fields populated by generator (existing single-blob render still used) | Foundation; no UX change yet |
| **N2** | Slot-based admin editor + per-slot regenerate | Admin can edit per-slot; email render still composes from slots |
| **N3** | Email render rewrite — composes from slot fields directly | Removes legacy single-blob path |
| **N4** | Game teaser integration | Depends on at least one game being live (games plan P1) |

Ship N1 first; it's invisible to readers but unblocks N2.

## Open decision points (next session)

All structural decisions are locked. Remaining are implementation details — ask if any of these matter to user:

1. **Newsletter slug** — current schema has `newsletters.slug`; should slot fields be on a child `newsletter_slots` table instead, or keep flat on `newsletters`? *(rec: flat — simpler queries, slots are a fixed shape)*
2. **Auto-pick fallback** — if Claude's auto-pick for Big Story / Also Happening returns nothing (slow week), do we ship with empty sections or block the cron? *(rec: ship with empty sections, hide rules already cover this)*
3. **History view** — does the slot editor show a diff/history of what got generated vs. what got sent? *(rec: not in N1-N3; add later if you want it)*
4. **Test send** — admin button to send a preview to your own email before the real send? *(rec: yes, low effort, big confidence boost)*

## Pickup prompt for next chat

> Read `plans/handoff-2026-05-07-newsletter.md`. Newsletter redesign is fully scoped — 9 decisions locked, 4 implementation details optional. Want to start N1 (schema migration + generator slot writes). Ask me the 4 implementation-detail questions, then write the migration + generator diff.

## Files to know

- Newsletter generator: `utils/ai/runBuildNewsletter.ts`
- Newsletter cron: `vercel.json` (build-newsletter Wed 10pm)
- Newsletter admin: `app/admin/(protected)/newsletter/`
- Memory entry: `project_newsletter_v1_decisions.md` — Wed generate / Thu send, manual only
