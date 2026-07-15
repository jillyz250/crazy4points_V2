# Social graphics generator

Reusable 1080x1080 branded graphics for Instagram / Facebook, in the
Crazy4Points "Royal Glow" look. One JSON config in, one PNG out.

Templates follow the visual KIT in [`plans/social-graphics-kit.md`](../../plans/social-graphics-kit.md)
(the single source of truth for layouts, emotions, max text payloads, and the
content -> template selection logic). This tool implements the **Core 4**:

| `template` | look | best for |
|---|---|---|
| `big_word` *(default)* | solid field, eyebrow + question + huge payoff word + pills | punchy & stack deals |
| `stat_hero` | one giant number as the focal point + subline | a single big number (75K, 40% off) |
| `split` | travel photo on top, solid color panel below with the offer | dense offers (photo gives guaranteed contrast) |
| `destination` | full travel photo + gradient scrim + serif headline + one redemption bar | destinations, aspirational |

`split` and `destination` take a `"photo"` path; omit it and they fall back to an
on-brand gradient so the layout still renders.

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

Shared: `template` (default `big_word`), `variant` (`"gold"` or `"purple"`),
`eyebrow`, `cta`, `logo_w`, `out`.

- **big_word:** `headline`, `payoff` (the big word), `subtext` (0–2 lines), `pills` (0 or 3), `payoff_size`.
- **stat_hero:** `stat` (the giant number), `subline`, `bullets` (0–2), `stat_size`.
- **split:** `photo`, `headline`, `lines` (up to 3), `photo_h` (default 500).
- **destination:** `photo`, `eyebrow` (the destination label), `headline`, `lines` (1–2, shown on a purple bar).

See `plans/social-graphics-kit.md` for the max text payload per template — if copy
doesn't fit, switch templates rather than shrinking the font.

## Notes

- The lower half (pills → CTA → logo) is laid out **bottom-up**, so adding or
  removing a pill never overlaps the logo.
- Keep it on-brand: no emojis in the graphic, short punchy pills, the real link
  goes in the post's first comment (not on the image).
- Examples included: `rakuten-blackfriday.json` (gold) and
  `best-rate-guarantee.json` (purple).
