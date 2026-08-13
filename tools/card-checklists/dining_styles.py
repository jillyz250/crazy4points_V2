#!/usr/bin/env python3
"""
Six layouts for the dining tracker, drawn at TRUE size (552pt content width).

What a row has to carry: restaurant, date, amount claimed, a rating, and a note
- twice over, because this credit resets in July. The current version stacks
column headings above the fields, which pushes every caption a long way from
the box it labels and eats a line of height per half.

Each version below solves that differently.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "dining-styles.pdf")
B = os.path.join(HERE, "..", "..", "design-assets", "fonts")

pdfmetrics.registerFont(TTFont("Head",   os.path.join(B, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("HeadSm", os.path.join(B, "playfair", "playfair-display-v40-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("Body",   os.path.join(B, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("UIB",    os.path.join(B, "montserrat", "montserrat-v31-latin-700.ttf")))

INK    = HexColor("#2A2140")
MUT    = HexColor("#6E6486")
PURPLE = HexColor("#6B2D8F")
PLUM   = HexColor("#331046")
GOLD   = HexColor("#D4AF37")
GOLD_D = HexColor("#B8901F")
GOLD_L = HexColor("#F5CE5A")
IVORY  = HexColor("#FAF6EC")
BAND   = HexColor("#FBF9F4")
PAPER  = HexColor("#FFFFFF")
ACC    = HexColor("#B03D77")

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Dining tracker - six layouts")


def alpha(col, a):
    return Color(col.red, col.green, col.blue, alpha=a)


def txt(x, y, s, font="Body", size=8, col=INK, center=False, right=False, spacing=0):
    if spacing:
        w = c.stringWidth(s, font, size) + spacing * max(0, len(s) - 1)
        sx = x - w / 2 if center else (x - w if right else x)
        t = c.beginText(); t.setFont(font, size); t.setCharSpace(spacing)
        t.setFillColor(col); t.setTextOrigin(sx, y); t.textOut(s); c.drawText(t)
        t2 = c.beginText(); t2.setCharSpace(0); c.drawText(t2)
        return w
    c.setFont(font, size); c.setFillColor(col)
    (c.drawCentredString if center else (c.drawRightString if right else c.drawString))(x, y, s)
    return c.stringWidth(s, font, size)


def box(x, y, sz=11, col=ACC):
    c.setStrokeColor(col); c.setLineWidth(0.9); c.setFillColor(PAPER)
    c.rect(x, y, sz, sz, stroke=1, fill=1)


def field(x, y, w, h=13):
    c.setStrokeColor(alpha(INK, 0.35)); c.setLineWidth(0.7); c.setFillColor(PAPER)
    c.rect(x, y, w, h, stroke=1, fill=1)


def rule(x, y, w):
    c.setStrokeColor(alpha(INK, 0.28)); c.setLineWidth(0.7)
    c.line(x, y, x + w, y)


def stars(x, y, n=5, sz=8, col=ACC):
    import math
    for i in range(n):
        cx = x + i * (sz + 2.5)
        c.setStrokeColor(alpha(col, 0.75)); c.setLineWidth(0.8)
        pts = []
        for k in range(10):
            r = sz / 2 if k % 2 == 0 else sz / 4.6
            a = -math.pi / 2 + k * math.pi / 5
            pts.append((cx + r * math.cos(a), y + r * math.sin(a)))
        pth = c.beginPath(); pth.moveTo(*pts[0])
        for pt in pts[1:]:
            pth.lineTo(*pt)
        pth.close(); c.drawPath(pth, stroke=1, fill=0)


def book_pill(x, y, label="BOOK"):
    w = c.stringWidth(label, "UIB", 5.6) + 0.8 * (len(label) - 1) + 24
    c.setStrokeColor(alpha(white, 0.85)); c.setLineWidth(0.7)
    c.roundRect(x, y, w, 12, 6, stroke=1, fill=0)
    txt(x + 8, y + 3.6, label, "UIB", 5.6, white, spacing=0.8)
    c.setStrokeColor(white); c.setLineWidth(0.8); c.setLineCap(1)
    ax = x + w - 7
    c.line(ax - 4, y + 6, ax, y + 6)
    c.line(ax - 2, y + 8, ax, y + 6); c.line(ax - 2, y + 4, ax, y + 6)
    return w


def shell(y, h, sub="$300 a year, $150 in each half"):
    c.setFillColor(ACC); c.roundRect(MARGIN, y - 26, CW, 26, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD); c.setLineWidth(0.7)
    c.line(MARGIN + 14, y - 22, MARGIN + CW - 14, y - 22)
    txt(MARGIN + 16, y - 17, "DINING  -  SAPPHIRE EXCLUSIVE TABLES", "UIB", 9, white, spacing=1.5)
    bw = c.stringWidth("BOOK", "UIB", 5.6) + 0.8 * 3 + 24
    book_pill(MARGIN + CW - 16 - bw, y - 20)
    txt(MARGIN + CW - 26 - bw, y - 16, sub, "Body", 7.6, alpha(GOLD_L, 0.95), right=True)
    top = y - 26
    c.setFillColor(PAPER); c.roundRect(MARGIN, top - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(1.2)
    c.roundRect(MARGIN + 1, top - h + 1, CW - 2, h - 2, 7, stroke=1, fill=0)
    return top


def strip(x, y, w, label, goal="$150"):
    c.setFillColor(IVORY); c.roundRect(x, y - 16, w, 16, 6, stroke=0, fill=1)
    c.setFillColor(ACC); c.roundRect(x, y - 16, 4, 16, 2, stroke=0, fill=1)
    txt(x + 13, y - 11.5, label, "UIB", 6.4, ACC, spacing=1.1)
    tx = x + w - 132
    txt(tx, y - 11, "used  $", "Body", 7.2, MUT)
    field(tx + 30, y - 14, 36, 12)
    txt(tx + 72, y - 11, f"/  {goal}", "UIB", 7.4, ACC)
    return y - 16


# ---------------------------------------------------------------- A
def A(y):
    """TIGHTENED ROWS. Same shape as today, but the caption row sits just 8pt
    above its fields instead of floating, and every label is spelled out.
    Cheapest change; keeps everything you already have."""
    h = 178
    top = shell(y, h)
    for half, lab in ((0, "JANUARY - JUNE"), (1, "JULY - DECEMBER")):
        t = strip(MARGIN + 8, top - 8 - half * 86, CW - 16, lab)
        txt(MARGIN + 42, t - 8, "RESTAURANT NAME", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 268, t - 8, "DATE", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 336, t - 8, "$ USED", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 400, t - 8, "WORTH IT?", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 462, t - 8, "NOTES", "UIB", 5.4, GOLD_D)
        cy = t - 22
        for r in range(3):
            if r % 2:
                c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 5, CW - 16, 17, stroke=0, fill=1)
            box(MARGIN + 16, cy - 2, 11)
            field(MARGIN + 40, cy - 3, 216, 12)
            field(MARGIN + 266, cy - 3, 58, 12)
            field(MARGIN + 334, cy - 3, 48, 12)
            stars(MARGIN + 400, cy + 3)
            field(MARGIN + 460, cy - 3, 62, 12)
            cy -= 17


# ---------------------------------------------------------------- B
def B(y):
    """LEDGER LINES. No boxes at all - just ruled lines to write on, like a
    reservation book. Calmest of the six and by far the cheapest to print, but
    on screen there is less signal that these are typeable fields."""
    h = 176
    top = shell(y, h)
    for half, lab in ((0, "JANUARY - JUNE"), (1, "JULY - DECEMBER")):
        t = strip(MARGIN + 8, top - 8 - half * 85, CW - 16, lab)
        txt(MARGIN + 40, t - 9, "RESTAURANT NAME", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 300, t - 9, "DATE", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 366, t - 9, "$ USED", "UIB", 5.4, GOLD_D)
        txt(MARGIN + 430, t - 9, "WORTH IT?", "UIB", 5.4, GOLD_D)
        cy = t - 24
        for r in range(3):
            box(MARGIN + 16, cy - 2, 11)
            rule(MARGIN + 40, cy - 3, 250)
            rule(MARGIN + 300, cy - 3, 56)
            rule(MARGIN + 366, cy - 3, 52)
            stars(MARGIN + 430, cy + 2)
            cy -= 17


# ---------------------------------------------------------------- C
def C(y):
    """HALVES SIDE BY SIDE. January-June on the left, July-December on the
    right. Cuts the section's height almost in half and puts both deadlines in
    view at once - but each restaurant field is narrower."""
    h = 104
    top = shell(y, h)
    pw = (CW - 28) / 2
    for i, lab in enumerate(("JANUARY - JUNE", "JULY - DECEMBER")):
        px = MARGIN + 10 + i * (pw + 8)
        t = strip(px, top - 8, pw, lab)
        txt(px + 30, t - 9, "RESTAURANT NAME", "UIB", 5.2, GOLD_D)
        txt(px + 152, t - 9, "DATE", "UIB", 5.2, GOLD_D)
        txt(px + 202, t - 9, "$", "UIB", 5.2, GOLD_D)
        cy = t - 24
        for r in range(3):
            if r % 2:
                c.setFillColor(BAND); c.rect(px, cy - 5, pw, 17, stroke=0, fill=1)
            box(px + 8, cy - 2, 10)
            field(px + 28, cy - 3, 118, 12)
            field(px + 150, cy - 3, 46, 12)
            field(px + 200, cy - 3, 44, 12)
            cy -= 17


# ---------------------------------------------------------------- D
def D(y):
    """MEAL CARDS. Each dinner is its own little panel: restaurant on top, then
    date, amount and stars underneath. The most generous and the easiest to
    read back later, but it only fits two meals per half."""
    h = 168
    top = shell(y, h)
    for half, lab in ((0, "JANUARY - JUNE"), (1, "JULY - DECEMBER")):
        t = strip(MARGIN + 8, top - 8 - half * 79, CW - 16, lab)
        pw = (CW - 28) / 2
        for i in range(2):
            px = MARGIN + 10 + i * (pw + 8)
            c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.28)); c.setLineWidth(0.8)
            c.roundRect(px, t - 54, pw, 50, 6, stroke=1, fill=1)
            box(px + 10, t - 20, 11)
            field(px + 28, t - 21, pw - 40, 13)
            txt(px + 30, t - 29, "RESTAURANT NAME", "UIB", 5.2, GOLD_D)
            field(px + 28, t - 45, 60, 12)
            txt(px + 30, t - 53, "DATE", "UIB", 5.2, GOLD_D)
            field(px + 96, t - 45, 48, 12)
            txt(px + 98, t - 53, "$ USED", "UIB", 5.2, GOLD_D)
            stars(px + 158, t - 39)
            txt(px + 158, t - 53, "WORTH IT?", "UIB", 5.2, GOLD_D)


# ---------------------------------------------------------------- E
def E(y):
    """NUMBERED VISITS. Drops the column-header row entirely - each line is
    numbered and the captions live inside the row, so nothing floats. Fits four
    meals per half, the most of any version here."""
    h = 178
    top = shell(y, h)
    for half, lab in ((0, "JANUARY - JUNE"), (1, "JULY - DECEMBER")):
        t = strip(MARGIN + 8, top - 8 - half * 84, CW - 16, lab)
        cy = t - 18
        for r in range(3):
            if r % 2:
                c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 5, CW - 16, 16, stroke=0, fill=1)
            txt(MARGIN + 18, cy, f"{r + 1}", "UIB", 7, alpha(ACC, 0.8))
            box(MARGIN + 30, cy - 2, 10)
            field(MARGIN + 50, cy - 3, 200, 12)
            txt(MARGIN + 258, cy, "on", "Body", 6.4, MUT)
            field(MARGIN + 272, cy - 3, 54, 12)
            txt(MARGIN + 332, cy, "spent $", "Body", 6.4, MUT)
            field(MARGIN + 364, cy - 3, 44, 12)
            stars(MARGIN + 420, cy + 3)
            cy -= 16


# ---------------------------------------------------------------- F
def F(y):
    """RESTAURANT FIRST. The restaurant name gets a full-width line of its own
    and everything else tucks underneath in small type. Reads like a diary, and
    gives the longest names room - Exclusive Tables restaurants have long
    names."""
    h = 200
    top = shell(y, h)
    for half, lab in ((0, "JANUARY - JUNE"), (1, "JULY - DECEMBER")):
        t = strip(MARGIN + 8, top - 8 - half * 94, CW - 16, lab)
        cy = t - 18
        for r in range(2):
            if r:
                c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 22, CW - 16, 30, stroke=0, fill=1)
            box(MARGIN + 16, cy - 2, 11)
            field(MARGIN + 40, cy - 3, CW - 66, 13)
            txt(MARGIN + 42, cy - 11, "RESTAURANT NAME", "UIB", 5.2, GOLD_D)
            txt(MARGIN + 42, cy - 22, "date", "Body", 6.4, MUT)
            rule(MARGIN + 62, cy - 24, 70)
            txt(MARGIN + 146, cy - 22, "spent $", "Body", 6.4, MUT)
            rule(MARGIN + 178, cy - 24, 56)
            txt(MARGIN + 248, cy - 22, "worth it?", "Body", 6.4, MUT)
            stars(MARGIN + 288, cy - 19)
            txt(MARGIN + 352, cy - 22, "notes", "Body", 6.4, MUT)
            rule(MARGIN + 380, cy - 24, CW - 406)
            cy -= 34


ITEMS = [
    (A, "A   Tightened rows", "same shape, captions hug their fields"),
    (B, "B   Ledger lines", "no boxes, just ruled lines - cheapest to print"),
    (C, "C   Halves side by side", "both deadlines in view, half the height"),
    (D, "D   Meal cards", "each dinner its own panel; two per half"),
    (E, "E   Numbered visits", "no header row - each row reads as a sentence"),
    (F, "F   Restaurant first", "full-width name line, details tucked under"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "DINING TRACKER - SIX LAYOUTS, ACTUAL SIZE", "UIB", 10, PURPLE, spacing=1.5)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a letter   ({n} of 2)", "Body", 9, MUT, right=True)
    y = PAGE_H - 56
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 150, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 250
    c.showPage()


def duel():
    txt(MARGIN, PAGE_H - 24, "A  vs  E   -   THREE ROWS EACH, ACTUAL SIZE", "UIB", 10,
        PURPLE, spacing=1.5)
    txt(PAGE_W - MARGIN, PAGE_H - 24, "same height - pick on feel", "Body", 9, MUT, right=True)
    y = PAGE_H - 60
    for fn, label, blurb in ((A, "A   Tightened rows", "column captions above the fields"),
                             (E, "E   Numbered visits", "no captions - the row reads as a sentence")):
        txt(MARGIN, y - 9, label, "UIB", 8.5, PURPLE)
        txt(MARGIN + 160, y - 9, blurb, "Body", 7.6, MUT)
        y -= 18
        fn(y)
        y -= 230
    c.showPage()


duel()
sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
