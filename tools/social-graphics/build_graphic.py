#!/usr/bin/env python3
"""
Reusable 1080x1080 branded social graphic generator for crazy4points.

Implements the Core templates from the visual KIT (plans/social-graphics-kit.md):
  - big_word     : solid color field, eyebrow + question headline + huge payoff
                   word + benefit pills. (Excitement)   [default]
  - stat_hero    : one giant number/stat as the focal point + subline.  (Surprise)
  - split        : travel photo on top, solid color panel below with the offer.
                   (Clarity)
  - destination  : full travel photo + gradient overlay + destination label +
                   serif headline + one redemption block.  (Wanderlust)

Every template shares the brand constants (Royal Glow palette, Playfair serif,
logo bottom-center) and the fixed anchors, so the feed reads as one brand.

Reads a JSON config (see examples/) and writes a PNG. Photo templates take a
"photo" path; if omitted they fall back to an on-brand gradient so the layout
still renders. Requires Pillow:  pip install -r requirements.txt

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

PALETTES = {
    "gold": dict(bg=GOLD, accent=PURPLE, eyebrow=PURPLE, head=INK, payoff=PURPLE,
                 sub=INK, pill=PURPLE, pill_text=WHITE, dot=GOLD, cta=PURPLE_D),
    "purple": dict(bg=PURPLE, accent=GOLD, eyebrow=WHITE, head=WHITE, payoff=GOLD,
                   sub=SOFT, pill=PURPLE_D, pill_text=WHITE, dot=GOLD, cta=GOLD),
    # Luxe deep-midnight + gold — a dramatic, premium alternative to the bright
    # purple field. Same anchors, very different mood.
    "midnight": dict(bg=(20, 18, 32), accent=GOLD, eyebrow=GOLD, head=WHITE, payoff=GOLD,
                     sub=(216, 210, 226), pill=(46, 40, 70), pill_text=WHITE, dot=GOLD, cta=GOLD),
}


def _hex(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def build_palette(cfg):
    """Custom color scheme via cfg['colors'] = {primary, accent, bg?} — e.g. team
    colors (Eagles midnight green + silver). Colors are not trademarks, so team
    palettes are brand-safe. Falls back to a named `variant` palette."""
    c = cfg.get("colors")
    if c:
        prim = _hex(c["primary"]) if "primary" in c else PURPLE
        acc = _hex(c["accent"]) if "accent" in c else GOLD
        bg = _hex(c["bg"]) if "bg" in c else prim
        return dict(bg=bg, accent=acc, eyebrow=WHITE, head=WHITE, payoff=acc,
                    sub=SOFT, pill=prim, pill_text=WHITE, dot=acc, cta=acc)
    return PALETTES[cfg.get("variant", "gold")]


def _font(rel, size):
    return ImageFont.truetype(os.path.join(FONTS, rel), size)


def PF800(s): return _font("playfair/playfair-display-v40-latin-800.ttf", s)
def PF600(s): return _font("playfair/playfair-display-v40-latin-600.ttf", s)
def LATO7(s): return _font("lato/lato-v25-latin-700.ttf", s)
def LATO3(s): return _font("lato/lato-v25-latin-300.ttf", s)


# --------------------------------------------------------------------------
# shared helpers
# --------------------------------------------------------------------------
def ctext(d, y, s, f, c, cx=W // 2):
    d.text((cx, y), s, font=f, fill=c, anchor="mm")


def tracked(d, y, s, f, c, tr, cx=W // 2):
    ws = [d.textlength(ch, font=f) for ch in s]
    x = cx - (sum(ws) + tr * (len(s) - 1)) / 2
    for ch, w in zip(s, ws):
        d.text((x, y), ch, font=f, fill=c, anchor="lm")
        x += w + tr


def fit(d, text, maker, max_w, start, floor=48):
    size = start
    while size > floor and d.textlength(text, font=maker(size)) > max_w:
        size -= 4
    return maker(size)


def wrap(d, text, maker, size, max_w):
    """Greedy word-wrap into lines that fit max_w at the given font size."""
    f = maker(size)
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def logo_card(img, d, cfg, cx=W // 2, y_bottom=H - 38):
    logo = Image.open(LOGO).convert("RGBA")
    lw = cfg.get("logo_w", 208)
    lh = round(logo.height * lw / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    cardw, cardh = lw + 72, lh + 44
    cardx, cardy = cx - cardw // 2, y_bottom - cardh
    # soft shadow so the chip holds on photos
    d.rounded_rectangle([cardx + 3, cardy + 4, cardx + cardw + 3, cardy + cardh + 4],
                        radius=24, fill=(0, 0, 0, 60))
    d.rounded_rectangle([cardx, cardy, cardx + cardw, cardy + cardh], radius=24, fill=WHITE)
    img.paste(logo, (cardx + 36, cardy + 22), logo)
    return cardy  # top of the card, for stacking CTA above it


def cover_photo(path, w, h):
    """Load a photo cover-cropped to w x h, or return an on-brand gradient fallback."""
    if path and os.path.exists(os.path.expanduser(path)):
        im = Image.open(os.path.expanduser(path)).convert("RGB")
        scale = max(w / im.width, h / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        left, top = (im.width - w) // 2, (im.height - h) // 2
        return im.crop((left, top, left + w, top + h))
    # fallback: vertical purple->gold gradient (so photo templates still render)
    grad = Image.new("RGB", (w, h))
    for yy in range(h):
        t = yy / max(1, h - 1)
        r = round(PURPLE[0] + (GOLD[0] - PURPLE[0]) * t)
        g = round(PURPLE[1] + (GOLD[1] - PURPLE[1]) * t)
        b = round(PURPLE[2] + (GOLD[2] - PURPLE[2]) * t)
        for xx in range(w):
            grad.putpixel((xx, yy), (r, g, b))
    return grad


def gradient_scrim(img, top_frac=0.45, strength=170):
    """Darken the lower portion of a photo so text on it stays legible."""
    ov = Image.new("RGBA", (img.width, img.height), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    start = int(img.height * top_frac)
    for yy in range(start, img.height):
        t = (yy - start) / max(1, img.height - start)
        od.line([(0, yy), (img.width, yy)], fill=(20, 12, 30, int(strength * t)))
    img.paste(ov, (0, 0), ov)


# --------------------------------------------------------------------------
# templates
# --------------------------------------------------------------------------
def big_word(cfg, img, d, pal):
    d.rounded_rectangle([W / 2 - 70, 96, W / 2 + 70, 104], radius=4, fill=pal["accent"])
    tracked(d, 150, cfg["eyebrow"].upper(), LATO7(27), pal["eyebrow"], 6)
    ctext(d, 238, cfg["headline"], fit(d, cfg["headline"], PF600, W - 2 * MARGIN, 62), pal["head"])
    ctext(d, 348, cfg["payoff"], fit(d, cfg["payoff"], PF800, W - 2 * MARGIN, cfg.get("payoff_size", 122)), pal["payoff"])
    for i, s in enumerate(cfg.get("subtext", [])):
        ctext(d, 470 + i * 44, s, LATO3(36), pal["sub"])

    cardy = logo_card(img, d, cfg)
    cta_y = cardy - 46
    ctext(d, cta_y, cfg["cta"], LATO7(33), pal["cta"])

    pills = cfg.get("pills", [])
    pad_l, dot, gap_dot, pad_r = 42, 18, 22, 46
    text_budget = W - 2 * MARGIN - (pad_l + dot + gap_dot + pad_r)
    psize = 37
    while psize > 24 and pills and max(d.textlength(p, font=LATO7(psize)) for p in pills) > text_budget:
        psize -= 2
    pf = LATO7(psize)
    ph, gap = 76, 20
    n = len(pills)
    bottom = cta_y - 44
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


def stat_hero(cfg, img, d, pal):
    d.rounded_rectangle([W / 2 - 70, 96, W / 2 + 70, 104], radius=4, fill=pal["accent"])
    tracked(d, 158, cfg["eyebrow"].upper(), LATO7(28), pal["eyebrow"], 6)
    # giant number
    ctext(d, 430, cfg["stat"], fit(d, cfg["stat"], PF800, W - 2 * MARGIN, cfg.get("stat_size", 300), floor=120), pal["payoff"])
    # subline (wrapped)
    lines = wrap(d, cfg.get("subline", ""), LATO3, 44, W - 2 * MARGIN)
    for i, ln in enumerate(lines[:2]):
        ctext(d, 640 + i * 56, ln, LATO3(44), pal["sub"])
    # optional micro-bullets (<=2), as centered tracked lines
    for i, mb in enumerate(cfg.get("bullets", [])[:2]):
        ctext(d, 770 + i * 50, mb, LATO7(34), pal["head"])

    cardy = logo_card(img, d, cfg)
    ctext(d, cardy - 46, cfg["cta"], LATO7(33), pal["cta"])


def split(cfg, img, d, pal):
    # top: photo (0..photo_h), bottom: solid color panel with the offer
    photo_h = cfg.get("photo_h", 500)
    photo = cover_photo(cfg.get("photo"), W, photo_h)
    img.paste(photo, (0, 0))
    # panel already the bg color (img was filled with pal.bg); ensure a clean edge
    d.rectangle([0, photo_h, W, H], fill=pal["bg"])
    d.rectangle([0, photo_h, W, photo_h + 8], fill=pal["accent"])  # branded seam divider

    y = photo_h + 64
    tracked(d, y, cfg["eyebrow"].upper(), LATO7(26), pal["eyebrow"], 5)
    y += 60
    for ln in wrap(d, cfg["headline"], PF600, 58, W - 2 * MARGIN):
        ctext(d, y, ln, PF600(58), pal["head"]); y += 70
    y += 10
    for s in cfg.get("lines", [])[:3]:
        ctext(d, y, s, LATO3(40), pal["sub"]); y += 56

    cardy = logo_card(img, d, cfg)
    ctext(d, cardy - 46, cfg["cta"], LATO7(31), pal["cta"])


def destination(cfg, img, d, pal):
    photo = cover_photo(cfg.get("photo"), W, H)
    img.paste(photo, (0, 0))
    gradient_scrim(img, top_frac=0.32, strength=205)  # darken lower two-thirds
    # destination label near the top
    tracked(d, 150, cfg["eyebrow"].upper(), LATO7(30), WHITE, 8)

    # bottom-up: logo, then CTA, then redemption bar, then headline above it
    cardy = logo_card(img, d, cfg)
    cta_y = cardy - 46
    ctext(d, cta_y, cfg["cta"], LATO7(31), WHITE)

    block = cfg.get("lines", [])[:2]
    bar_bottom = cta_y - 40
    if block:
        bar_h = 30 + len(block) * 52
        bar_top = bar_bottom - bar_h
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle([MARGIN, bar_top, W - MARGIN, bar_top + bar_h],
                                             radius=20, fill=(107, 45, 143, 225))
        img.paste(ov, (0, 0), ov)
        for i, s in enumerate(block):
            ctext(d, bar_top + 28 + i * 52, s, LATO7(38), WHITE)
        head_bottom = bar_top - 34
    else:
        head_bottom = bar_bottom - 24

    lines = wrap(d, cfg["headline"], PF600, 74, W - 2 * MARGIN)
    first_y = head_bottom - (len(lines) - 1) * 84 - 20
    for i, ln in enumerate(lines):
        ctext(d, first_y + i * 84, ln, PF600(74), WHITE)


def editorial(cfg, img, d, pal):
    """Left-aligned, magazine-cover feel: a left accent bar, a giant left number,
    a unit line, subline, a solid badge pill, and the URL — the asymmetric
    counterpart to the centered stat_hero."""
    x = MARGIN
    tx = x + 42
    # left accent bar beside the kicker
    d.rectangle([x, 150, x + 12, 300], fill=pal["accent"])
    d.text((tx, 210), cfg.get("eyebrow", "").upper(), font=LATO7(30), fill=pal["eyebrow"], anchor="lm")
    if cfg.get("kicker"):
        d.text((tx, 262), cfg["kicker"].upper(), font=LATO7(30), fill=pal["sub"], anchor="lm")
    # giant number, left-aligned, auto-fit to width
    numf = fit(d, cfg["stat"], PF800, W - tx - MARGIN, cfg.get("stat_size", 260), floor=120)
    d.text((tx, 440), cfg["stat"], font=numf, fill=pal["payoff"], anchor="lm")
    d.text((tx, 575), cfg.get("unit", "MILES").upper(), font=LATO7(50), fill=pal["head"], anchor="lm")
    y = 660
    for ln in wrap(d, cfg.get("subline", ""), LATO3, 40, W - tx - MARGIN)[:2]:
        d.text((tx, y), ln, font=LATO3(40), fill=pal["sub"], anchor="lm"); y += 52
    y += 26
    badge = cfg.get("badge", "FREE TO ENTER  ·  ENTER DAILY")
    bf = LATO7(34)
    bw = d.textlength(badge, font=bf)
    d.rounded_rectangle([tx, y, tx + bw + 56, y + 64], radius=32, fill=pal["accent"])
    d.text((tx + 28, y + 32), badge, font=bf, fill=pal["bg"], anchor="lm")
    y += 100
    d.text((tx, y + 18), cfg.get("cta", ""), font=LATO7(37), fill=pal["cta"], anchor="lm")
    logo_card(img, d, cfg)


def sweeps(cfg, img, d, pal):
    """Centered sweepstakes layout: a notched RIBBON banner eyebrow, a giant
    number lifted high with breathing room + a small flourish rule, then the
    Wyndham-style wording (FREE TO ENTER / NO PURCHASE NEEDED / Enter free at ...)."""
    cx = W // 2
    # ribbon banner eyebrow (forked tails = sweepstakes/award feel)
    eb = cfg.get("eyebrow", "").upper()
    ef = LATO7(30)
    ew = d.textlength(eb, font=ef)
    by, bh = 150, 66
    half = ew / 2 + 46
    bx0, bx1 = cx - half, cx + half
    d.rectangle([bx0, by, bx1, by + bh], fill=pal["accent"])
    notch = 28
    d.polygon([(bx0, by), (bx0 - notch, by), (bx0 - notch + 16, by + bh / 2), (bx0 - notch, by + bh), (bx0, by + bh)], fill=pal["accent"])
    d.polygon([(bx1, by), (bx1 + notch, by), (bx1 + notch - 16, by + bh / 2), (bx1 + notch, by + bh), (bx1, by + bh)], fill=pal["accent"])
    d.text((cx, by + bh / 2), eb, font=ef, fill=pal["bg"], anchor="mm")
    # giant number, lifted high with space around it
    numf = fit(d, cfg["stat"], PF800, W - 2 * MARGIN, cfg.get("stat_size", 340), floor=150)
    ctext(d, 410, cfg["stat"], numf, pal["payoff"])
    # small flourish rule under the number for a touch of interest
    d.rounded_rectangle([cx - 74, 566, cx + 74, 574], radius=4, fill=pal["accent"])
    # value subline
    yy = 632
    for ln in wrap(d, cfg.get("subline", ""), LATO3, 42, W - 2 * MARGIN)[:2]:
        ctext(d, yy, ln, LATO3(42), pal["sub"]); yy += 52
    # Wyndham-style bullets
    yy += 20
    for b in cfg.get("bullets", [])[:2]:
        ctext(d, yy, b, LATO7(42), pal["head"]); yy += 52
    # logo chip first, then pin the CTA a clean gap above it (no overlap)
    cardy = logo_card(img, d, cfg)
    ctext(d, cardy - 42, cfg.get("cta", ""), LATO7(37), pal["cta"])


TEMPLATES = {
    "big_word": big_word,
    "stat_hero": stat_hero,
    "split": split,
    "destination": destination,
    "editorial": editorial,
    "sweeps": sweeps,
}


def render(cfg, out):
    pal = build_palette(cfg)
    img = Image.new("RGB", (W, H), pal["bg"])
    d = ImageDraw.Draw(img)
    tmpl = cfg.get("template", "big_word")
    if tmpl not in TEMPLATES:
        raise SystemExit(f"unknown template '{tmpl}'. options: {', '.join(TEMPLATES)}")
    TEMPLATES[tmpl](cfg, img, d, pal)
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
