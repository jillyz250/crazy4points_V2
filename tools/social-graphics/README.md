# Social graphics generator

Reusable 1080x1080 branded graphics for Instagram / Facebook, in the
Crazy4Points "Royal Glow" look. One JSON config in, one PNG out.

![layout](https://img.shields.io/badge/size-1080x1080-6B2D8F) — top accent bar ·
tracked eyebrow · Playfair question + big bold payoff · 1–2 subtext lines ·
benefit pills · call-to-action · logo card.

## Setup (once)

```bash
cd tools/social-graphics
python3 -m pip install -r requirements.txt   # just Pillow
```

Fonts (Playfair Display + Lato) come from `design-assets/fonts` and the logo
from `public/crazy4points-logo.png` — nothing else to install.

## Generate

```bash
# writes examples/rakuten-blackfriday.png
python3 build_graphic.py examples/rakuten-blackfriday.json

# or send it straight to your Desktop
python3 build_graphic.py examples/rakuten-blackfriday.json --out ~/Desktop/rakuten.png
```

Copy `examples/rakuten-blackfriday.json`, edit the text, run it.

## Config fields

| field | required | notes |
|---|---|---|
| `variant` | no | `"gold"` (gold field, purple ink) or `"purple"` (deep purple, gold accents). Default `gold`. |
| `eyebrow` | yes | Small tracked label up top. Auto-uppercased. |
| `headline` | yes | The Playfair question line. Auto-shrinks to fit. |
| `payoff` | yes | The big bold line under it. Auto-shrinks to fit. |
| `subtext` | no | Array of 1–2 short lines. |
| `pills` | yes | Array of benefit lines (2–4 works cleanly). Font auto-shrinks so the longest fits. |
| `cta` | yes | The line above the logo, e.g. "Full how-to in the comments". |
| `logo_w` | no | Logo width in px (default 208). |
| `payoff_size` | no | Starting font size for the payoff before auto-fit (default 122). |
| `out` | no | Output path; `--out` overrides it. |

## Notes

- The lower half (pills → CTA → logo) is laid out **bottom-up**, so adding or
  removing a pill never overlaps the logo.
- Keep it on-brand: no emojis in the graphic, short punchy pills, the real link
  goes in the post's first comment (not on the image).
- Examples included: `rakuten-blackfriday.json` (gold) and
  `best-rate-guarantee.json` (purple).
