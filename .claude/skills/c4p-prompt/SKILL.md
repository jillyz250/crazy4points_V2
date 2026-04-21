---
name: c4p-prompt
description: Transform rough thoughts into a well-structured prompt tailored to the crazy4points project. Invoke when the user wants help turning a vague idea or request into a concrete, actionable prompt. Trigger phrases include "rephrase this as a prompt", "build me a prompt", "help me prompt", "/c4p-prompt", or any time the user flags their own prompt as unclear or wants Claude to reshape it before executing.
---

# c4p-prompt — Project-Tailored Prompt Builder

## Purpose

Jill often has clear intent but rough prompting. This skill takes her raw thoughts and rewrites them into a structured prompt that loads relevant project context automatically — so Claude gets the full picture on the first shot instead of needing 3 rounds of clarification.

**Critically: this skill OUTPUTS a prompt. It does NOT execute the task.** Jill reviews the output, edits if needed, then sends it back as a new message to actually run the work.

---

## Workflow

### Step 1 — Read the raw input
The user's input after `/c4p-prompt` (or their rough message) is the source material. It might be one sentence, a paragraph, or a bulleted dump. Don't judge — just extract intent.

### Step 2 — Identify the work type
Classify into one of:
- **Feature build** — adding new UI, route, or capability
- **Bug fix** — something broken or wrong
- **Design/UX change** — copy, layout, styling, visual
- **Content/data** — alerts, programs, copy, seed data
- **Investigation** — "why is X happening?", "how does Y work?"
- **Refactor** — restructure existing code
- **Planning/strategy** — architecture decision, roadmap call
- **Tooling** — skills, scripts, hooks, dev environment

### Step 3 — Pull relevant context
Based on the work type, decide which of these to include in the final prompt:

| Context source | When to include |
|---|---|
| CLAUDE.md stack/rules | Any code change |
| Royal Glow tokens | Any UI/design change |
| Brand voice (sassy traveler-friend) | Any copy change |
| MEMORY.md relevant entries | Always scan; include what applies |
| Current phase (see ACTIVE-BUILD.md) | Planning or feature work |
| Specific file paths | If user named a feature/page |
| Known issues from project_known_issues.md | Any deploy or infra work |

**Do NOT dump the entire CLAUDE.md.** Cite only the relevant rules (e.g. "colors via tokens, no hex" for a UI task).

### Step 4 — Structure the output prompt

Use this template:

```
## Goal
<one-sentence goal in plain English>

## Context
- <relevant stack/rule/constraint 1>
- <relevant stack/rule/constraint 2>
- <relevant memory or phase note if applicable>

## Constraints / voice
- <voice rule if copy involved>
- <any "don't do X" rules from memory>

## Deliverable
<what Claude should output: file edits, a plan, a critique, a mockup, etc.>

## Out of scope
<what Claude should explicitly NOT do — prevents scope creep>
```

Keep each section tight. A good prompt fits on one screen.

### Step 5 — Present the output

Wrap the prompt in a clearly-marked code block so Jill can copy/paste or approve. Above the block, write ONE sentence explaining what you changed. Below it, offer: "Want me to run this, refine it, or are you going to edit it yourself?"

---

## Quality bar

A good rewritten prompt:
- Names the actual deliverable (not "help me with X")
- States the goal in terms Jill would recognize
- Includes only context that matters for *this* task
- Has an "out of scope" line when the request is at risk of scope creep
- Preserves Jill's voice and intent — doesn't over-engineer a simple ask

A bad rewritten prompt:
- Dumps every project rule regardless of relevance
- Turns a 2-sentence ask into a 2-page spec
- Changes what Jill actually wanted
- Adds deliverables she didn't ask for

---

## Examples

### Example 1 — vague feature ask

**Raw input:**
> "the hero is ugly fix it"

**Output prompt:**
```
## Goal
Redesign the homepage hero (components/home/HomeHero.tsx) to feel less boxed-in and more on-brand.

## Context
- Royal Glow tokens only (no hex): primary #6B2D8F, accent #D4AF37, use CSS variables
- Fonts: Playfair Display for headings, Lato body, Montserrat UI
- Brand voice: sassy traveler-friend, never mean, never obnoxious
- Current hero uses a boxed card inside a gradient section — feels small

## Constraints / voice
- Keep existing headline "Because paying full price is overrated" unless we explicitly change it
- No new dependencies

## Deliverable
Propose 2-3 hero layout directions (full-bleed vs boxed vs split) before writing code. After Jill picks, edit HomeHero.tsx.

## Out of scope
- Don't touch other homepage sections yet
- Don't change newsletter signup styling
```

### Example 2 — bug report

**Raw input:**
> "the daily brief link on alerts page hover is broken i think"

**Output prompt:**
```
## Goal
Investigate and fix the hover state on the "View Daily Brief" link in the alerts homepage strip.

## Context
- File: components/home/DailyAlerts.tsx:32
- Suspected issue: `hover:text-[var(--color-acc)]` — likely a typo for `--color-accent`
- Royal Glow tokens defined in styles/globals.css

## Deliverable
Confirm the typo, fix it, and check if the same typo exists elsewhere in components/.

## Out of scope
- Don't redesign the strip
- Don't touch alert card components
```

### Example 3 — planning/strategy

**Raw input:**
> "should we build the game or the public daily brief first idk"

**Output prompt:**
```
## Goal
Recommend whether to prioritize the points-game feature or the public-facing daily brief next, with reasoning Jill can push back on.

## Context
- Memory: game was deferred to newsletter v2+ (project_newsletter_build.md)
- Memory: daily brief is currently internal-only, would need significant work to be public-ready
- Active build phase: newsletter MVP v1 (plans/newsletter-mvp.md)

## Deliverable
A 1-screen recommendation with: recommended pick, 2-3 reasons, the main tradeoff, and what Jill should commit to before starting. Don't write code.

## Out of scope
- No implementation
- No scope expansion of either feature
```

---

## Edge cases

- **Input is already a good prompt:** Say so. Don't rewrite for the sake of rewriting. Output: "Your prompt is already clear — I'd just add [one tweak] or run it as-is."
- **Input is too vague to rewrite:** Ask ONE targeted clarifying question, not five. E.g. "Which page?" or "What's the end result you want to see?"
- **Input conflicts with a memory rule:** Flag it in the rewritten prompt's Constraints section. Don't silently ignore.
- **Input is for something outside the project:** Note it and still rewrite, but skip project-context injection.
