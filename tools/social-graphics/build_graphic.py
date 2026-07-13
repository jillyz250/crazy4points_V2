#!/usr/bin/env python3
"""
Reusable 1080x1080 branded social graphic generator for crazy4points.

Produces the square Instagram/Facebook graphics: top accent bar, tracked
eyebrow, a Playfair question headline + a big bold payoff line, one or two
subtext lines, a stack of benefit "pills", a call-to-action, and the
Crazy4Points logo card at the bottom.

It reads a JSON config (see examples/) and writes a PNG. Text auto-fits to the
canvas width, and the lower half (pills / CTA / logo) is laid out bottom-up so
nothing overlaps regardless of how many pills you pass.

Requires Pillow:  pip install -r requirements.txt
Uses the real brand fonts (design-assets/fonts) and logo (public/).

Usage:
    python3 build_graphic.py examples/rakuten-blackfriday.json
    python3 build_graphic.py my-post.json --out ~/Desktop/my-post.png
"""
import argparse
import json
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONTS = os.path.join(ROOT, "design-assets", "fonts")
LOGO = os.path.join(ROOT, "public", "crazy4points-logo.png")
W = H = 1080
MARGIN = 80

# Royal Glow brand palette (see CLAUDE.md).
GOLD = (212, 175, 55)
PURPLE = (107, 45, 143)
PURPLE_D = (80, 32, 110)
INK = (26, 26, 26)
WHITE = (255, 255, 255)
SOFT = (240, 232, 247)

# Two background variants. "gold" = gold field with purple ink (the newer
# look); "purple" = the original deep-purple field with gold accents.
PALETTES = {
    "gold": dict(bg=GOLD, accent=PURPLE, eyebrow=PURPLE, head=INK, payoff=PURPLE,
                 sub=INK, pill=PURPLE, pill_text=WHITE, dot=GOLD, cta=PURPLE_D),
    "purple": dict(bg=PURPLE, accent=GOLD, eyebrow=WHITE, head=WHITE, payoff=GOLD,
                   sub=SOFT, pill=PURPLE_D, pill_text=WHITE, dot=GOLD, cta=GOLD),
}


def _font(rel, size):
    return ImageFont.truetype(os.path.join(FONTS, rel), size)


def PF800(s): return _font("playfair/playfair-display-v40-latin-800.ttf", s)
def PF600(s): return _font("playfair/playfair-display-v40-latin-600.ttf", s)
def LATO7(s): return _font("lato/lato-v25-latin-700.ttf", s)
def LATO3(s): return _font("lato/lato-v25-latin-300.ttf", s)


def render(cfg, out):
    pal = PALETTES[cfg.get("variant", "gold")]
    img = Image.new("RGB", (W, H), pal["bg"])
    d = ImageDraw.Draw(img)

    def ctext(y, s, f, c):
        d.text((W // 2, y), s, font=f, fill=c, anchor="mm")

    def tracked(y, s, f, c, tr):
        ws = [d.textlength(ch, font=f) for ch in s]
        x = (W - (sum(ws) + tr * (len(s) - 1))) / 2
        for ch, w in zip(s, ws):
            d.text((x, y), ch, font=f, fill=c, anchor="lm")
            x += w + tr

    def fit(text, maker, max_w, start, floor=64):
        size = start
        while size > floor and d.textlength(text, font=maker(size)) > max_w:
            size -= 4
        return maker(size)

    # --- top section (fixed positions) ---
    d.rounded_rectangle([W / 2 - 70, 96, W / 2 + 70, 104], radius=4, fill=pal["accent"])
    tracked(150, cfg["eyebrow"].upper(), LATO7(27), pal["eyebrow"], 6)
    ctext(238, cfg["headline"], fit(cfg["headline"], PF600, W - 2 * MARGIN, 62), pal["head"])
    ctext(348, cfg["payoff"], fit(cfg["payoff"], PF800, W - 2 * MARGIN, cfg.get("payoff_size", 122)), pal["payoff"])
    for i, s in enumerate(cfg.get("subtext", [])):
        ctext(470 + i * 44, s, LATO3(36), pal["sub"])

    # --- logo card (bottom-anchored) ---
    logo = Image.open(LOGO).convert("RGBA")
    lw = cfg.get("logo_w", 208)
    lh = round(logo.height * lw / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    cardw, cardh = lw + 72, lh + 44
    cardx, cardy = (W - cardw) // 2, H - cardh - 38
    d.rounded_rectangle([cardx, cardy, cardx + cardw, cardy + cardh], radius=24, fill=WHITE)
    img.paste(logo, (cardx + 36, cardy + 22), logo)

    # --- CTA above the card ---
    cta_y = cardy - 46
    ctext(cta_y, cfg["cta"], LATO7(33), pal["cta"])

    # --- benefit pills, stacked upward from the CTA ---
    pills = cfg["pills"]
    pad_l, dot, gap_dot, pad_r = 42, 18, 22, 46
    text_budget = W - 2 * MARGIN - (pad_l + dot + gap_dot + pad_r)
    psize = 37
    while psize > 24 and max(d.textlength(p, font=LATO7(psize)) for p in pills) > text_budget:
        psize -= 2
    pf = LATO7(psize)
    ph, gap = 76, 20
    n = len(pills)
    bottom = cta_y - 44  # bottom edge of the last pill
    for i, s in enumerate(pills):
        top = bottom - ph - (ph + gap) * (n - 1 - i)
        tw = d.textlength(s, font=pf)
        pw = pad_l + dot + gap_dot + tw + pad_r
        px = (W - pw) / 2
        d.rounded_rectangle([px, top, px + pw, top + ph], radius=41, fill=pal["pill"])
        cy = top + ph / 2
        cx = px + pad_l + dot / 2
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=pal["dot"])
        d.text((px + pad_l + dot + gap_dot, cy), s, font=pf, fill=pal["pill_text"], anchor="lm")

    img.save(out, "PNG")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate a 1080x1080 crazy4points social graphic from a JSON config.")
    ap.add_argument("config", help="path to a JSON config (see examples/)")
    ap.add_argument("--out", help="output PNG path (overrides the config 'out', defaults next to the config)")
    args = ap.parse_args()
    with open(args.config) as f:
        cfg = json.load(f)
    out = args.out or cfg.get("out") or os.path.splitext(args.config)[0] + ".png"
    print("saved:", render(cfg, os.path.expanduser(out)))
