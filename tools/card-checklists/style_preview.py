#!/usr/bin/env python3
"""
Tile style sampler for the Sapphire Reserve Owner's Guide.

Six genuinely different treatments of the same tile, so the look can be chosen
by eye instead of argued about. Same content in every one (Peloton) so it is a
fair comparison, and every tile is drawn at ~1.6x the real size so the spacing
is actually visible.

The brief: luxury AND fun. Those pull against each other, so the six deliberately
spread across that range - 1 and 5 are the most restrained, 3 and 6 the most
playful, 2 and 4 in between.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "tile-styles.pdf")
BRAND = os.path.join(HERE, "..", "..", "design-assets", "fonts")
LEGACY = os.path.join(HERE, "fonts")

pdfmetrics.registerFont(TTFont("Play",   os.path.join(BRAND, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("PlaySm", os.path.join(BRAND, "playfair", "playfair-display-v40-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("Lato",   os.path.join(BRAND, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("LatoB",  os.path.join(BRAND, "lato", "lato-v25-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("Mont",   os.path.join(BRAND, "montserrat", "montserrat-v31-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("MontB",  os.path.join(BRAND, "montserrat", "montserrat-v31-latin-700.ttf")))
# rounded face for the playful options
pdfmetrics.registerFont(TTFont("Round",  os.path.join(LEGACY, "Comfortaa.ttf")))

PURPLE   = HexColor("#6B2D8F")
PURPLE_D = HexColor("#4A1A6B")
PLUM     = HexColor("#331046")
GOLD     = HexColor("#D4AF37")
GOLD_L   = HexColor("#F0D078")
IVORY    = HexColor("#FBF6EC")
CREAM    = HexColor("#F6EEDF")
INK      = HexColor("#2A2140")
MUT      = HexColor("#6E6486")
BLUSH    = HexColor("#E8D5F2")

PAGE_W, PAGE_H = letter
c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Sapphire Reserve - tile style options")


def alpha(col, a):
    return Color(col.red, col.green, col.blue, alpha=a)


def txt(x, y, s, font, size, col, center=False, right=False, spacing=0):
    if spacing:
        w = c.stringWidth(s, font, size) + spacing * max(0, len(s) - 1)
        sx = x - w / 2 if center else (x - w if right else x)
        t = c.beginText(); t.setFont(font, size); t.setCharSpace(spacing)
        t.setFillColor(col); t.setTextOrigin(sx, y); t.textOut(s); c.drawText(t)
        return
    c.setFont(font, size); c.setFillColor(col)
    (c.drawCentredString if center else (c.drawRightString if right else c.drawString))(x, y, s)


def bike(cx, cy, col, scale=1.0, lw=1.6):
    """Same bicycle mark, scalable so each style can size it differently."""
    c.setStrokeColor(col); c.setLineWidth(lw); c.setLineCap(1); c.setLineJoin(1)
    r = 4.4 * scale
    lx, rx, wy = cx - 6.6 * scale, cx + 6.6 * scale, cy - 3.2 * scale
    c.circle(lx, wy, r, stroke=1, fill=0)
    c.circle(rx, wy, r, stroke=1, fill=0)
    seat = (cx - 2.4 * scale, cy + 3.6 * scale)
    bar = (cx + 3.6 * scale, cy + 3.6 * scale)
    c.line(lx, wy, *seat); c.line(seat[0], seat[1], bar[0], bar[1])
    c.line(bar[0], bar[1], rx, wy); c.line(seat[0], seat[1], rx, wy)
    c.line(cx - 4.4 * scale, cy + 3.6 * scale, cx - 0.6 * scale, cy + 3.6 * scale)
    c.line(bar[0], bar[1], cx + 5.6 * scale, cy + 4.6 * scale)


def cbox(x, y, size, col, fill=None, lw=1.1, radius=0):
    c.setStrokeColor(col); c.setLineWidth(lw)
    if fill:
        c.setFillColor(fill)
    if radius:
        c.roundRect(x, y, size, size, radius, stroke=1, fill=1 if fill else 0)
    else:
        c.rect(x, y, size, size, stroke=1, fill=1 if fill else 0)


TW, TH = 158, 196          # sampler tile size (~1.6x the real thing)

# ---------------------------------------------------------------- style 1
def style1(x, y):
    """MIDNIGHT GOLD - the restrained one. Even vertical rhythm, gold hairlines,
    everything on a baseline grid so nothing floats."""
    c.setFillColor(PLUM); c.roundRect(x, y - TH, TW, TH, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.6)); c.setLineWidth(0.7)
    c.roundRect(x + 3, y - TH + 3, TW - 6, TH - 6, 6, stroke=1, fill=0)
    txt(x + 16, y - 24, "ACTIVATE", "MontB", 6.2, GOLD_L, spacing=1.4)
    c.setStrokeColor(alpha(GOLD, 0.35)); c.setLineWidth(0.6)
    c.line(x + 16, y - 32, x + TW - 16, y - 32)
    bike(x + TW / 2, y - 62, GOLD_L, scale=1.5, lw=1.9)
    txt(x + TW / 2, y - 100, "Peloton", "PlaySm", 15, white, center=True)
    txt(x + TW / 2, y - 122, "$10/mo credit", "LatoB", 12, GOLD_L, center=True)
    txt(x + TW / 2, y - 138, "activation required", "Lato", 8, alpha(white, 0.6), center=True)
    c.setStrokeColor(alpha(GOLD, 0.35)); c.setLineWidth(0.6)
    c.line(x + 16, y - 154, x + TW - 16, y - 154)
    cbox(x + 16, y - 178, 15, GOLD_L, lw=1.0)
    txt(x + 40, y - 174, "mark done", "Mont", 7.5, alpha(white, 0.65))


# ---------------------------------------------------------------- style 2
def style2(x, y):
    """IVORY & GOLD - luxury stationery. Light, printable, purple serif on cream
    with a gold rule. The most 'invitation card' of the six."""
    c.setFillColor(IVORY); c.setStrokeColor(GOLD); c.setLineWidth(1.1)
    c.roundRect(x, y - TH, TW, TH, 4, stroke=1, fill=1)
    c.setFillColor(GOLD); c.rect(x, y - 5, TW, 5, stroke=0, fill=1)
    txt(x + TW / 2, y - 28, "ACTIVATE", "MontB", 6.2, GOLD, center=True, spacing=1.6)
    bike(x + TW / 2, y - 62, PURPLE, scale=1.5, lw=1.9)
    txt(x + TW / 2, y - 100, "Peloton", "Play", 16, PURPLE, center=True)
    c.setStrokeColor(alpha(GOLD, 0.8)); c.setLineWidth(0.8)
    c.line(x + TW / 2 - 22, y - 108, x + TW / 2 + 22, y - 108)
    txt(x + TW / 2, y - 128, "$10/mo credit", "LatoB", 12.5, INK, center=True)
    txt(x + TW / 2, y - 144, "activation required", "Lato", 8, MUT, center=True)
    cbox(x + TW / 2 - 9, y - 178, 18, PURPLE, fill=white, lw=1.2)


# ---------------------------------------------------------------- style 3
def style3(x, y):
    """PLUM GRADIENT - the showy one. Banded gradient, oversized mark, gold
    corner ribbon. Most 'fun', least printer-friendly."""
    steps = 26
    for i in range(steps):
        t = i / (steps - 1)
        col = Color(0.30 + 0.12 * t, 0.09 + 0.06 * t, 0.42 + 0.14 * t)
        c.setFillColor(col)
        c.rect(x, y - TH + (TH / steps) * i, TW, TH / steps + 0.7, stroke=0, fill=1)
    c.setFillColor(GOLD)
    p = c.beginPath(); p.moveTo(x + TW - 78, y); p.lineTo(x + TW, y)
    p.lineTo(x + TW, y - 30); p.close(); c.drawPath(p, fill=1, stroke=0)
    txt(x + TW - 10, y - 15, "ACTIVATE", "MontB", 6.0, PLUM, right=True, spacing=1.0)
    bike(x + TW / 2, y - 66, GOLD_L, scale=1.9, lw=2.2)
    txt(x + TW / 2, y - 112, "Peloton", "Play", 17, white, center=True)
    txt(x + TW / 2, y - 134, "$10/mo credit", "LatoB", 12.5, GOLD_L, center=True)
    txt(x + TW / 2, y - 149, "activation required", "Lato", 8, alpha(white, 0.62), center=True)
    c.setFillColor(alpha(black, 0.22))
    c.roundRect(x + 10, y - TH + 10, TW - 20, 28, 14, stroke=0, fill=1)
    cbox(x + 22, y - TH + 17, 14, GOLD_L, lw=1.1, radius=3)
    txt(x + 44, y - TH + 21, "I did this", "Mont", 8, GOLD_L)


# ---------------------------------------------------------------- style 4
def style4(x, y):
    """COLOUR BLOCK - editorial split. Purple header carries the mark and tag,
    white body carries the words. Clearest hierarchy, prints beautifully."""
    c.setFillColor(white); c.setStrokeColor(alpha(INK, 0.15)); c.setLineWidth(0.8)
    c.roundRect(x, y - TH, TW, TH, 6, stroke=1, fill=1)
    c.saveState()
    pth = c.beginPath(); pth.roundRect(x, y - TH, TW, TH, 6); c.clipPath(pth, stroke=0)
    c.setFillColor(PURPLE); c.rect(x, y - 84, TW, 84, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(x, y - 88, TW, 4, stroke=0, fill=1)
    c.restoreState()
    txt(x + 14, y - 22, "ACTIVATE", "MontB", 6.2, GOLD_L, spacing=1.4)
    bike(x + TW / 2, y - 56, white, scale=1.5, lw=1.9)
    txt(x + 14, y - 112, "Peloton", "MontB", 12, PURPLE)
    txt(x + 14, y - 134, "$10/mo credit", "LatoB", 13, INK)
    txt(x + 14, y - 150, "activation required", "Lato", 8, MUT)
    c.setStrokeColor(alpha(INK, 0.12)); c.setLineWidth(0.7)
    c.line(x + 14, y - 164, x + TW - 14, y - 164)
    cbox(x + 14, y - 186, 15, PURPLE, fill=white, lw=1.2)
    txt(x + 38, y - 182, "mark done", "Mont", 7.5, MUT)


# ---------------------------------------------------------------- style 5
def style5(x, y):
    """HAIRLINE MINIMAL - the most expensive-looking. Almost no fill, one gold
    rule, the number does the talking. Quietest and cheapest to print."""
    c.setFillColor(white); c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(0.7)
    c.rect(x, y - TH, TW, TH, stroke=1, fill=1)
    txt(x + 16, y - 26, "ACTIVATE", "Mont", 6, GOLD, spacing=2.0)
    bike(x + TW - 30, y - 26, alpha(PURPLE, 0.5), scale=1.0, lw=1.4)
    txt(x + 16, y - 74, "$10", "MontB", 30, PURPLE)
    txt(x + 16, y - 92, "per month", "Lato", 9, MUT)
    c.setStrokeColor(alpha(GOLD, 0.7)); c.setLineWidth(0.7)
    c.line(x + 16, y - 106, x + TW - 16, y - 106)
    txt(x + 16, y - 126, "Peloton", "PlaySm", 14, INK)
    txt(x + 16, y - 142, "activation required", "Lato", 8, MUT)
    cbox(x + TW - 34, y - 182, 16, PURPLE, fill=None, lw=1.1)
    txt(x + 16, y - 178, "mark done", "Mont", 7.5, MUT)


# ---------------------------------------------------------------- style 6
def style6(x, y):
    """CANDY LUXE - the fun one. Rounded face, cream card, thick gold frame,
    the mark sitting in a gold medallion. Friendliest of the six."""
    c.setFillColor(CREAM); c.roundRect(x, y - TH, TW, TH, 18, stroke=0, fill=1)
    c.setStrokeColor(GOLD); c.setLineWidth(2.2)
    c.roundRect(x + 2, y - TH + 2, TW - 4, TH - 4, 16, stroke=1, fill=0)
    c.setFillColor(BLUSH)
    c.roundRect(x + 16, y - 30, 74, 17, 8.5, stroke=0, fill=1)
    txt(x + 24, y - 25, "ACTIVATE", "Round", 6.4, PURPLE, spacing=0.8)
    c.setFillColor(GOLD); c.circle(x + TW / 2, y - 74, 27, stroke=0, fill=1)
    c.setFillColor(CREAM); c.circle(x + TW / 2, y - 74, 23.5, stroke=0, fill=1)
    bike(x + TW / 2, y - 74, PURPLE, scale=1.5, lw=2.0)
    txt(x + TW / 2, y - 116, "Peloton", "Round", 14, PURPLE, center=True)
    txt(x + TW / 2, y - 138, "$10/mo credit", "Round", 13, HexColor("#B8901F"), center=True)
    txt(x + TW / 2, y - 153, "activation required", "Lato", 8, MUT, center=True)
    c.setFillColor(white); c.setStrokeColor(alpha(PURPLE, 0.25)); c.setLineWidth(1)
    c.roundRect(x + 22, y - TH + 14, TW - 44, 26, 13, stroke=1, fill=1)
    cbox(x + 32, y - TH + 20, 14, PURPLE, fill=white, lw=1.2, radius=3)
    txt(x + 54, y - TH + 24, "I did this!", "Round", 8.5, PURPLE)


STYLES = [
    (style1, "1 - Midnight Gold", "restrained, dark, gold hairlines"),
    (style2, "2 - Ivory & Gold", "light stationery, purple serif"),
    (style3, "3 - Plum Gradient", "showy, oversized mark, ribbon"),
    (style4, "4 - Colour Block", "editorial split, clearest hierarchy"),
    (style5, "5 - Hairline Minimal", "quiet, the number does the talking"),
    (style6, "6 - Candy Luxe", "rounded and friendly, gold medallion"),
]

# ---- page ---------------------------------------------------------------
c.setFillColor(PLUM); c.rect(0, PAGE_H - 78, PAGE_W, 78, stroke=0, fill=1)
txt(40, PAGE_H - 42, "SIX WAYS TO BUILD THE TILE", "MontB", 15, white, spacing=2.2)
txt(40, PAGE_H - 62, "Same benefit in every one, drawn about 1.6x actual size. Pick a number.",
    "Lato", 9.5, alpha(white, 0.75))

left, top = 46, PAGE_H - 118
colw, rowh = (PAGE_W - 92) / 3, 250
for i, (fn, label, blurb) in enumerate(STYLES):
    cx = left + (i % 3) * colw
    cy = top - (i // 3) * rowh
    fn(cx, cy)
    txt(cx, cy - TH - 16, label, "MontB", 8.6, PURPLE, spacing=0.6)
    txt(cx, cy - TH - 27, blurb, "Lato", 7.6, MUT)

txt(PAGE_W / 2, 34, "crazy4points  -  tile style options", "Mont", 8, MUT, center=True)
c.showPage()
c.save()
print("wrote", OUT)
