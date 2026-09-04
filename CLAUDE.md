# crazy4points — Project Reference

## Prime directive (read first)
**The number-one goal on every task is to leave the system better, more efficient, and more accurate.** Shipping the immediate ask is table stakes; the real win is that the platform, its data, and its workflows improve as a result. Concretely:
- **⭐ DISCOVERY BEFORE CONSTRUCTION (do this FIRST, every build).** Before building anything new — a feature, agent, table, column, page, cron, dataset — SEARCH for what already exists and say what you found: (1) grep the codebase for the concept (functions, components, routes, crons); (2) check the DB schema for related columns/tables (e.g. `programs.sweet_spots` already exists; `official_url` is on cards, not programs); (3) check `vercel.json` crons + `/admin` pages; (4) check `REFERENCE-existing-systems.md` and memory. This codebase is large and mature — **most "new" things already exist**, and rebuilding a duplicate (a Watchdog when `reverifyTransfers` exists; re-researching sweet spots that are already authored on program pages) is the #1 failure mode. Cross-reference and extend; never recreate. When you discover an existing system, record it in the inventory so the knowledge compounds.
- **Fix root causes, not just symptoms.** If a task surfaces a bug, a fragile process, or a data-quality gap, fix the underlying cause and quantify the blast radius (e.g. "23 of 71 alerts affected"), don't patch the one instance.
- **Proactively recommend improvements — even unasked.** Whenever you spot a cheaper, simpler, safer, or higher-leverage path, or an efficiency/accuracy win, say so before executing and offer it. Jill wants these recommendations surfaced, not withheld.
- **Accuracy is non-negotiable.** Every published fact traces to an official/issuer source (never a blog); verify before asserting; when you can't verify, say so and omit. See the editorial rules below and in memory.
- **⭐ Multi-source verify BEFORE any factual draft reaches the user (global).** Every specific figure (fee, %, date, threshold, ratio, count) in a NEW item must be confirmed by the **official page AND ≥1 independent current source** before it's presented — one search is never enough, an official page can be STALE (staleness-guard rebranded/merged programs), and you must red-team your own facts and show sourcing per fact. The user approves voice and judgment, never catches your facts. See `feedback_multi_source_verify_before_draft` in memory.
- **⭐ Check the prose on any data change (global).** Any change to a program/card page's structured data (welcome bonus, transfer ratio, fee, elevated flag) MUST include reading + updating that page's PROSE (`good_to_know`, `intro`, `quirks`, `sweet_spots`) so it can't drift from the new number. Issuer pages that 403 WebFetch (amex/chase/barclays/aa/mastercard) — use the in-app browser (`mcp__Claude_Browser__navigate` + `get_page_text`) to read the public offer. See `feedback_check_prose_on_data_change`.
- **Build reusable rails over one-off fixes.** Prefer a vetted helper/field/section that generalizes (and a memory note) over a throwaway script that solves today only.
- **Leave a trail.** Verify your work (typecheck, real render/DB checks), and record durable lessons so the improvement compounds across sessions.

