# Card Benefits Checklists (fillable PDF generator)

Generates the free, fillable/printable card-benefits checklists offered as
lead magnets (e.g. `/tools/sapphire-reserve-checklist`).

## What this produces
A branded, **fillable** PDF (real AcroForm checkboxes + text fields) that also
prints cleanly. Chase Sapphire Reserve is the first card.

## Data source (important)
All benefit content is **verified against the issuer's official page** — never
blogs, never model memory. The CSR data mirrors the `credit_cards` record in
Supabase (verified vs chase.com on 2026-07-08). If a card's benefits change,
update the data in the script and regenerate.

## Fonts (all open-source, bundled in `fonts/`)
- `Comfortaa.ttf` — headers / title (Comfortaa Bold, OFL)
- `VarelaRound.ttf` — body (OFL)
- `PatrickHand.ttf` — handwritten accents (OFL)

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
