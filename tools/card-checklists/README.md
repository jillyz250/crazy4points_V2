# Card "Companion" Checklists (fillable PDF generator)

Generates the free, fillable/printable card-benefits checklists offered as lead
magnets (e.g. `/tools/sapphire-reserve-checklist`). **Data-driven**: one generic
renderer, one small data file per card.

## Architecture
```
build_companion.py     the generic renderer (layout + draw code) — DO NOT put card data here
cards/csr.py           Chase Sapphire Reserve data (the template to copy)
cards/<slug>.py        a new card = a new data file
build_csr.py           deprecated shim -> build_companion.py --card csr
```
Run it:
```bash
python3 -m venv .venv && ./.venv/bin/pip install reportlab qrcode pypdf pillow
./.venv/bin/python build_companion.py --card csr    # writes csr-2026-checklist.pdf
```

## What a card data file contains (`cards/csr.py`)
Pure data, **no imports from the renderer**. Copy `cards/csr.py` and swap:
- `CARD` — identity/copy dict: `out_name`, `doc_title`, `eyebrow`, `title`,
  `mini_title`, `tagline1/2`, `header_button`, `tracker_total`,
  `cta_headline`, `cta_sub1/2`.
- `GRID` — the "Activate / Link — Start Here" cards. Each: `amt, sub, name,
  note, icon` (+ optional `url`, `field`). **`icon` is a NAME string** the
  renderer maps via `ICONS` (available: peloton, ticket, bag, crown, key,
  phone, passport, tv, music, dine).
- `MONTHLY` — `(name, sub, dollars)` monthly credits (EVERY MONTH grid).
- `EARN` — `(multiplier, category)` pairs for HOW YOU EARN.
- `CAP_LINES` — `(field, label, target)` scorecard categories; the six targets
  should sum to `CARD["tracker_total"]`.
- `SPEND` — five `(title, gold-sub, note)` $75K milestones.
- `PERKS` — `(label, activate_field_or_None)` automatic perks (gold bullets).
- `PROTECT` — flat list of protection strings (KNOW YOU'RE COVERED).
- `RESETS` / `ENDS` — `(when, what)` key-date rows.
- `LOUNGES` — `(name, sub, url)` lounge rows.
- `ANNUAL_FEE`, `TRAVEL_CREDIT` — scalars.
- `SETUP`, `SEMI`, `ANNUAL`, `BREAKEVEN` — data for sections NOT in the current
  4-page layout (kept for reuse); safe to leave as-is.

**Section titles/subs and the per-section copy currently live in
`build_companion.py`** (e.g. "THE EDIT — HOTEL CREDIT", the Travel-Credits
counts/doesn't-count list). Cards with the same section types reuse them; a card
with different benefits needs those sections adjusted in the renderer. Extract
them to the card file as the section library grows (see the `card-companion`
skill).

## Data source (ABSOLUTE)
Every benefit figure, date, and term is **verified against the issuer's official
page/PDF** — never blogs, never model memory. If a card's benefits change,
update `cards/<slug>.py` and regenerate.

## No invented valuations
Every dollar figure the PDF *prints* is a published issuer amount. Lounges and
perks are counted/listed, never priced — the reader supplies their own "worth to
me" number in the scorecard. ([[feedback_avoid_derived_math_specificity]])

## PDF JavaScript (needs Acrobat/Reader — Preview ignores it)
`add_cumulative_star_js()` post-processes with pypdf to add cascading star
ratings (click star 4 fills 1–4) and pairs each card/milestone checkbox with a
"DONE" stamp (native two-widget field, no script). Field tab order is set to
`/Tabs=/R` (row order). Preview still fills in and toggles; only the star
cascade needs Acrobat. **Never set `/NeedAppearances`** (it nukes the vector
stars; `/ZaDb` is registered as a safety net).

## Fonts — the site's brand faces (`design-assets/fonts/`)
Playfair Display 700 (editorial headlines), Montserrat 600/700 (bars, labels,
pills), Lato regular (body). **Gotcha:** measure with the same font you draw in
— `stringWidth(s, FONT, size)` paired with a different `text(font=...)` silently
overflows.

## Publish a card
```bash
cp csr-2026-checklist.pdf ../../public/downloads/csr-2026-benefits-checklist.pdf
pdftoppm -png -r 130 csr-2026-checklist.pdf pg   # then sips -> public/images/tools/
```

## Add another card
Use the **`card-companion` skill** (`/card-companion`), or by hand:
1. Gather the card's benefits from the **issuer's official** pages (verify every
   number/date).
2. `cp cards/csr.py cards/<slug>.py` and fill in the verified data.
3. `./.venv/bin/python build_companion.py --card <slug>`.
4. QC each section against the issuer; check no page overflows the footer.
5. Publish + add a `/tools/<slug>-checklist` page.