## ⭐ Closed-loop principle (nothing is ever orphaned)
**Everything the system creates must be a CLOSED LOOP** (Jill, 2026-09-04): entry → an **owner** → stays **visible** until closed → a **terminal state**, with **aging/escalation OR a re-check date** so it can never rot silently. Before shipping ANY feature that creates or stores a "thing" (alert, program/card page, task, reminder, signal, idea, record), ask: *how does this get closed, and what happens if no one ever touches it?* If the answer is "it sits forever," that's a broken loop — add an expiry, a recheck date, or an escalation.
- **The alert rule (the canonical example):** a published alert must have an `end_date` (auto-expires) **OR** a re-check date / `last_verified` cadence (refresh queue) — **never neither**, or it can advertise dead/drifted info forever.
- **In place:** reminders/tasks escalate the moment a due date passes (`lib/orgAging.ts`); intel auto-clears + ages; ideas go new→approved→shipped; change-signals/drift/vendor-radar resolve + age; backups verify weekly (Remy); errors escalate at 2d.
- **Known gaps being closed:** 12 published alerts had no expiry + stale verification (found 2026-09-04); programs need a `reverify_source_url` (Priya's coverage drive, 17/154 and climbing).
- When you find an orphan, close its loop (owner + date/expiry/escalation) AND fix the mechanism so the next one can't be orphaned either. See memory `feedback_never_an_open_loop`.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (no config file — tokens defined in `styles/globals.css` via `@theme inline`)
- Fonts loaded via `next/font/google` in `lib/fonts.ts`
- **Supabase** — all data (alerts, programs, subscribers). No Sanity. Do not reference or reinstall Sanity.
- **Resend** — transactional email (newsletter signups, welcome emails)
- **Anthropic SDK** — Claude Haiku (`claude-haiku-4-5-20251001`) for AI alert summaries on publish
- Deployed on Vercel, connected to `jillyz250/crazy4points_V2` on GitHub
- Live at: https://crazy4points.com

## Database — Supabase Tables
- `alerts` — all alert content (title, slug, type, summary, ai_summary, status, etc.)
- `programs` — loyalty programs (Chase UR, Amex MR, etc.)
- `alert_programs` — junction table linking alerts to programs (role: 'primary' | 'secondary')
- `alert_history` — publish log + AI-generated summaries
- `sources` — alert data sources for Claude Scout
- `subscribers` — newsletter subscribers (email, first_name, active)

## Key Utility Files
- `utils/supabase/server.ts` — `createAdminClient()` (service role) and `createClient()` (SSR)
- `utils/supabase/queries.ts` — all Supabase query functions
- `utils/ai/summarizeAlert.ts` — calls Claude Haiku to generate alert summaries
- `utils/ai/logPublishEvent.ts` — triggered on publish, calls summarizeAlert

## Folder Structure
- `app/` — root layout + metadata in `app/layout.tsx`; pages live under `app/(site)/`
- `app/admin/(protected)/` — admin pages (alerts, programs, sources, homepage)
- `components/` — organized by section: `layout/`, `home/`, `destinations/`, `legal/`, `alerts/`, `programs/`
- `lib/fonts.ts` — font definitions (Playfair Display, Lato, Montserrat)
- `styles/globals.css` — all design tokens + global base styles
- `public/` — static assets

## Design System — "Royal Glow"

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#6B2D8F` | Headings, logo, links, primary buttons |
| `--color-primary-hover` | `#5A237A` | Primary button hover state |
| `--color-accent` | `#D4AF37` | Decision Engine button, highlights |
| `--color-background` | `#FFFFFF` | Page background |
| `--color-background-soft` | `#F8F5FB` | Section backgrounds, cards |
| `--color-text-primary` | `#1A1A1A` | Body text |
| `--color-text-secondary` | `#4A4A4A` | Secondary/muted text |
| `--color-border-soft` | `#E6DEEE` | Card borders, dividers |

Always reference colors via CSS variables, never hardcode hex values.

### Fonts
| Token | Font | Usage |
|---|---|---|
| `--font-display` | Playfair Display (serif) | All headings (h1–h6) |
| `--font-body` | Lato (sans-serif) | Body copy, paragraphs |
| `--font-ui` | Montserrat (sans-serif) | Nav, buttons, labels, UI elements |

Font variables are injected via `lib/fonts.ts` and applied to `<html>` in `app/layout.tsx`.

### Spacing & Radius
| Token | Value | Usage |
|---|---|---|
| `--spacing-section` | `5rem` | Major section padding (`rg-major-section`) |
| `--spacing-subsection` | `2.5rem` | Sub-section padding (`rg-sub-section`) |
| `--radius-ui` | `0.375rem` | Buttons, inputs |
| `--radius-card` | `0.75rem` | Cards |
| `--shadow-soft` | `0 2px 8px rgba(26,26,26,0.04)` | Card shadows |

### Utility Classes
| Class | Description |
|---|---|
| `.rg-container` | Max-width 80rem, centered, horizontal padding |
| `.rg-major-section` | Top/bottom padding for full sections |
| `.rg-sub-section` | Top/bottom padding for sub-sections |
| `.rg-btn-primary` | Filled purple button (Montserrat, white text) |
| `.rg-btn-secondary` | Outlined purple button, turns gold on hover |

Always use these classes for layout and buttons — do not invent new patterns.

## Key Rules
- Never hardcode colors, fonts, or spacing — always use the CSS tokens above
- All headings are Playfair Display and `--color-primary` purple by default (set in globals)
- Buttons use Montserrat via `--font-ui`
- New pages go under `app/(site)/` to inherit the site layout
- New components go in `components/` organized by section
- Do not add `output: 'export'` to `next.config.ts` — Vercel handles server rendering

## Security rules (Bill, Head of Security)
- **Never run an AI coding agent against an untrusted clone.** A repo's `.git/config` is effectively executable — a malicious `git config` (e.g. a poisoned `core.fsmonitor` / alias / hook) can make Claude, Cursor, Codex, etc. run attacker code when the agent touches the repo. Only run agents on repos you control; treat any third-party clone's `.git/config` and hooks as suspect before working in it. (Added 2026-09-04 from a live advisory; this codebase runs AI agents daily, so it's our direct exposure.)

## Mobile contract (every new page must pass)
The site must look right at **375px** (iPhone SE — the floor we design for).
Before opening a PR for any new page or layout change, verify:

1. **No horizontal overflow at 375px.** Hard fail. Run this in the dev preview against each new/changed route:
   ```js
   // Returns the number of overflow pixels. Must be 0.
   document.documentElement.scrollWidth - document.documentElement.clientWidth
   ```
   For a sweep across many routes, use the iframe-based eval pattern from the 2026-05-02 mobile-optimization PR.
2. **Tap targets ≥44×44px** for primary touch controls (buttons, icon-only links). Inline body links inside paragraphs are exempt per Apple HIG.
3. **No fixed-column grids** like `repeat(N, 1fr)` where N is data-driven — always use `repeat(auto-fit, minmax(<min>, 1fr))` so columns stack on narrow viewports. (This was the Alliance Explorer bug.)
4. **Wide tables** must either live inside `.rg-prose` (auto-overflow at <640px) or be wrapped in `.rg-table-scroll`.
5. **Form inputs** ≥16px font-size to prevent iOS zoom-on-focus. Use `fontSize: '1rem'` (inline) or `text-base` (Tailwind). If you want smaller text on desktop, write `text-base md:text-sm` — never the reverse.
6. **Avoid `100vh`** — iOS Safari miscounts it by ~100px (address bar). Use `100dvh` for full-viewport sections, with `100vh` as a fallback only if you need to support old iOS.

Reusable mobile primitives in `styles/globals.css`:
- `.rg-tap-target` — guarantees 44×44 hit area (use on icon-only buttons)
- `.rg-table-scroll` — overflow-x wrapper for wide non-prose content
- `.rg-major-section` / `.rg-sub-section` already auto-tighten at <640px (5rem → 3rem)

## Adding program reference pages (airlines, hotels, etc.)
When the user wants to author or refresh a per-program reference page at `/programs/[slug]`:
- Trigger phrase: **"let's do `<program>` next"** (also: "add airline X", "next airline", "start `<program>`", "let's tackle `<program>`")
- Skill: `add-airline` (defined at `.claude/skills/add-airline/SKILL.md`) — named for airlines but generic-by-data-shape; orchestrates the 11-step pipeline one step at a time

**Use the type-specific runbook based on what's being authored:**

| Program type | Runbook | Quick-start |
|---|---|---|
| Airlines | `plans/airline-page-runbook.md` | `plans/AIRLINE-QUICK-START.md` |
| Hotels | `plans/hotel-page-runbook.md` | `plans/HOTEL-QUICK-START.md` |

The 11 steps are identical across types; the per-step content guidance shifts (e.g. hotels set `alliance` to "None", use stay-based tiers instead of XP, surface Free Night Certificates in `quirks`).

- Per-program source archive: `plans/sources/[slug].md` (one file per program, regardless of type)
- Future: when 3+ hotels authored, rename skill `add-airline` → `add-program` for clarity.
