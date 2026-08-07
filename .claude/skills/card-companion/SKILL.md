---
name: card-companion
description: >-
  Build a fillable/printable "Companion" benefits checklist PDF for a credit
  card (like the Chase Sapphire Reserve one). Trigger on "build a companion for
  <card>", "make a benefits checklist for <card>", "add a card companion",
  "new card checklist". Generates cards/<slug>.py + runs the renderer.
---

# card-companion — build a card benefits Companion checklist

## What this is
A repeatable workflow to produce another **Companion** (the 4-page fillable PDF
lead magnet, like the Chase Sapphire Reserve one). The generator is data-driven:
a generic renderer (`tools/card-checklists/build_companion.py`) + one data file
per card (`tools/card-checklists/cards/<slug>.py`). **A new card = a new data
file.** Read `tools/card-checklists/README.md` first — it has the data schema.

## Jill's non-negotiable rules (these override convenience)
- **Issuer sources ONLY.** Every credit amount, date, threshold, protection
  limit, and term is verified against the **issuer's official page/PDF** (or its
  Guide to Benefits) — never blogs, never memory. ([[feedback_card_data_issuer_source_only]], [[feedback_no_unsourced_claims]])
- **No invented valuations.** Only print dollar figures the issuer publishes.
  Lounges/perks are listed or counted, never priced by us — the reader assigns
  their own "worth to me". ([[feedback_avoid_derived_math_specificity]])
- **Cross-check the card's own program page** in Supabase (`credit_cards` +
  `credit_card_benefits`) — the data file and the page must agree; fix whichever
  is wrong (issuer wins). ([[feedback_cross_check_alerts_vs_program_pages]])
- **No em/en-dashes; ASCII-safe** copy in the data. ([[feedback_no_foreign_currency_valuations]])
- Match the brand voice: plain, sassy-useful, benefit/loss-framed. Newsletter is
  **"The Insider List"** — never brand it as "Free". ([[feedback_brand_voice_sassy]])

## Steps (go one at a time; confirm the data before generating)

### 1. Scope the card
Confirm the card, its issuer, the annual fee, and roughly which benefit
categories it has. Not every card fits the CSR's exact sections (Amex Platinum
has airline-fee credits, hotel collection, Uber, etc., not "The Edit" or a "$75K
spend club"). Note which sections apply, which don't, and which are new.

### 2. Gather + verify the data (issuer official)
For each section, pull the numbers from the issuer's official pages and its
Guide to Benefits PDF. Verify: monthly/annual credits and their reset cadence;
earn multipliers; statement-credit targets; elite-status unlocks and spend
thresholds; the full protection limits (and any **New York / state carve-outs**);
every expiration date; lounge guest policies and fees; activation/booking
gotchas (prepaid, night minimums, "bill direct not the App Store", etc.). Also
pull the card's `credit_cards` record from Supabase and reconcile.

### 3. Write the data file
`cp tools/card-checklists/cards/csr.py tools/card-checklists/cards/<slug>.py` and
fill in the verified data per the README schema (CARD, GRID, MONTHLY, EARN,
CAP_LINES, SPEND, PERKS, PROTECT, RESETS, ENDS, LOUNGES, scalars). The six
`CAP_LINES` targets must sum to `CARD["tracker_total"]`. GRID `icon` is a NAME
string (peloton, ticket, bag, crown, key, phone, passport, tv, music, dine — add
a new drawn icon to the renderer if you need one).

### 4. Generate
`cd tools/card-checklists && ./.venv/bin/python build_companion.py --card <slug>`
(deps: reportlab qrcode pypdf pillow). It writes `<out_name>` from CARD.

### 5. QC (the accuracy pass)
- Render each page (`pdftoppm`) and read it. Confirm **no section overflows the
  footer** and no text collides.
- Re-verify each section against the issuer (this is where errors hide — e.g.
  the CSR had a wrong Lyft date and a mislabeled Marriott benefit).
- Confirm the scorecard math adds up to the tracker total, and links/QRs point
  to the right URLs.

### 6. If a section type is new
Section titles + per-section copy currently live in `build_companion.py`. For a
new benefit shape, add a reusable `draw_*` section function there (mirror the
existing ones), and extract its title/sub into the CARD dict so future cards
reuse it. Keep the renderer generic; keep card specifics in the data file.

### 7. Publish (with Jill's go-ahead — it's public-facing)
Copy the PDF to `public/downloads/`, refresh preview images, add a
`/tools/<slug>-checklist` page. Save a versioned copy where Jill keeps them.

## Close
Report what was generated, the verification results (what you checked against the
issuer, anything you corrected), and the outstanding actions (publish/deploy) —
last, per [[feedback_user_action_last]].

## Related
[[project_card_benefits_checklists]], [[project_companion_monetization_reminder]]
(the card-library IS the monetization play), README at
`tools/card-checklists/README.md`.
