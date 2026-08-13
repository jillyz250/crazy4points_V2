#!/usr/bin/env python3
"""
Six MORE takes on the fee-versus-credits maths. Deliberately not bar charts -
the first six were all one horizontal bar dressed six ways, which is why none
of them landed.

Directions here: a receipt, a coin stack, a calendar, a headline, a scale, and
a set of price tags. True size, 552pt content width.

NUMBERS (published Chase amounts, verified 2026-07-21):
    540 monthly ($45 x 12) - 500 The Edit - 300 dining - 300 StubHub -
    300 travel credit - 250 Chase Travel hotels  =  2190  vs a 795 fee.

Only the $300 travel credit auto-applies; the other $1,890 needs you to buy
something specific first. $2,190 is a 2026 figure - the $250 hotel credit ends
12/31/26.

BUG FIXED FROM THE LAST SET: versions 1 and 6 there coloured whole segments by
running total, so "red = the fee" ran to $1,040 while the marker sat at the
true $795 - the line appeared to fall short of its own block. Anything here
that splits at the fee splits at exactly 795/2190.
"""
import os, math
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "value-styles-2.pdf")
B = os.path.join(HERE, "..", "..", "design-assets", "fonts")

pdfmetrics.registerFont(TTFont("Head",   os.path.join(B, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("HeadSm", os.path.join(B, "playfair", "playfair-display-v40-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("Body",   os.path.join(B, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("Mono",   os.path.join(B, "lato", "lato-v25-latin-700.ttf")))
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

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

FEE = 795
# (name, dollars, arrives_without_spending) - the flag is explicit because
# three of these are worth $300 and only ONE of them is automatic.
CREDITS = [("Monthly credits", 540, False), ("The Edit hotel", 500, False),
           ("Dining", 300, False), ("StubHub + viagogo", 300, False),
           ("Travel credit", 300, True), ("Chase Travel hotels", 250, False)]
TOTAL = sum(v for _, v, _ in CREDITS)
AUTO, SPEND, AHEAD = 300, TOTAL - 300, TOTAL - FEE

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Fee vs credits - six more")


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


def card(y, h, dark=False, fill=None):
    bg = PLUM if dark else (fill or PAPER)
    c.setFillColor(bg); c.roundRect(MARGIN, y - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.8 if dark else 0.9)); c.setLineWidth(0.9 if dark else 1.2)
    inset = 5 if dark else 1
    c.roundRect(MARGIN + inset, y - h + inset, CW - inset * 2, h - inset * 2,
                6 if dark else 7, stroke=1, fill=0)


FOOT = "2026 figure. The $250 Chase Travel hotel credit ends 12/31/26."


# ---------------------------------------------------------------- 7
def V7(y):
    """THE RECEIPT. Reads like a till roll: everything itemised, the fee as a
    line item, a rule, then the balance. Familiar shape, and the itemisation
    does the persuading instead of a chart."""
    h = 190
    card(y, h, fill=IVORY)
    txt(MARGIN + 22, y - 24, "WHAT YOU PAID FOR", "UIB", 7.4, GOLD_D, spacing=1.6)
    txt(MARGIN + CW - 22, y - 24, "2026", "UIB", 7.4, alpha(GOLD_D, 0.7), right=True)
    cy = y - 42
    lx, rx = MARGIN + 22, MARGIN + CW - 22
    for name, v, _auto in CREDITS:
        txt(lx, cy, name, "Body", 8, INK)
        w = txt(rx, cy, f"{v:,}.00", "Mono", 8, INK, right=True)
        c.setStrokeColor(alpha(MUT, 0.28)); c.setLineWidth(0.5); c.setDash(1, 2)
        c.line(lx + c.stringWidth(name, "Body", 8) + 6, cy + 2, rx - w - 6, cy + 2)
        c.setDash()
        cy -= 13
    c.setStrokeColor(alpha(INK, 0.4)); c.setLineWidth(0.8)
    c.line(lx, cy + 4, rx, cy + 4)
    cy -= 9
    txt(lx, cy, "CREDITS AVAILABLE", "UIB", 8, INK)
    txt(rx, cy, f"{TOTAL:,}.00", "Mono", 9, INK, right=True)
    cy -= 13
    txt(lx, cy, "ANNUAL FEE", "UIB", 8, INK)
    txt(rx, cy, f"-{FEE:,}.00", "Mono", 9, INK, right=True)
    c.setStrokeColor(INK); c.setLineWidth(1.1)
    c.line(rx - 90, cy - 5, rx, cy - 5)
    cy -= 18
    txt(lx, cy, "YOU'RE UP", "UIB", 9.5, GREEN)
    txt(rx, cy, f"{AHEAD:,}.00", "Mono", 12, GREEN, right=True)
    txt(lx, y - h + 14, f"Only ${AUTO} of this lands on its own. {FOOT}", "Body", 6.2, MUT)


# ---------------------------------------------------------------- 8
def V8(y):
    """THE STACK. Credits as coins piled against the fee as a single column.
    Height does the arguing - you see the pile outgrow the fee without reading
    a number."""
    h = 148
    card(y, h)
    txt(MARGIN + 20, y - 22, "THE FEE, AND WHAT COMES BACK", "UIB", 7.4, GOLD_D, spacing=1.5)
    base = y - h + 34
    maxh = 78
    # fee column
    fx = MARGIN + 70
    fh = maxh * FEE / TOTAL
    c.setFillColor(alpha(INK, 0.16)); c.setStrokeColor(alpha(INK, 0.4)); c.setLineWidth(0.9)
    c.roundRect(fx - 30, base, 60, fh, 3, stroke=1, fill=1)
    txt(fx, base + fh / 2 - 3, f"${FEE}", "UIB", 11, INK, center=True)
    txt(fx, base - 12, "you pay", "Body", 7, MUT, center=True)
    # arrow
    c.setStrokeColor(alpha(GOLD_D, 0.8)); c.setLineWidth(1.2); c.setLineCap(1)
    c.line(fx + 42, base + 30, fx + 68, base + 30)
    c.line(fx + 62, base + 34, fx + 68, base + 30)
    c.line(fx + 62, base + 26, fx + 68, base + 30)
    # credit stack
    sx = MARGIN + 200
    sw = CW - 200 - 40
    cy = base
    for name, v, is_auto in CREDITS:
        seg = maxh * v / TOTAL
        c.setFillColor(alpha(GREEN, 0.8) if is_auto else GOLD_L)
        c.setStrokeColor(alpha(GOLD_D, 0.6)); c.setLineWidth(0.6)
        c.roundRect(sx, cy, sw, seg - 1.5, 2, stroke=1, fill=1)
        if seg > 8:
            txt(sx + 8, cy + seg / 2 - 3.4, name, "Body", 6.6, INK)
            txt(sx + sw - 8, cy + seg / 2 - 3.4, f"${v}", "UIB", 7, INK, right=True)
        cy += seg
    txt(sx + sw / 2, cy + 6, f"${TOTAL:,} available", "UIB", 9, GOLD_D, center=True)
    txt(MARGIN + 20, y - h + 12,
        f"Green is the ${AUTO} that lands on its own. The rest needs you to spend first. {FOOT}",
        "Body", 6.2, MUT)


# ---------------------------------------------------------------- 9
def V9(y):
    """THE CALENDAR. Twelve squares, shaded where that month's credits land, and
    the month the fee is covered is called out. Turns a total into a rhythm -
    and it is the only version that makes the point that this is a year's work."""
    h = 132
    card(y, h, dark=True)
    txt(MARGIN + 20, y - 24, "A $795 FEE, PAID BACK OVER A YEAR", "UIB", 8, GOLD_L, spacing=1.5)
    MO = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
    bx = MARGIN + 20
    pitch = (CW - 40) / 12
    # when each credit realistically lands: monthly all year, travel credit
    # early, the half-year credits at the end of each half, Edit on two stays,
    # hotel credit mid-year. Sums to exactly TOTAL.
    EXTRA = {0: 300, 5: 300, 6: 250, 8: 250, 10: 250, 11: 300}
    cum = 0
    crossed = None
    for i in range(12):
        cum += 45
        cum += EXTRA.get(i, 0)
        if crossed is None and cum >= FEE: crossed = i
        px = bx + i * pitch
        past = cum >= FEE
        c.setFillColor(alpha(GOLD_L, 0.9) if past else alpha(white, 0.14))
        c.roundRect(px + 3, y - 78, pitch - 6, 30, 3, stroke=0, fill=1)
        txt(px + pitch / 2, y - 60, MO[i], "UIB", 8, PLUM if past else alpha(white, 0.8), center=True)
        txt(px + pitch / 2, y - 74, f"{cum:,}", "Body", 5.4,
            alpha(PLUM, 0.75) if past else alpha(white, 0.45), center=True)
    if crossed is not None:
        cxm = bx + crossed * pitch + pitch / 2
        c.setStrokeColor(white); c.setLineWidth(1)
        c.line(cxm, y - 82, cxm, y - 90)
        txt(cxm, y - 99, "fee covered here", "UIB", 6.6, white, center=True)
    txt(MARGIN + 20, y - h + 14,
        f"Running total if you claim each credit as it opens. Ends the year at ${TOTAL:,}. {FOOT}",
        "Body", 6.2, alpha(white, 0.5))


# ---------------------------------------------------------------- 10
def V10(y):
    """THE HEADLINE. No chart at all. One enormous number, one honest sentence
    under it. If the point is 'you are $1,395 up', say it at 40pt and stop."""
    h = 116
    card(y, h)
    txt(MARGIN + 24, y - 26, "IF YOU USE EVERYTHING IN THIS GUIDE", "UIB", 7.4,
        GOLD_D, spacing=1.5)
    n = txt(MARGIN + 24, y - 68, f"${AHEAD:,}", "UIB", 34, PURPLE)
    txt(MARGIN + 34 + n, y - 68, "ahead", "Head", 22, alpha(PURPLE, 0.55))
    txt(MARGIN + 24, y - 86, f"${TOTAL:,} in credits, minus the ${FEE} fee.", "Body", 9, INK)
    txt(MARGIN + 24, y - 100,
        f"${AUTO} of that arrives on its own. The other ${SPEND:,} only shows up if you "
        f"actually use the credits. {FOOT}", "Body", 6.6, MUT)


# ---------------------------------------------------------------- 11
def V11(y):
    """THE SCALE. Fee on one pan, credits on the other, tipped. The only version
    that reads at a glance from across a room - and the tilt says 'worth it'
    faster than any number."""
    h = 186
    card(y, h)
    txt(MARGIN + 20, y - 22, "WEIGH IT UP", "UIB", 7.4, GOLD_D, spacing=1.6)
    cx, cyb = MARGIN + CW / 2, y - 132
    # pivot
    c.setFillColor(alpha(INK, 0.5))
    p = c.beginPath(); p.moveTo(cx - 9, cyb); p.lineTo(cx + 9, cyb); p.lineTo(cx, cyb + 30); p.close()
    c.drawPath(p, fill=1, stroke=0)
    # beam, tipped toward credits
    ang = math.radians(8)
    half = 132
    dx, dy = half * math.cos(ang), half * math.sin(ang)
    c.setStrokeColor(INK); c.setLineWidth(2.2); c.setLineCap(1)
    c.line(cx - dx, cyb + 30 + dy, cx + dx, cyb + 30 - dy)
    # left pan: fee (light side, rides high)
    lx, ly = cx - dx, cyb + 30 + dy
    c.setStrokeColor(alpha(INK, 0.45)); c.setLineWidth(0.8)
    c.line(lx, ly, lx, ly + 16)
    c.setFillColor(alpha(INK, 0.10)); c.setStrokeColor(alpha(INK, 0.4))
    c.roundRect(lx - 52, ly + 16, 104, 30, 4, stroke=1, fill=1)
    txt(lx, ly + 32, f"${FEE}", "UIB", 14, INK, center=True)
    txt(lx, ly + 22, "the fee", "Body", 6.6, MUT, center=True)
    # right pan: credits (heavy side, rides low)
    rx, ry = cx + dx, cyb + 30 - dy
    c.setStrokeColor(alpha(GOLD_D, 0.5)); c.setLineWidth(0.8)
    c.line(rx, ry, rx, ry - 12)
    c.setFillColor(alpha(GOLD_L, 0.35)); c.setStrokeColor(GOLD_D)
    c.roundRect(rx - 60, ry - 46, 120, 34, 4, stroke=1, fill=1)
    txt(rx, ry - 28, f"${TOTAL:,}", "UIB", 16, GOLD_D, center=True)
    txt(rx, ry - 40, "in credits", "Body", 6.6, MUT, center=True)
    txt(MARGIN + 20, y - h + 13,
        f"Tips your way by ${AHEAD:,}, but only ${AUTO} lands without you spending first. {FOOT}",
        "Body", 6.2, MUT)


# ---------------------------------------------------------------- 12
def V12(y):
    """PRICE TAGS. Each credit becomes a little tag with a punched hole, laid
    out like things on a rail. Playful, and the fee sits among them as the one
    tag facing the other way."""
    h = 128
    card(y, h, fill=IVORY)
    txt(MARGIN + 20, y - 22, "WHAT THE FEE BUYS", "UIB", 7.4, GOLD_D, spacing=1.6)
    tags = list(CREDITS)
    tw_, gap = 82, 6
    sx = MARGIN + 20
    ty = y - 92
    for i, (name, v, auto) in enumerate(tags):
        px = sx + i * (tw_ + gap)
        c.setFillColor(alpha(GREEN, 0.12) if auto else PAPER)
        c.setStrokeColor(GREEN if auto else alpha(GOLD_D, 0.55)); c.setLineWidth(0.9)
        pth = c.beginPath()
        pth.moveTo(px + 10, ty + 52); pth.lineTo(px + tw_, ty + 52)
        pth.lineTo(px + tw_, ty); pth.lineTo(px + 10, ty)
        pth.lineTo(px, ty + 26); pth.close()
        c.drawPath(pth, stroke=1, fill=1)
        c.setFillColor(IVORY); c.setStrokeColor(alpha(GOLD_D, 0.5)); c.setLineWidth(0.6)
        c.circle(px + 13, ty + 26, 3, stroke=1, fill=1)
        txt(px + 22, ty + 34, f"${v}", "UIB", 12, GREEN if auto else GOLD_D)
        words = name.split()
        line1 = words[0] if len(words[0]) > 7 else " ".join(words[:2])
        line2 = name[len(line1):].strip()
        txt(px + 22, ty + 22, line1[:14], "Body", 6, INK)
        if line2: txt(px + 22, ty + 14, line2[:14], "Body", 6, INK)
        if auto: txt(px + 22, ty + 6, "no spend needed", "UIB", 4.8, GREEN)
    w0 = txt(MARGIN + 20, y - 104, f"${TOTAL:,} on the rail.", "UIB", 9, INK)
    txt(MARGIN + 28 + w0, y - 104,
        f"The fee is ${FEE}, so you are ${AHEAD:,} up if you take them all.", "Body", 8, MUT)
    txt(MARGIN + 20, y - h + 12, f"Only the green one arrives by itself. {FOOT}", "Body", 6.2, MUT)


ITEMS = [
    (V7,  "7    The receipt", "itemised like a till roll, balance at the bottom"),
    (V8,  "8    The stack", "fee as one column, credits piled beside it"),
    (V9,  "9    The calendar", "twelve months, the fee covered partway through"),
    (V10, "10   The headline", "no chart - one enormous number"),
    (V11, "11   The scale", "tipped, reads from across the room"),
    (V12, "12   Price tags", "each credit a tag on a rail"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "FEE VS CREDITS - SIX MORE, ACTUAL SIZE", "UIB", 10,
        PURPLE, spacing=1.5)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a number   ({n} of 2)", "Body", 9, MUT, right=True)
    txt(MARGIN, PAGE_H - 38, "Not bar charts this time. A receipt, a stack, a calendar, "
        "a headline, a scale, and price tags.", "Body", 7.4, MUT)
    y = PAGE_H - 66
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 150, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 210
    c.showPage()


sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
