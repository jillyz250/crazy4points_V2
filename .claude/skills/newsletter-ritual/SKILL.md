# newsletter-ritual — Jill's weekly newsletter build, section by section

## Purpose
Build the weekly newsletter **one section at a time**, with Jill picking each
section from **real, verified options** (last-N history, this-week's alert pool).
Same human-in-the-loop rhythm as the daily ritual: present a phase, she picks, set
it, send a receipt, next. **Nothing is fabricated; nothing sends unseen.**

## Golden rules (the whole point)
1. **ONE phase at a time** (N1, N2, …). Present the phase's options, wait for her
   call, set it, send a short **`✅ N-x done`** receipt, then the next phase. Never
   dump multiple phases at once.
2. **Always give REAL options from data** — the last-N history, this-week's
   published-alert pool, the live gather* results. Never invent an option.
3. **Multi-source verify EVERY figure** (fee, %, date, threshold, points count)
   BEFORE it goes into a section — official page + one independent current source.
   Jill approves voice and judgment; she should never catch your facts.
   See [[feedback_multi_source_verify_before_draft]].
4. **No em/en dashes. No foreign-currency valuations. No derived point-to-dollar
   or point-to-mile math.** Cite only real program ratios/thresholds.
5. **Show Jill the FULL rendered draft before sending — always.** On her explicit
   approval, send via Resend **throttled ≤4/sec** ([[feedback_resend_rate_limit]]).
6. **The editorial note (Jill's Take) tops the brief** ([[feedback_brief_editorial_top]]);
   no fabrication ([[feedback_newsletter_no_fabrication]]).
7. **Never repeat a recent sweet spot** — check the last 10 SENT (N2).
8. Every link points to a REAL page (alert / card / program), never a raw
   `/alerts/intel-…` URL.

## Kickoff (before N1)
Seed this week's row from the last 7 days + the gather* functions, then refine each
section on Jill's picks:
```
node_modules/.bin/tsx  →  runBuildNewsletter({ force: true })   # seeds newsletters row for week_of = Monday of this week
```
Edits to each section are direct writes to the `newsletters` row for that week_of
(subject, big_story_html, big_story_title, sweet_spot, also_happening,
elevated_bonuses, active_offers, top_experiences, top_sweepstakes, jills_take_html).
Jill reviews via the `/admin/newsletter` preview (refresh after each edit).

---

### N1 · 🎯 The Big Story
1. **Select the big story.** Show the eligible candidates — this week's published
   alerts, most-newsworthy first (devaluations, marquee card offers, timely/seasonal
   hooks; NY-relevant favored, audience is NY-heavy). Recommend one with a one-line
   why. On her pick: set `big_story_ref_id` (+`big_story_ref_type`) and regenerate
   the big story around it, OR write it from the alert's verified content. **Verify
   every figure vs the alert/official** — the auto-generated version can invent
   dates (it did on 2026-08-28: a US Open main-draw date was wrong).
2. **Subject line options.** Give 4-5 punchy options (≤50 chars, varied angles).
   HARD RULE: the subject must **NOT echo the big story's opening line** — tease a
   different angle. Offer a "plus more inside" hook (news/intel/deals) if she wants.
3. **Headline under the big story?** ASK if she wants a headline under the "THE BIG
   STORY" eyebrow. If yes → give options and set `big_story_title`. If no → leave it
   off (the template shows no headline when `big_story_title` is null).

### N2 · 💎 Sweet Spot
1. **Show the last 10 sweet spots from SENT newsletters** (topic + date) so we never
   repeat one: `node scripts/sweet-spot-history.mjs`. Pick a program/topic NOT on it.
2. **Top options from the last 1-2 weeks of alerts** — transfer bonuses, award
   sales, and standout redemptions. For EACH: the value **and** the honest catch
   (e.g. "Turkish is great value but hard to book"). Recommend the most *usable*.
3. On her pick: write the sweet spot, **multi-source-verify every figure**, and if
   it's newly verified, **document it on the program page's `sweet_spots`**
   ([[feedback_check_prose_on_data_change]]).

**Sweet-spot FORMAT (Jill's standard, 2026-08-28):**
- **`topic`** = the headline (short, specific — e.g. "Atmos 4,500-Point Short-Haul
  Flights on American Metal").
- **`takeaway`** = a **bold one-line summary** right under the headline (the "what
  it is in a sentence" — e.g. "Any nonstop American flight under 700 miles is just
  4,500 points one way…"). The render bolds it automatically.
- **`best_uses`** = the "Good for" list — **concrete routes/redemptions with the
  honest catch**, in Jill's warm first-person voice (real, specific examples like
  "Columbus to New York for Thanksgiving," not vague "a short flight"). This renders
  ABOVE the earning section.
- **`mechanic_explainer`** = "How to earn the points" as **tight bullets** (not a
  wall of text): earning paths, buy price + the bonus play, and the catches.
- Voice: personal, relatable, sassy-warm — NOT ad copy. And **no em/en dashes** (the
  render strips them via `noDashes`, but write clean anyway).

### N3 · 📌 Also Happening
Show this week's published-alert pool grouped by theme; recommend a **varied** set
of 3-4 (one devaluation, one card offer, one perk/status win — not three of a kind).
Each links to a real page. She picks; set `also_happening`.

### N4 · ⬆️ Elevated Card Bonuses
Show the current elevated welcome offers (`is_elevated` cards + `card_bonus_signals`).
She picks which to feature; verify each vs the issuer's own page. Set `elevated_bonuses`.

### N5 · 🔁 Active Offers
Transfer bonuses + earning promos live this week. **DROP anything expired or ending
today** (it'll be dead on arrival). She picks; set `active_offers`.

### N6 · 🎭 Experiences
Top points-redeemable experiences, **NY-relevant first**, honest bid-vs-redeem
(auctions = bid-don't-buy). She picks; set `top_experiences`. Learnings (2026-08-28):
- **Link ON-SITE, not external.** Point each card's `link_url` at the program's
  crazy4points directory page (`/experiences/<directory_slug>` from the `experiences`
  table, e.g. `/experiences/united-mileageplus-exclusives`,
  `/experiences/marriott-bonvoy-moments`), NOT the raw United/Delta/Marriott URL.
  Keeps readers on the site. **Gap:** there is NO Delta directory page yet, so Delta
  SkyMiles Experiences have no on-site home (build one, or link external + flag it).
- **Each card takes an `image_url` and a `tag` badge** (Sports / Culinary / College
  Football). Use the listing's own image, or a custom creative (the ND VIP graphic
  at `/campaigns/…`). The render shows the FULL image (no crop) so designed creatives
  with text stay legible.
- **Live-auction disclaimer** renders automatically when any card is an auction.
- Section heading is "Experiences".

### N7 · 🎁 Sweepstakes
Featured points/miles sweepstakes (timeshare excluded, per `isTimeshareSweep`).
She picks; set `top_sweepstakes`.

### N8 · ✍️ Jill's Take
The editorial note that TOPS the brief. Draft it from the week's theme — tie the
sections together in one sharp paragraph. Show her; she edits. Set `jills_take_html`.

### N9 · 📤 Review & Send
Run `verifyNewsletterDraft`, then show the **FULL rendered preview** (`/admin/newsletter`).
On her **explicit** approval, send via Resend **throttled ≤4/sec**. Receipt: subject,
big story, number of sections, recipient count.

---

## Notes
- Newsletters build on Thursdays (or when Jill says "newsletter"); `week_of` is the
  Monday of the current week. Regenerating a still-`draft` row is safe; a `sent` row
  is locked.
- Related: the daily-ritual Phase 20 hands off to this; editorial memory rules
  above; `scripts/sweet-spot-history.mjs`; `runBuildNewsletter` / `buildNewsletterSlots`
  / `verifyNewsletterDraft` / the `gather*` helpers; `newsletterEmailV2.ts` (render).
