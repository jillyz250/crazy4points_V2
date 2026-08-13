#!/usr/bin/env python3
"""
Six layouts for The Edit tracker, drawn at TRUE size (552pt content width).

The problem: one row has to carry a hotel name, dates, a spend figure, and FIVE
on-property benefits - and the benefits have real names ("early check-in / late
check-out"), not the four-letter stubs the current version squeezes them into.
Something has to give. Each version below gives up something different.

Chase's five, verbatim from chase.com/travel/the-edit:
  daily breakfast for 2 - $100 property credit - room upgrade at check-in
  (if available) - early check-in/late check-out (if available) - Wifi
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "edit-styles.pdf")
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
ACC    = HexColor("#3F5BA8")

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("The Edit - six layouts")


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


def shell(y, h, title, sub):
    c.setFillColor(ACC); c.roundRect(MARGIN, y - 26, CW, 26, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD); c.setLineWidth(0.7)
    c.line(MARGIN + 14, y - 22, MARGIN + CW - 14, y - 22)
    txt(MARGIN + 16, y - 17, title.upper(), "UIB", 9, white, spacing=1.5)
    txt(MARGIN + CW - 16, y - 16, sub, "Body", 7.6, alpha(GOLD_L, 0.95), right=True)
    top = y - 26
    c.setFillColor(PAPER); c.roundRect(MARGIN, top - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(1.2)
    c.roundRect(MARGIN + 1, top - h + 1, CW - 2, h - 2, 7, stroke=1, fill=0)
    return top


def strip(x, y, w, label, goal="$500"):
    c.setFillColor(IVORY); c.roundRect(x, y - 16, w, 16, 6, stroke=0, fill=1)
    c.setFillColor(ACC); c.roundRect(x, y - 16, 4, 16, 2, stroke=0, fill=1)
    txt(x + 13, y - 11.5, label, "UIB", 6.4, ACC, spacing=1.1)
    tx = x + w - 140
    txt(tx, y - 11, "used  $", "Body", 7.2, MUT)
    field(tx + 30, y - 14, 38, 12)
    txt(tx + 74, y - 11, f"/  {goal}", "UIB", 7.4, ACC)
    return y - 16


FIVE = ["$100 credit", "breakfast", "room upgrade", "early check-in", "late check-out"]

# ---------------------------------------------------------------- A
def A(y):
    """ONE ROW, FULL WORDS. Notes column sacrificed so the five benefits can use
    real names. Early check-in and late check-out get separate boxes - they are
    two different asks and the old 'early' stub named neither."""
    h = 100
    top = shell(y, h, "The Edit  -  hotel credit", "$250 per booking, up to $500 a year")
    t = strip(MARGIN + 8, top - 8, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    xs = [MARGIN + 176, MARGIN + 246, MARGIN + 310, MARGIN + 388, MARGIN + 468]
    txt(MARGIN + 48, t - 9, "HOTEL", "UIB", 6, GOLD_D)
    txt(MARGIN + 128, t - 9, "DATES", "UIB", 6, GOLD_D)
    txt(xs[0], t - 9, "TICK WHAT YOU ACTUALLY GOT", "UIB", 6, GOLD_D)
    cy = t - 26
    for r in range(3):
        if r % 2:
            c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 7, CW - 16, 21, stroke=0, fill=1)
        box(MARGIN + 16, cy - 2, 12)
        field(MARGIN + 46, cy - 3, 74)
        field(MARGIN + 126, cy - 3, 44)
        for bx, lab in zip(xs, FIVE):
            box(bx, cy - 2, 10)
            txt(bx + 12, cy, lab, "Body", 6.4, INK)
        cy -= 22
    txt(MARGIN + 16, cy + 8, "Wi-Fi is included on every stay. Upgrade and early/late are "
        "\"if available\" - ask at check-in.", "Body", 6.4, MUT)


# ---------------------------------------------------------------- B
def B(y):
    """TWO LINES PER STAY. The stay details sit on line one, the five benefits on
    line two with full names and room to breathe. Costs vertical space, so only
    two stays fit - which happens to be how many $250 bookings reach $500."""
    h = 150
    top = shell(y, h, "The Edit  -  hotel credit", "$250 per booking, up to $500 a year")
    t = strip(MARGIN + 8, top - 8, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    cy = t - 22
    for r in range(2):
        txt(MARGIN + 16, cy, f"STAY {r + 1}", "UIB", 6.4, ACC, spacing=1.0)
        field(MARGIN + 56, cy - 3, 180)
        txt(MARGIN + 58, cy + 12, "HOTEL", "UIB", 5.6, GOLD_D)
        field(MARGIN + 244, cy - 3, 80)
        txt(MARGIN + 246, cy + 12, "DATES", "UIB", 5.6, GOLD_D)
        field(MARGIN + 332, cy - 3, 60)
        txt(MARGIN + 334, cy + 12, "NIGHTS (2 MIN)", "UIB", 5.6, GOLD_D)
        txt(MARGIN + 404, cy, "used  $", "Body", 7, MUT)
        field(MARGIN + 436, cy - 3, 44)
        txt(MARGIN + 486, cy, "/  $250", "UIB", 7.2, ACC)
        by = cy - 20
        bx = MARGIN + 56
        for lab in FIVE:
            box(bx, by - 2, 10)
            w = txt(bx + 12, by, lab, "Body", 6.8, INK)
            bx += 12 + w + 14
        cy -= 46
    txt(MARGIN + 16, cy + 20, "Wi-Fi comes with every stay.", "Body", 6.4, MUT)


# ---------------------------------------------------------------- C
def C(y):
    """BENEFITS AS A LEGEND, NOT A GRID. The five are printed once at the top as
    what you are OWED, and the rows stay clean. Fastest to fill in, but you
    cannot record which benefits a given stay actually delivered."""
    h = 132
    top = shell(y, h, "The Edit  -  hotel credit", "$250 per booking, up to $500 a year")
    c.setFillColor(PLUM)
    c.roundRect(MARGIN + 8, top - 34, CW - 16, 28, 6, stroke=0, fill=1)
    txt(MARGIN + 20, top - 16, "EVERY EDIT STAY OWES YOU", "UIB", 6, GOLD_L, spacing=1.4)
    bx = MARGIN + 20
    for lab in FIVE + ["Wi-Fi"]:
        txt(bx, top - 27, "-", "Body", 7, alpha(GOLD, 0.7))
        w = txt(bx + 7, top - 27, lab, "Body", 7, white)
        bx += 7 + w + 16
    t = strip(MARGIN + 8, top - 40, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    txt(MARGIN + 48, t - 9, "HOTEL YOU STAYED AT", "UIB", 6, GOLD_D)
    txt(MARGIN + 250, t - 9, "DATES", "UIB", 6, GOLD_D)
    txt(MARGIN + 340, t - 9, "NIGHTS", "UIB", 6, GOLD_D)
    txt(MARGIN + 404, t - 9, "GOT EVERYTHING?", "UIB", 6, GOLD_D)
    cy = t - 26
    for r in range(3):
        if r % 2:
            c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 7, CW - 16, 20, stroke=0, fill=1)
        box(MARGIN + 16, cy - 2, 12)
        field(MARGIN + 46, cy - 3, 194)
        field(MARGIN + 248, cy - 3, 82)
        field(MARGIN + 338, cy - 3, 54)
        box(MARGIN + 406, cy - 2, 11); txt(MARGIN + 420, cy, "yes", "Body", 6.8, INK)
        box(MARGIN + 452, cy - 2, 11); txt(MARGIN + 466, cy, "chase it up", "Body", 6.8, INK)
        cy -= 21


# ---------------------------------------------------------------- D
def D(y):
    """TWO STAY CARDS, SIDE BY SIDE. Each booking becomes its own little panel
    with the five benefits listed vertically in full. The most readable, and it
    matches how the credit actually works: two bookings of $250."""
    h = 132
    top = shell(y, h, "The Edit  -  hotel credit", "$250 per booking, up to $500 a year")
    t = strip(MARGIN + 8, top - 8, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    pw = (CW - 28) / 2
    for i in range(2):
        px = MARGIN + 10 + i * (pw + 8)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.3)); c.setLineWidth(0.8)
        c.roundRect(px, t - 92, pw, 88, 6, stroke=1, fill=1)
        txt(px + 10, t - 17, f"STAY {i + 1}", "UIB", 6.4, ACC, spacing=1.1)
        txt(px + pw - 10, t - 17, "used  $", "Body", 6.8, MUT, right=True)
        field(px + pw - 46, t - 20, 36, 11)
        field(px + 10, t - 36, 132, 12)
        txt(px + 12, t - 45, "HOTEL", "UIB", 5.4, GOLD_D)
        field(px + 10, t - 58, 76, 12)
        txt(px + 12, t - 67, "DATES", "UIB", 5.4, GOLD_D)
        field(px + 96, t - 58, 48, 12)
        txt(px + 98, t - 67, "NIGHTS", "UIB", 5.4, GOLD_D)
        by = t - 32
        for lab in FIVE:
            box(px + 156, by, 9)
            txt(px + 168, by + 1.5, lab, "Body", 6.2, INK)
            by -= 11
    txt(MARGIN + 16, t - 104, "Wi-Fi is included on every stay. The upgrade and "
        "early/late times are \"if available\" - ask at check-in.", "Body", 6.4, MUT)


# ---------------------------------------------------------------- E
def E(y):
    """COLUMN GRID WITH A KEY. Short column heads keep the grid tight, and a key
    underneath spells each one out in full. Densest option - fits four stays -
    but you have to look down to decode the columns."""
    h = 136
    top = shell(y, h, "The Edit  -  hotel credit", "$250 per booking, up to $500 a year")
    t = strip(MARGIN + 8, top - 8, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    cols = [MARGIN + 300, MARGIN + 348, MARGIN + 396, MARGIN + 444, MARGIN + 492]
    heads = ["$100", "B'FAST", "UPGR", "EARLY", "LATE"]
    txt(MARGIN + 48, t - 9, "HOTEL YOU STAYED AT", "UIB", 6, GOLD_D)
    txt(MARGIN + 232, t - 9, "DATES", "UIB", 6, GOLD_D)
    for cx, hd in zip(cols, heads):
        txt(cx + 5, t - 9, hd, "UIB", 5.6, GOLD_D, center=True)
    cy = t - 24
    for r in range(4):
        if r % 2:
            c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 6, CW - 16, 18, stroke=0, fill=1)
        box(MARGIN + 16, cy - 2, 11)
        field(MARGIN + 46, cy - 3, 176, 12)
        field(MARGIN + 230, cy - 3, 60, 12)
        for cx in cols:
            box(cx, cy - 2, 11)
        cy -= 19
    c.setStrokeColor(alpha(GOLD, 0.4)); c.setLineWidth(0.6)
    c.line(MARGIN + 16, cy + 8, MARGIN + CW - 16, cy + 8)
    txt(MARGIN + 16, cy - 1, "$100 property credit  -  daily breakfast for 2  -  room upgrade  -  "
        "early check-in  -  late check-out.  Wi-Fi comes as standard.", "Body", 6.2, MUT)


# ---------------------------------------------------------------- F
def F(y):
    """TWO ROWS, GENEROUS. Accepts that $500 is two $250 bookings and stops
    pretending otherwise. Everything gets full names and daylight; nothing is
    abbreviated. The calmest of the six."""
    h = 128
    top = shell(y, h, "The Edit  -  hotel credit", "two bookings of $250, or $500 a year")
    t = strip(MARGIN + 8, top - 8, CW - 16, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MIN")
    cy = t - 22
    for r in range(2):
        if r:
            c.setFillColor(BAND); c.rect(MARGIN + 8, cy - 22, CW - 16, 34, stroke=0, fill=1)
        box(MARGIN + 16, cy - 2, 12)
        field(MARGIN + 46, cy - 3, 150)
        txt(MARGIN + 48, cy + 12, "HOTEL", "UIB", 5.6, GOLD_D)
        field(MARGIN + 204, cy - 3, 66)
        txt(MARGIN + 206, cy + 12, "DATES", "UIB", 5.6, GOLD_D)
        field(MARGIN + 278, cy - 3, 44)
        txt(MARGIN + 280, cy + 12, "NIGHTS", "UIB", 5.6, GOLD_D)
        txt(MARGIN + 336, cy, "used  $", "Body", 7, MUT)
        field(MARGIN + 368, cy - 3, 40)
        txt(MARGIN + 414, cy, "of  $250", "UIB", 7.2, ACC)
        bx = MARGIN + 46
        for lab in FIVE:
            box(bx, cy - 18, 9)
            w = txt(bx + 11, cy - 16.5, lab, "Body", 6.4, INK)
            bx += 11 + w + 12
        cy -= 40
    txt(MARGIN + 16, cy + 6, "Wi-Fi is included on every stay. The upgrade and "
        "early/late times are \"if available\" - ask at check-in.", "Body", 6.4, MUT)


ITEMS = [
    (A, "A   One row, full words", "notes column dropped so benefits get real names"),
    (B, "B   Two lines per stay", "details on top, benefits underneath with room"),
    (C, "C   Benefits as a legend", "printed once as what you're owed; rows stay clean"),
    (D, "D   Two stay cards", "each booking its own panel, benefits listed down"),
    (E, "E   Column grid + key", "densest, four stays, decode the heads below"),
    (F, "F   Two rows, generous", "$500 is two $250 bookings - stop pretending otherwise"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "THE EDIT - SIX LAYOUTS, ACTUAL SIZE", "UIB", 10, PURPLE, spacing=1.6)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a letter   ({n} of 2)", "Body", 9, MUT, right=True)
    y = PAGE_H - 54
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 150, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 190
    c.showPage()


sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
