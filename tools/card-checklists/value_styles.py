#!/usr/bin/env python3
"""
Six ways to show the fee-versus-credits maths, for the TOP of page 1.
True size, 552pt content width.

THE NUMBERS (each a published Chase amount, verified 2026-07-21):
    540  monthly credits ($45 x 12)      500  The Edit hotel
    300  dining                          300  StubHub + viagogo
    300  travel credit                   250  Chase Travel hotels
  = 2190 against a 795 fee, so 1395 ahead.

TWO THINGS THE OLD SCORECARD GOT WRONG, and every version below fixes:

  1. It said "no extra spend needed". True of $300 - the travel credit, which
     auto-applies. The other $1,890 only arrives if you first buy something
     specific: a two-night prepaid Chase Travel hotel, meals at Exclusive
     Tables, StubHub tickets, DoorDash orders. That is a discount on spending,
     not money back.

  2. $2,190 is a 2026-only figure. The $250 Chase Travel hotel credit ends
     12/31/26, so 2027 is $1,940. Peloton, Lyft and Apple all lapse in 2027 too.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "value-styles.pdf")
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
GREEN  = HexColor("#2D8B56")
RED    = HexColor("#B03D4E")

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

FEE = 795
CREDITS = [("Monthly credits", 540), ("The Edit hotel", 500), ("Dining", 300),
           ("StubHub + viagogo", 300), ("Travel credit", 300),
           ("Chase Travel hotels", 250)]
TOTAL = sum(v for _, v in CREDITS)          # 2190
AUTO = 300                                   # travel credit only
SPEND = TOTAL - AUTO                         # 1890
AHEAD = TOTAL - FEE                          # 1395

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Fee vs credits - six layouts")


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


def field(x, y, w, h=13, col=None):
    c.setStrokeColor(alpha(col or INK, 0.4)); c.setLineWidth(0.7); c.setFillColor(PAPER)
    c.rect(x, y, w, h, stroke=1, fill=1)


def card(y, h, dark=False):
    if dark:
        c.setFillColor(PLUM); c.roundRect(MARGIN, y - h, CW, h, 8, stroke=0, fill=1)
        c.setStrokeColor(alpha(GOLD, 0.8)); c.setLineWidth(0.9)
        c.roundRect(MARGIN + 5, y - h + 5, CW - 10, h - 10, 6, stroke=1, fill=0)
    else:
        c.setFillColor(PAPER); c.roundRect(MARGIN, y - h, CW, h, 8, stroke=0, fill=1)
        c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(1.2)
        c.roundRect(MARGIN + 1, y - h + 1, CW - 2, h - 2, 7, stroke=1, fill=0)
    return y


FOOT = "$2,190 is the 2026 figure. The $250 Chase Travel hotel credit ends 12/31/26."


# ---------------------------------------------------------------- 1
def V1(y):
    """FEE-FIRST LEDGER. Starts at what you owe and subtracts until you are in
    profit, so the reader sees the moment it flips rather than a total handed
    to them."""
    h = 104
    card(y, h)
    txt(MARGIN + 18, y - 22, "THE FEE IS $795. HERE IS WHERE IT GOES.", "UIB", 7.4,
        GOLD_D, spacing=1.4)
    bx, bw = MARGIN + 18, CW - 36
    run = 0
    seg_y = y - 46
    for i, (name, v) in enumerate(CREDITS):
        w = bw * v / TOTAL
        paid = run < FEE
        c.setFillColor(RED if paid else GREEN)
        c.roundRect(bx + bw * run / TOTAL, seg_y, w - 1.5, 16, 2, stroke=0, fill=1)
        run += v
    fx = bx + bw * FEE / TOTAL
    c.setStrokeColor(INK); c.setLineWidth(1.2)
    c.line(fx, seg_y - 5, fx, seg_y + 21)
    txt(fx + 5, seg_y - 15, "fee paid off here", "UIB", 6.4, INK)
    txt(bx, seg_y - 15, "red pays the fee", "Body", 6.6, RED)
    txt(bx + bw, seg_y - 15, f"green is ${AHEAD:,} of profit", "Body", 6.6, GREEN, right=True)
    txt(MARGIN + 18, y - 92, FOOT, "Body", 6.2, MUT)


# ---------------------------------------------------------------- 2
def V2(y):
    """TWO-TIER SPLIT. Separates what lands on its own from what you have to go
    spend to get. Least flattering of the six and the most honest - the old
    scorecard claimed all $2,190 needed no extra spend."""
    h = 106
    card(y, h)
    txt(MARGIN + 18, y - 22, "WHAT THE $795 FEE BUYS YOU", "UIB", 7.4, GOLD_D, spacing=1.4)
    pw = (CW - 46) / 2
    # automatic
    c.setFillColor(HexColor("#E8F2EC")); c.setStrokeColor(alpha(GREEN, 0.5)); c.setLineWidth(0.9)
    c.roundRect(MARGIN + 18, y - 88, pw, 54, 6, stroke=1, fill=1)
    txt(MARGIN + 30, y - 52, f"${AUTO}", "UIB", 20, GREEN)
    txt(MARGIN + 30, y - 64, "lands on its own", "UIB", 7, GREEN)
    txt(MARGIN + 30, y - 76, "the travel credit, applied automatically", "Body", 6.2, MUT)
    # needs spend
    c.setFillColor(BAND); c.setStrokeColor(alpha(GOLD_D, 0.5)); c.setLineWidth(0.9)
    c.roundRect(MARGIN + 28 + pw, y - 88, pw, 54, 6, stroke=1, fill=1)
    txt(MARGIN + 40 + pw, y - 52, f"${SPEND:,}", "UIB", 20, GOLD_D)
    txt(MARGIN + 40 + pw, y - 64, "only if you spend it", "UIB", 7, GOLD_D)
    txt(MARGIN + 40 + pw, y - 76, "hotels, dining, tickets, DoorDash", "Body", 6.2, MUT)
    txt(MARGIN + 18, y - 98, FOOT, "Body", 6.2, MUT)


# ---------------------------------------------------------------- 3
def V3(y):
    """THERMOMETER. One bar, the fee marked across it, credits stacking past.
    The most compact - useful if page 1 can only spare a sliver."""
    h = 84
    card(y, h)
    txt(MARGIN + 18, y - 20, "FEE VS CREDITS", "UIB", 7.4, GOLD_D, spacing=1.4)
    txt(MARGIN + CW - 18, y - 20, FOOT, "Body", 6.2, MUT, right=True)
    bx, bw = MARGIN + 18, CW - 36
    c.setFillColor(BAND); c.setStrokeColor(alpha(GOLD, 0.6)); c.setLineWidth(0.9)
    c.roundRect(bx, y - 56, bw, 20, 10, stroke=1, fill=1)
    c.setFillColor(alpha(GREEN, 0.85))
    c.roundRect(bx, y - 56, bw, 20, 10, stroke=0, fill=1)
    c.setFillColor(RED)
    c.roundRect(bx, y - 56, bw * FEE / TOTAL, 20, 10, stroke=0, fill=1)
    fx = bx + bw * FEE / TOTAL
    c.setStrokeColor(INK); c.setLineWidth(1.2); c.line(fx, y - 60, fx, y - 32)
    txt(bx + 10, y - 49, f"${FEE} fee", "UIB", 8, white)
    txt(bx + bw - 10, y - 49, f"${TOTAL:,} in credits", "UIB", 8, white, right=True)
    txt(fx + 6, y - 70, f"everything past this line is yours: ${AHEAD:,}", "Body", 6.6, INK)


# ---------------------------------------------------------------- 4
def V4(y):
    """WHEN YOU BREAK EVEN. Orders credits by how early in the year you can
    realistically claim them and marks the month the fee is covered. Answers
    'when', which no other version does."""
    h = 112
    card(y, h)
    txt(MARGIN + 18, y - 22, "WHEN THE CARD PAYS FOR ITSELF", "UIB", 7.4, GOLD_D, spacing=1.4)
    MO = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    bx, bw = MARGIN + 20, CW - 40
    step = bw / 12
    # cumulative monthly credits ($45/mo) + the halves as they land
    cum, pts = 0, []
    for i in range(12):
        cum += 45
        if i == 0: cum += 300          # travel credit, auto, early
        if i == 5: cum += 150 + 150    # first-half dining + tickets
        if i == 6: cum += 250          # Edit, first prepaid stay
        pts.append(min(cum, TOTAL))
    maxv = TOTAL
    base, hgt = y - 84, 44
    c.setStrokeColor(alpha(INK, 0.15)); c.setLineWidth(0.6)
    c.line(bx, base, bx + bw, base)
    fy = base + hgt * FEE / maxv
    c.setStrokeColor(RED); c.setLineWidth(0.9); c.setDash(2, 2)
    c.line(bx, fy, bx + bw, fy); c.setDash()
    txt(bx + bw, fy + 3, f"${FEE} fee", "UIB", 6.2, RED, right=True)
    for i, v in enumerate(pts):
        hh = hgt * v / maxv
        c.setFillColor(GREEN if v >= FEE else alpha(GOLD_D, 0.75))
        c.roundRect(bx + i * step + 1.5, base, step - 3, hh, 1.5, stroke=0, fill=1)
        txt(bx + i * step + step / 2, base - 9, MO[i], "UIB", 5.2,
            MUT if v < FEE else GREEN, center=True)
    txt(MARGIN + 18, y - 102, "Assumes you claim each credit as it becomes available. "
        + FOOT, "Body", 6.2, MUT)


# ---------------------------------------------------------------- 5
def V5(y):
    """YOUR NUMBER, NOT CHASE'S. Fillable: you enter what you actually claimed
    and see your own position. The only version that is personal rather than
    promotional - but it is blank on day one, which is a weak opening."""
    h = 100
    card(y, h)
    txt(MARGIN + 18, y - 22, "MY NUMBER SO FAR", "UIB", 7.4, GOLD_D, spacing=1.4)
    cx = MARGIN + 18
    for lab, val, col in (("credits I have claimed", None, GOLD_D),
                          ("the fee", f"- ${FEE}", INK),
                          ("so I am ahead by", None, GREEN)):
        txt(cx, y - 40, lab, "Body", 7, MUT)
        if val is None:
            field(cx, y - 62, 120, 18, col)
        else:
            txt(cx, y - 58, val, "UIB", 16, col)
        cx += 176
    txt(MARGIN + 18, y - 80, f"Chase's own credits add up to ${TOTAL:,} in 2026, "
        f"but only ${AUTO} of that lands without you spending first.", "Body", 6.6, INK)
    txt(MARGIN + 18, y - 92, FOOT, "Body", 6.2, MUT)


# ---------------------------------------------------------------- 6
def V6(y):
    """LEDGER + SPLIT, ON PLUM. The recommendation: the fee-first bar shows when
    you break even, the two figures underneath keep it honest, and the dark
    treatment lets it open page 1 without competing with the header."""
    h = 116
    card(y, h, dark=True)
    txt(MARGIN + 20, y - 24, "DOES THIS CARD PAY FOR ITSELF?", "UIB", 8, GOLD_L, spacing=1.6)
    txt(MARGIN + CW - 20, y - 24, FOOT, "Body", 6.2, alpha(white, 0.55), right=True)
    bx, bw = MARGIN + 20, CW - 40
    seg_y = y - 52
    run = 0
    for name, v in CREDITS:
        w = bw * v / TOTAL
        c.setFillColor(alpha(white, 0.22) if run < FEE else GOLD_L)
        c.roundRect(bx + bw * run / TOTAL, seg_y, w - 1.5, 15, 2, stroke=0, fill=1)
        run += v
    fx = bx + bw * FEE / TOTAL
    c.setStrokeColor(white); c.setLineWidth(1.1); c.line(fx, seg_y - 4, fx, seg_y + 19)
    txt(bx + 6, seg_y + 4.5, f"${FEE} fee", "UIB", 7, white)
    txt(bx + bw - 6, seg_y + 4.5, f"${AHEAD:,} ahead", "UIB", 7, PLUM, right=True)
    txt(MARGIN + 20, y - 78, f"${TOTAL:,}", "UIB", 15, GOLD_L)
    txt(MARGIN + 78, y - 78, "in credits, but read the split:", "Body", 7.4, alpha(white, 0.8))
    txt(MARGIN + 20, y - 96, f"${AUTO}", "UIB", 11, white)
    txt(MARGIN + 54, y - 96, "lands on its own", "Body", 7, alpha(white, 0.75))
    txt(MARGIN + 150, y - 96, f"${SPEND:,}", "UIB", 11, GOLD_L)
    txt(MARGIN + 196, y - 96, "only if you go and spend it", "Body", 7, alpha(white, 0.75))


ITEMS = [
    (V1, "1   Fee-first ledger", "red pays the fee, green is profit"),
    (V2, "2   Two-tier split", "automatic vs you-have-to-spend"),
    (V3, "3   Thermometer", "most compact, one bar"),
    (V4, "4   When you break even", "the only one that answers 'when'"),
    (V5, "5   Your number, not Chase's", "fillable, personal, blank on day one"),
    (V6, "6   Ledger + split, on plum", "recommended: honest and opens the page"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "FEE VS CREDITS - SIX LAYOUTS, ACTUAL SIZE", "UIB", 10,
        PURPLE, spacing=1.5)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a number   ({n} of 2)", "Body", 9, MUT, right=True)
    txt(MARGIN, PAGE_H - 38, f"${TOTAL:,} in credits against a ${FEE} fee. Only ${AUTO} of it "
        f"arrives without you spending money first.", "Body", 7.4, MUT)
    y = PAGE_H - 66
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 170, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 176
    c.showPage()


sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
