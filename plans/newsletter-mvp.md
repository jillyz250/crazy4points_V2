# Weekly Newsletter — V1 Scope

**Status:** Scoped 2026-04-23. Build in progress on `newsletter-v1-ship11a`.
**Supersedes:** the Fri-auto-send model from the 2026-04-21 revision.
**Memory:** `memory/project_newsletter_v1_decisions.md`

---

## Goal

Ship a weekly email to `subscribers` that (a) is polished and fun — branded, visual, with a weekly comic starring Penny — (b) gives Jill full manual control of what goes out, and (c) surfaces the week's best points/deals content plus a deeply researched "Sweet Spot" play.

## Cadence & send model

- **Wed 6pm ET** — cron generates draft + sends preview to Jill only
- **On-demand** — `Run now` button in admin regenerates the draft anytime
- **Thu (any time)** — Jill opens `/admin/newsletter`, reviews, edits, sends a test to herself, then clicks **Send to Subscribers**
- **NO auto-send.** Manual only. No hold flow.

Statuses on `newsletters` row:
- `draft` — generated, not yet sent
- `sent` — Jill clicked Send to Subscribers; `sent_at` + `recipient_count` populated
- `failed` — Resend error; flagged in admin

## Sections (6-block "read" feel, not a website grid)

1. **Opener** — 2–3 sassy sentences setting the week's vibe
2. **The Big One** — top alert of the week: why it matters + what to do about it. Link to the alert page.
3. **This Week's Haul** — 2–3 deal blurbs (~50 words each), each linking to its alert page
4. **Sweet Spot of the Week** — deeply researched. Explain the mechanic + list 3–4 specific best-use examples (e.g. a 70% transfer bonus to IHG → list best IHG properties to redeem at). Must be the strongest content of the week.
5. **Jill's Take** — 1 short opinion/tip
6. **Footer** — logo, forward-to-friend, unsubscribe

**Length target:** 600–900 words.

## The comic — DEFERRED TO V2

Moved to V2 (2026-04-23). V1 ships without it. The `comic_url` + `comic_meta` columns exist; the renderer has a comic slot that's hidden when null. Safe to add later with no schema changes.

When V2 ships:
- **Recurring heroine:** **Jill** — the lady from the crazy4points logo
- **Rotating villains** keyed to the week's topic (example: "Devaluation Dan")
- Gemini 2.5 Image API with Jill reference image, or MagicLight.ai
- Admin gets `Regenerate` + `Upload your own` buttons

## Subject line

- Sonnet generates **3 options** each week, all saved to the draft
- Admin shows radio buttons (default #1) + a free-text override
- No fixed prefix — hook-only, rotating. Brand voice: sassy traveler-friend (`utils/ai/editorialRules.ts` BRAND_VOICE).

## Generator input

- **Deal candidates:** `content_ideas` rows where `type = 'newsletter'` from the last 7 days. Cap at 8.
- **Tip/Take + Sweet Spot candidates:** `content_ideas` rows where `type = 'blog'` from the last 7 days, preferring `HOT` over `EVERGREEN`. Cap at 3.
- **Exclude** alerts with unresolved fact-check flags (`likely_wrong > 0` or `to_verify > 0`) unless resolved. Newsletter posture is higher-trust than the daily brief.
- **Hard cap:** ~10 items into the Sonnet prompt after merge.

## Schema — `newsletters` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `week_of` | date | Monday of the target week; unique |
| `subject` | text | Jill's chosen subject |
| `subject_options` | jsonb | Array of 3 Sonnet-generated options |
| `body_html` | text | Rendered email HTML |
| `draft_json` | jsonb | Structured block source (opener, big_one, haul[], sweet_spot, jills_take) |
| `comic_url` | text | URL of the generated/uploaded comic image |
| `comic_meta` | jsonb | `{ villain_name, panels, prompt }` for regeneration context |
| `status` | text | `draft \| sent \| failed` |
| `sent_at` | timestamptz | Populated on send |
| `recipient_count` | int | Populated on send |
| `error` | text | Populated on failed |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | auto-updated |

No `body_md`. Edits happen via structured JSON in admin UI; re-render HTML on save.

## Admin UI — `/admin/newsletter`

- List of past weeks (draft / sent) with status pill + send stats
- Click a row → editor view:
  - 3 subject radio buttons + free-text override
  - Text areas per section (opener, big_one, haul[], sweet_spot, jills_take)
  - Comic image preview + `Regenerate` + `Upload your own` buttons
  - Live HTML preview panel on the right
- Buttons:
  - **Save** (saves draft_json, re-renders body_html)
  - **Send test to me** (Resend to Jill's address only — always available)
  - **Run now** (triggers `/api/build-newsletter?force=1` on demand)
  - **Send to subscribers** (DISABLED by default; requires typing the word `Send` in a confirm box. Server-side also rejects requests missing `confirm: "Send"` in body. Double gate so no accidental blast.)

## Visual design (email)

- Branded HTML, ~600px width, mobile-first
- Header: crazy4points logo on soft-purple (`#F8F5FB`)
- Comic sits immediately below header
- Royal Glow palette: purple headings (Playfair Display), Lato body, gold accents + gold CTA buttons
- Deal blocks = card style with subtle purple border and "Read more →" in gold
- Sweet Spot block has a gold-accented callout frame
- Tested in Gmail / Apple Mail / Outlook before launch

## Environment

- `GOOGLE_AI_API_KEY` — Gemini 2.5 Image API (new — add before task 5)
- `RESEND_API_KEY` — already configured, domain verified 2026-04-23
- `ANTHROPIC_API_KEY` — already configured
- `CRON_SECRET` / `INTEL_API_SECRET` — reused auth pattern from `/api/build-brief`

## Deferred to V2+

- Character-consistent comic tool (MagicLight.ai or similar)
- Crazy-[game] + `/play/[week]` landing page
- Subject-line A/B
- Open/click analytics dashboard (Resend captures; no UI v1)
- `category` column on `content_ideas` (only needed once game ships)

## Build order

1. ✅ Rewrite this doc (done)
2. Migration `017_newsletters.sql` — create `newsletters` table
3. Stub `/api/build-newsletter` — auth + insert empty draft row for current week's Monday. No Sonnet, no image, no email. Proves write path.
4. Sonnet prompts + `buildNewsletter.ts` (sections + 3 subjects + deep sweet-spot research)
5. Gemini image generator (`generateComic.ts`) with Penny reference + villain-type keying
6. `buildNewsletterEmail.ts` — branded HTML renderer
7. Wire generator + image + preview email into `/api/build-newsletter`
8. `/admin/newsletter` page — list + editor + 4 buttons
9. `/api/send-newsletter` — Resend send to active subscribers
10. `vercel.json` cron entry: Wed 6pm ET
11. End-to-end dry run to Jill-only recipient list

## First code task (this session)

Tasks 2 + 3: migration + stub route. Proves the write path and unblocks 4–11.
