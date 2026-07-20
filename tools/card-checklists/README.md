# Card Benefits Checklists (fillable PDF generator)

Generates the free, fillable/printable card-benefits checklists offered as
lead magnets (e.g. `/tools/sapphire-reserve-checklist`).

## What this produces
A branded, **fillable** PDF (real AcroForm checkboxes + text fields) that also
prints cleanly. Chase Sapphire Reserve is the first card. 4 pages:

1. Setup tasks (each with a clickable **GO** link to where you activate it),
   monthly + annual credits, earning cheat-sheet
2. Twice-a-year credit trackers (hotel / dining / tickets)
3. $75K spend club, automatic perks, protections, scorecard, key dates
4. Lounge visit tally, auto-summing **What I've Captured**, break-even meter,
   notes, newsletter CTA

## PDF JavaScript (needs Acrobat/Reader — Preview ignores it)
Two behaviours are script-driven, added in `add_cumulative_star_js()` as a
post-process with pypdf:
- **Cascading star ratings** — clicking star 4 fills stars 1-4.
- **Auto-summing total** — `cap_total` adds every ticked credit using the
  dollar values registered in `SUM_CHECKBOXES` / `SUM_TEXTFIELDS`; `net_total`
  subtracts the published annual fee. Both are read-only and listed in the
  AcroForm `/CO` calculation order.

macOS **Preview does not execute PDF JavaScript** — the sheet still fills in
and stars still toggle, the cascade and totals just don't compute. Test in
Acrobat Reader.

**Never set `/NeedAppearances`.** It tells the viewer to discard every field's
appearance stream and redraw it. That destroyed the custom vector stars: the
viewer fell back to the ZapfDingbats checkbox glyph, couldn't find the font,
and painted a black blob over each star ("Unknown font tag 'ZaDb'"). `/ZaDb`
is now registered in the AcroForm `/DR` as a safety net regardless.

## No invented valuations
Every dollar figure that the PDF *prints* is a published Chase amount. Lounge
visits are counted, never priced — the reader supplies their own "worth to me"
number. This is the [[feedback_avoid_derived_math_specificity]] rule.

## Data source (important)
All benefit content is **verified against the issuer's official page** — never
blogs, never model memory. The CSR data mirrors the `credit_cards` record in
Supabase (verified vs chase.com on 2026-07-08). If a card's benefits change,
update the data in the script and regenerate.

## Fonts — the site's brand faces, from `design-assets/fonts/`
Uses the SAME typography as crazy4points.com (see CLAUDE.md), so the PDF and
the site can't drift apart:
- **Playfair Display 700** — editorial headlines only (cover, page titles,
  scorecard, CTA). Avoid it where digits appear: its old-style numerals render
  `$0` so the zero reads as a lowercase "o".
- **Montserrat 600/700** — section bars, tiny uppercase column labels, pills.
- **Lato regular** — all body copy and sub-labels.

The legacy `fonts/` folder (Comfortaa / Varela Round / Patrick Hand) is no
longer used — those were off-brand and read as "wonky" next to the site.

**Gotcha:** always measure with the same font you draw in. `c.stringWidth(s,
FONT, size)` paired with a different `text(..., font=...)` silently produces
overflowing pills — this bit us twice during the brand-font swap.

## Regenerate
```bash
python3 -m venv .venv && ./.venv/bin/pip install reportlab
./.venv/bin/python build_csr.py         # writes csr-2026-checklist.pdf here
# then publish:
cp csr-2026-checklist.pdf ../../public/downloads/csr-2026-benefits-checklist.pdf
# refresh the preview images (needs poppler's pdftoppm):
pdftoppm -png -r 130 csr-2026-checklist.pdf pg
# sips --resampleWidth 900 pg-N.png -> public/images/tools/csr-checklist-pN.png
```

## Adding another card
Copy `build_csr.py`, swap the benefit data (pulled from that card's verified
Supabase record), and add a matching `/tools/<slug>-checklist` page.
