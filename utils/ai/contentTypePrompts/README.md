# Writer Prompt Library

Type-specific system prompts for `writeArticleBody`. Routes off the
`content_type` (and `activity_frame` for destination plays) on each
content_ideas row.

## Layout

```
contentTypePrompts/
├── index.ts                       composes the prompt for a given idea
├── universal/
│   └── destinationChecklist.ts   shared dimensions every destination_play touches
├── types/                         one file per content_type
│   ├── index.ts                  registry: type → prompt
│   ├── sweet_spot.ts
│   ├── destination_play.ts
│   ├── card_play.ts
│   ├── how_to.ts
│   ├── news.ts
│   ├── opinion.ts
│   ├── review.ts
│   ├── roundup.ts
│   └── case_study.ts
└── frames/                        activity sub-frames (destination_play only)
    ├── index.ts                  registry: frame → prompt section
    ├── _general.ts               fallback for unregistered frames
    ├── race.ts
    ├── concert.ts
    ├── sports.ts
    ├── theme_park.ts
    ├── ski.ts
    ├── hiking.ts
    ├── beach.ts
    ├── cruise.ts
    ├── spa.ts
    ├── casino.ts
    ├── romantic.ts
    ├── wedding.ts
    ├── astro.ts
    ├── pilgrimage.ts
    ├── foodie.ts
    ├── adventure.ts
    ├── historical.ts
    ├── college.ts
    ├── family.ts
    ├── photography.ts
    ├── pet.ts
    ├── business.ts
    ├── layover.ts
    ├── solo.ts
    └── accessibility.ts
```

## How to add a new content type

1. Create `types/your_type.ts` exporting `export const YOUR_TYPE_PROMPT = '...'`.
2. Add an entry to `types/index.ts`:
   ```ts
   import { YOUR_TYPE_PROMPT } from './your_type'
   export const CONTENT_TYPE_PROMPTS = {
     ...,
     your_type: YOUR_TYPE_PROMPT,
   }
   ```
3. Add the value to `lib/admin/contentTaxonomy.ts` `CONTENT_TYPES`.
4. **No DB migration needed** — `content_type` is plain `text` validated in
   TS. The new value flows through immediately.

## How to add a new activity frame

1. Create `frames/your_frame.ts` exporting `export const FRAME_YOUR_FRAME = '...'`.
2. Add an entry to `frames/index.ts`:
   ```ts
   import { FRAME_YOUR_FRAME } from './your_frame'
   export const ACTIVITY_FRAME_PROMPTS = {
     ...,
     your_frame: FRAME_YOUR_FRAME,
   }
   ```
3. Add the value to `lib/admin/contentTaxonomy.ts` `ACTIVITY_FRAMES`.

Frames default to `_general.ts` when not registered, so you can tag an
idea with a frame name **before** writing the prompt for it — the writer
will fall back gracefully.

## How to add a new universal dimension

Edit `universal/destinationChecklist.ts` once. Every destination_play
prompt picks it up automatically — no per-frame edits.

## Prompt structure conventions

Each type prompt should include (in this order):

1. `═══ CONTENT TYPE: NAME ═══` header
2. **One-paragraph description** of who the reader is and what they want
3. **STRUCTURE** numbered list — the canonical shape of this article
4. **LENGTH** target (words)
5. **HARD RULES** — type-specific guardrails

Each activity frame should include (in this order):

1. `═══ ACTIVITY FRAME: NAME ═══` header
2. One paragraph (~80-120 words) listing the activity-specific dimensions
   the writer should touch when relevant. Skip fabrication; rely on
   raw_text or program_context for specifics.

Keep frame paragraphs tight — they get layered onto the destination_play
prompt + universal checklist, so brevity matters for token budget.

## Current snapshot (2026-04-26)

- **9 content types**: sweet_spot, destination_play, card_play, how_to,
  news, opinion, review, roundup, case_study
- **25 activity frames** (destination_play only): see `frames/` directory
- **1 universal checklist** (~12 dimensions) shared by all destination_plays

## Sweet-spot point math

`sweet_spot.ts` is the only type that handles per-idea verified data
beyond program_context: an optional `cash_rate_reference` field on
content_ideas. When set, the writer quotes that figure as the cash
baseline. When not set, the writer phrases value comparatively
("typically books for $300-500 in cash") and never invents a specific
cents-per-point number.
