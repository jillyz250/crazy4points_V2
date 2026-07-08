#!/usr/bin/env python3
"""
Chase Sapphire Reserve - 2026 Benefits Checklist (fillable, printable PDF)
Built for crazy4points.com. Data verified against Chase's official page 2026-07-08.
Cute, colorful, playful - branded Royal Glow purple/gold + candy section accents.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
OUT = os.path.join(HERE, "csr-2026-checklist.pdf")

pdfmetrics.registerFont(TTFont("Head", os.path.join(FONTS, "Comfortaa.ttf")))
pdfmetrics.registerFont(TTFont("Body", os.path.join(FONTS, "VarelaRound.ttf")))
pdfmetrics.registerFont(TTFont("Hand", os.path.join(FONTS, "PatrickHand.ttf")))

# ---- palette -------------------------------------------------------------
INK      = HexColor("#2A2140")
MUT      = HexColor("#6E6486")
PURPLE   = HexColor("#6B2D8F")
PURPLE_D = HexColor("#5A237A")
GOLD     = HexColor("#D4AF37")
GOLD_D   = HexColor("#B8901F")
PAPER    = HexColor("#FFFFFF")

# section (header color, soft card tint, line color)
SEC = {
    "setup":   (HexColor("#8A4FD6"), HexColor("#F1E9FB"), HexColor("#DFCFF3")),
    "semi":    (HexColor("#E0699B"), HexColor("#FCE6F1"), HexColor("#F6CFE1")),
    "monthly": (HexColor("#2FA8C7"), HexColor("#E1F4FA"), HexColor("#C6E9F2")),
    "annual":  (HexColor("#F0954C"), HexColor("#FFEEDD"), HexColor("#FAD9BE")),
    "dining":  (HexColor("#E0568A"), HexColor("#FCE1EC"), HexColor("#F6C9DC")),
    "spend":   (HexColor("#C79A20"), HexColor("#FBF3D2"), HexColor("#EFE0A8")),
    "perks":   (HexColor("#4FAE82"), HexColor("#E4F5EC"), HexColor("#C9EAD8")),
    "protect": (HexColor("#7C86D6"), HexColor("#EAECFB"), HexColor("#D3D8F4")),
}

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Chase Sapphire Reserve - 2026 Benefits Checklist")
c.setAuthor("crazy4points.com")

_fid = [0]
def fid(p="f"):
    _fid[0] += 1
    return f"{p}{_fid[0]}"

def alpha(col, a):
    return Color(col.red, col.green, col.blue, alpha=a)

# ---- primitives ----------------------------------------------------------
def rrect_shadow(x, y, w, h, r=12, sh=alpha(INK, 0.10)):
    c.setFillColor(sh)
    c.roundRect(x + 1.6, y - 2.4, w, h, r, stroke=0, fill=1)

def card(x, y_top, w, h, tint, line, r=12, shadow=True):
    """y_top = top edge; draws rounded card downward."""
    if shadow:
        rrect_shadow(x, y_top - h, w, h, r)
    c.setFillColor(tint)
    c.setStrokeColor(line)
    c.setLineWidth(1)
    c.roundRect(x, y_top - h, w, h, r, stroke=1, fill=1)

def star(cx, cy, R, fill, stroke=None, sw=0.8):
    import math
    pts = []
    for i in range(10):
        ang = math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else R * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    p = c.beginPath()
    p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    p.close()
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    c.drawPath(p, stroke=1 if stroke else 0, fill=1 if fill else 0)

def sparkle(cx, cy, s, col):
    c.setStrokeColor(col)
    c.setLineWidth(1.4)
    c.setLineCap(1)
    c.line(cx - s, cy, cx + s, cy)
    c.line(cx, cy - s, cx, cy + s)
    c.line(cx - s*0.55, cy - s*0.55, cx + s*0.55, cy + s*0.55)
    c.line(cx - s*0.55, cy + s*0.55, cx + s*0.55, cy - s*0.55)

def checkbox(x, y, size, name, border):
    c.acroForm.checkbox(
        name=name, x=x, y=y, size=size, buttonStyle="check",
        borderColor=border, fillColor=white, textColor=PURPLE_D,
        borderWidth=1.1, checked=False,
    )

def textfield(x, y, w, h, name, fontsize=9, style="underlined", line=None):
    c.acroForm.textfield(
        name=name, x=x, y=y, width=w, height=h, fontName="Helvetica",
        fontSize=fontsize, borderColor=(line or MUT), fillColor=None,
        textColor=INK, borderWidth=0.8, borderStyle=style, forceBorder=True,
    )

def text(x, y, s, font="Body", size=9, col=INK, center=False, right=False):
    c.setFont(font, size)
    c.setFillColor(col)
    if center:
        c.drawCentredString(x, y, s)
    elif right:
        c.drawRightString(x, y, s)
    else:
        c.drawString(x, y, s)

def section_bar(x, y_top, w, title, key, h=24, icon=None):
    col = SEC[key][0]
    rrect_shadow(x, y_top - h, w, h, 11, alpha(col, 0.28))
    c.setFillColor(col)
    c.roundRect(x, y_top - h, w, h, 11, stroke=0, fill=1)
    tx = x + 14
    if icon:
        icon(x + 15, y_top - h/2, col)
        tx = x + 32
    text(tx, y_top - h + 8, title, font="Head", size=12.5, col=white)
    return y_top - h

# ---- little icons (drawn) ------------------------------------------------
def ic_bolt(cx, cy, col):
    c.setFillColor(white)
    p = c.beginPath()
    p.moveTo(cx+2, cy+7); p.lineTo(cx-4, cy-1); p.lineTo(cx-0.5, cy-1)
    p.lineTo(cx-2, cy-7); p.lineTo(cx+4, cy+1); p.lineTo(cx+0.5, cy+1); p.close()
    c.drawPath(p, fill=1, stroke=0)

def ic_star(cx, cy, col):
    star(cx, cy, 7, white)

def ic_cal(cx, cy, col):
    c.setStrokeColor(white); c.setFillColor(white); c.setLineWidth(1.2)
    c.roundRect(cx-6, cy-6, 12, 11, 2, stroke=1, fill=0)
    c.line(cx-6, cy+1.5, cx+6, cy+1.5)
    c.line(cx-3, cy+5, cx-3, cy+7); c.line(cx+3, cy+5, cx+3, cy+7)

def ic_card(cx, cy, col):
    c.setStrokeColor(white); c.setFillColor(white); c.setLineWidth(1.2)
    c.roundRect(cx-7, cy-5, 14, 10, 2, stroke=1, fill=0)
    c.setFillColor(white); c.rect(cx-7, cy+1, 14, 2.2, stroke=0, fill=1)

def ic_target(cx, cy, col):
    c.setStrokeColor(white); c.setLineWidth(1.3)
    c.circle(cx, cy, 6.5, stroke=1, fill=0)
    c.circle(cx, cy, 3.2, stroke=1, fill=0)
    c.setFillColor(white); c.circle(cx, cy, 1.2, stroke=0, fill=1)

def ic_crown(cx, cy, col):
    c.setFillColor(white)
    p = c.beginPath()
    p.moveTo(cx-7, cy-4); p.lineTo(cx-7, cy+2); p.lineTo(cx-3.5, cy-1.5)
    p.lineTo(cx, cy+4); p.lineTo(cx+3.5, cy-1.5); p.lineTo(cx+7, cy+2)
    p.lineTo(cx+7, cy-4); p.close()
    c.drawPath(p, fill=1, stroke=0)

def ic_shield(cx, cy, col):
    c.setFillColor(white)
    p = c.beginPath()
    p.moveTo(cx, cy+7); p.lineTo(cx+6, cy+4); p.lineTo(cx+6, cy-2)
    p.lineTo(cx, cy-7); p.lineTo(cx-6, cy-2); p.lineTo(cx-6, cy+4); p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setLineCap(1)
    c.line(cx-2.3, cy+0.5, cx-0.5, cy-1.6); c.line(cx-0.5, cy-1.6, cx+3, cy+2.5)

def ic_ticket(cx, cy, col):
    c.setStrokeColor(white); c.setFillColor(white); c.setLineWidth(1.2)
    c.roundRect(cx-7, cy-4.5, 14, 9, 2, stroke=1, fill=0)
    c.setFillColor(col); c.circle(cx-7, cy, 1.6, stroke=0, fill=1); c.circle(cx+7, cy, 1.6, stroke=0, fill=1)
    c.setStrokeColor(white); c.setLineWidth(0.9); c.setDash(1.2, 1.2)
    c.line(cx, cy-4.5, cx, cy+4.5); c.setDash()

def ic_fork(cx, cy, col):
    c.setStrokeColor(white); c.setLineWidth(1.3); c.setLineCap(1)
    c.line(cx-3, cy+7, cx-3, cy-7)
    c.line(cx-5, cy+7, cx-5, cy+2); c.line(cx-1, cy+7, cx-1, cy+2)
    c.line(cx-5, cy+2, cx-1, cy+2)
    c.line(cx+4, cy+7, cx+4, cy-7); c.line(cx+2, cy+7, cx+6, cy+7)

# =========================================================================
# PAGE 1
# =========================================================================
def header_band():
    y = PAGE_H
    bh = 96
    # gradient-ish band: purple base + soft gold band
    c.setFillColor(PURPLE)
    c.rect(0, y - bh, PAGE_W, bh, stroke=0, fill=1)
    c.setFillColor(alpha(PURPLE_D, 1))
    c.rect(0, y - bh, PAGE_W, 5, stroke=0, fill=1)  # bottom edge
    # sparkles
    for (sx, sy, ss) in [(70,y-24,4),(120,y-70,3),(500,y-30,4),(548,y-64,3),(300,y-16,2.5),(430,y-78,3)]:
        sparkle(sx, sy, ss, alpha(GOLD, 0.9))
    # wordmark chip (top-right)
    text(PAGE_W - MARGIN, y - 22, "crazy4points.com", font="Head", size=11, col=GOLD, right=True)
    # title
    text(MARGIN, y - 50, "Chase Sapphire Reserve", font="Head", size=27, col=white)
    text(MARGIN, y - 72, "2026 Benefits Checklist", font="Head", size=14.5, col=GOLD)
    text(MARGIN, y - 88, "Keep it. Check it. Cash it in. You paid $795 - use every penny.",
         font="Hand", size=12.5, col=alpha(white, 0.92))
    # "updated 2026" badge
    bx, by = PAGE_W - MARGIN - 92, y - 84
    c.setFillColor(GOLD)
    c.roundRect(bx, by, 92, 26, 13, stroke=0, fill=1)
    text(bx + 46, by + 9, "UPDATED 2026", font="Head", size=9.5, col=PURPLE_D, center=True)
    return y - bh - 14

def row_line(x, w, y, col):
    c.setStrokeColor(alpha(col, 0.7)); c.setLineWidth(0.7)
    c.setDash(1, 2); c.line(x, y, x + w, y); c.setDash()

# ---- SET IT UP FIRST -----------------------------------------------------
SETUP = [
    ("Activate StubHub credit", "Chase Offers on chase.com or app, then pay with card"),
    ("Activate Peloton credit", "onepeloton.com/digital/promotions/chase"),
    ("Activate DashPass", "DoorDash: set Sapphire as default payment, then activate"),
    ("Activate dining credit", "OpenTable: join Sapphire Exclusive Tables"),
    ("Claim Apple TV+ & Apple Music", "activate by 6/22/2027"),
    ("Link IHG account -> Platinum status", "chase.com or app"),
    ("Enroll Priority Pass Select", "activate to receive your membership"),
    ("Add card to your Lyft account", "$10 credits post in-app"),
    ("Apply Global Entry / TSA / NEXUS", "pay the app fee with your card ($120 back)"),
]

def draw_setup(y):
    key = "setup"; col, tint, line = SEC[key]
    x = MARGIN
    rowh = 18.5
    body_h = len(SETUP) * rowh + 14
    bar_y = section_bar(x, y, CW, "Set It Up First   -   one-time, or you get $0", key, icon=ic_bolt)
    card(x, bar_y, CW, body_h, tint, line, shadow=True)
    cy = bar_y - 16
    for i, (label, sub) in enumerate(SETUP):
        checkbox(x + 14, cy - 3, 13, fid("su"), col)
        text(x + 34, cy, label, font="Body", size=10, col=INK)
        text(x + 34, cy - 9.5, sub, font="Hand", size=9.5, col=MUT)
        # date-done field on the right
        text(x + CW - 150, cy, "done:", font="Body", size=8.5, col=MUT)
        textfield(x + CW - 122, cy - 3, 104, 13, fid("sud"), fontsize=9, line=line)
        if i < len(SETUP) - 1:
            row_line(x + 14, CW - 28, cy - 12, line)
        cy -= rowh
    return bar_y - body_h - 8

# ---- CREDITS: SEMI-ANNUAL -----------------------------------------------
SEMI = [
    ("The Edit", "prepaid hotel, 2-night min - book via Chase Travel", "$250"),
    ("Dining - Sapphire Exclusive Tables", "book through OpenTable", "$150"),
    ("StubHub + viagogo", "concert & event tickets", "$150"),
]
def draw_semi(y):
    key = "semi"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 26
    body_h = 22 + len(SEMI) * rowh + 6
    bar_y = section_bar(x, y, CW, "Credits to Cash In - Twice a Year   ($1,100)", key, icon=ic_card)
    card(x, bar_y, CW, body_h, tint, line)
    # column headers
    colH1 = x + CW - 200; colH2 = x + CW - 96
    text(colH1 + 44, bar_y - 15, "JAN-JUN", font="Head", size=8.5, col=col, right=True)
    text(colH2 + 44, bar_y - 15, "JUL-DEC", font="Head", size=8.5, col=col, right=True)
    cy = bar_y - 40
    for i, (label, sub, amt) in enumerate(SEMI):
        text(x + 16, cy, label, font="Body", size=10.5, col=INK)
        text(x + 16, cy - 10.5, sub, font="Hand", size=9.5, col=MUT)
        text(x + 16, cy - 10.5, "", font="Body", size=8)
        # amount tag
        c.setFillColor(alpha(col, 0.16)); c.roundRect(colH1 - 74, cy - 4, 46, 15, 7, stroke=0, fill=1)
        text(colH1 - 51, cy - 0.5, amt+" x2", font="Head", size=8, col=col, center=True)
        checkbox(colH1 + 20, cy - 3, 15, fid("s1"), col)
        checkbox(colH2 + 20, cy - 3, 15, fid("s2"), col)
        if i < len(SEMI) - 1:
            row_line(x + 16, CW - 32, cy - 15, line)
        cy -= rowh
    return bar_y - body_h - 8

# ---- CREDITS: MONTHLY ----------------------------------------------------
MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"]
MONTHLY = [
    ("Lyft ride credit", "$10/mo  -  in-app"),
    ("DoorDash restaurant", "$5/mo  -  promo"),
    ("DoorDash grocery/retail #1", "$10/mo  -  promo"),
    ("DoorDash grocery/retail #2", "$10/mo  -  promo"),
    ("Peloton membership", "$10/mo  -  statement credit"),
]
def draw_monthly(y):
    key = "monthly"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 23
    grid_x = x + CW - 12 * 20 - 12
    body_h = 22 + len(MONTHLY) * rowh + 6
    bar_y = section_bar(x, y, CW, "Credits to Cash In - Every Month   ($540)", key, icon=ic_cal)
    card(x, bar_y, CW, body_h, tint, line)
    # month letters header
    for m in range(12):
        text(grid_x + m * 20 + 10, bar_y - 15, MONTHS[m], font="Head", size=7.5, col=col, center=True)
    cy = bar_y - 38
    for i, (label, sub) in enumerate(MONTHLY):
        text(x + 16, cy, label, font="Body", size=10, col=INK)
        text(x + 16, cy - 10, sub, font="Hand", size=9.5, col=MUT)
        for m in range(12):
            checkbox(grid_x + m * 20 + 4, cy - 3, 12, fid("mo"), col)
        if i < len(MONTHLY) - 1:
            row_line(x + 16, CW - 32, cy - 14, line)
        cy -= rowh
    return bar_y - body_h - 8

# ---- CREDITS: ANNUAL / ONE-TIME -----------------------------------------
ANNUAL = [
    ("$300 Annual Travel Credit", "auto-applies to travel purchases"),
    ("$250 Chase Travel Hotels", "IHG, Montage, Omni, Pendry... thru 12/31/26"),
    ("$120 Global Entry / TSA / NEXUS", "once every 4 years"),
]
def draw_annual(y):
    key = "annual"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 21
    body_h = 14 + len(ANNUAL) * rowh
    bar_y = section_bar(x, y, CW, "Credits to Cash In - Once a Year", key, icon=ic_target)
    card(x, bar_y, CW, body_h, tint, line)
    cy = bar_y - 18
    for i, (label, sub) in enumerate(ANNUAL):
        checkbox(x + 14, cy - 3, 14, fid("an"), col)
        text(x + 36, cy, label, font="Body", size=10.5, col=INK)
        text(x + 36, cy - 10, sub, font="Hand", size=9.5, col=MUT)
        text(x + CW - 150, cy, "used:", font="Body", size=8.5, col=MUT)
        textfield(x + CW - 122, cy - 3, 104, 13, fid("and"), line=line)
        if i < len(ANNUAL) - 1:
            row_line(x + 14, CW - 28, cy - 14, line)
        cy -= rowh
    return bar_y - body_h - 12

# =========================================================================
# PAGE 2
# =========================================================================
def mini_header(pageno):
    y = PAGE_H
    c.setFillColor(PURPLE); c.rect(0, y - 34, PAGE_W, 34, stroke=0, fill=1)
    for (sx, ss) in [(468,2.8),(508,2.2)]:
        sparkle(sx, y-17, ss, alpha(GOLD, 0.85))
    text(MARGIN, y - 23, "Chase Sapphire Reserve  -  2026 Checklist", font="Head", size=13, col=white)
    text(PAGE_W - MARGIN, y - 22, f"page {pageno}", font="Head", size=10, col=GOLD, right=True)
    return y - 34 - 14

# ---- SPLIT (semi-annual) TRACKERS ---------------------------------------
def half_label_bar(x, w, y, key, label, goal, rows_note):
    col, tint, line = SEC[key]
    c.setFillColor(alpha(col, 0.20))
    c.roundRect(x, y - 17, w, 17, 8, stroke=0, fill=1)
    text(x + 12, y - 12.5, label, font="Head", size=8.5, col=col)
    # tally on the right: "$ ___ / $150 used"
    tx = x + w - 150
    text(tx, y - 12, "used  $", font="Body", size=8, col=MUT)
    textfield(tx + 30, y - 15, 40, 12, fid("tal"), fontsize=8, line=col)
    text(tx + 74, y - 12, f"/  ${goal}", font="Head", size=8, col=col)
    return y - 17

def draw_dining(y, rows_per_half=4):
    key = "dining"; col, tint, line = SEC[key]
    x = MARGIN
    hh = 17; lbl = 13; rowh = 22; gap = 8; pad = 10
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "Dining Tracker - Sapphire Exclusive Tables ($300)", key, icon=ic_fork)
    card(x, bar_y, CW, body_h, tint, line)
    # column x's
    c_go = x + 16; c_rest = x + 40; c_date = x + 246; c_amt = x + 318
    c_rate = x + 374; c_note = x + 440
    def cols():
        ly = cy0
        text(c_go, ly, "GO?", font="Head", size=6.8, col=col)
        text(c_rest, ly, "RESTAURANT", font="Head", size=6.8, col=col)
        text(c_date, ly, "DATE", font="Head", size=6.8, col=col)
        text(c_amt, ly, "$ USED", font="Head", size=6.8, col=col)
        text(c_rate, ly, "RATING", font="Head", size=6.8, col=col)
        text(c_note, ly, "LOVED IT? NOTES", font="Head", size=6.8, col=col)
    def rows():
        cy = cy0 - 15
        for r in range(rows_per_half):
            checkbox(c_go, cy - 2, 12, fid("dgo"), col)
            textfield(c_rest, cy - 3, c_date - c_rest - 8, 13, fid("drest"))
            textfield(c_date, cy - 3, c_amt - c_date - 8, 13, fid("ddate"))
            textfield(c_amt, cy - 3, c_rate - c_amt - 10, 13, fid("damt"))
            for s in range(5):
                star(c_rate + 5 + s * 10.5, cy + 3, 4.4, None, stroke=alpha(col, 0.8), sw=0.9)
            textfield(c_note, cy - 3, x + CW - 12 - c_note, 13, fid("dnote"))
            cy -= rowh
    top = bar_y - pad
    top = half_label_bar(x + 8, CW - 16, top, key, "JANUARY - JUNE", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    top = top - lbl - rows_per_half * rowh - gap
    top = half_label_bar(x + 8, CW - 16, top, key, "JULY - DECEMBER", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    return bar_y - body_h - 10

# ---- TICKETS TRACKER (StubHub & viagogo) --------------------------------
def draw_tickets(y, rows_per_half=3):
    key = "semi"; col, tint, line = SEC[key]  # reuse pink for the ticket theme
    x = MARGIN
    hh = 17; lbl = 13; rowh = 22; gap = 8; pad = 10
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "Tickets Tracker - StubHub & viagogo ($300)", key, icon=ic_ticket)
    card(x, bar_y, CW, body_h, tint, line)
    c_go = x + 16; c_evt = x + 40; c_where = x + 220; c_date = x + 320
    c_amt = x + 390; c_note = x + 448
    def cols():
        ly = cy0
        text(c_go, ly, "GOT?", font="Head", size=6.8, col=col)
        text(c_evt, ly, "EVENT / SHOW", font="Head", size=6.8, col=col)
        text(c_where, ly, "WHERE", font="Head", size=6.8, col=col)
        text(c_date, ly, "DATE", font="Head", size=6.8, col=col)
        text(c_amt, ly, "$ USED", font="Head", size=6.8, col=col)
        text(c_note, ly, "NOTES", font="Head", size=6.8, col=col)
    def rows():
        cy = cy0 - 15
        for r in range(rows_per_half):
            checkbox(c_go, cy - 2, 12, fid("tgo"), col)
            textfield(c_evt, cy - 3, c_where - c_evt - 8, 13, fid("tevt"))
            textfield(c_where, cy - 3, c_date - c_where - 8, 13, fid("twhere"))
            textfield(c_date, cy - 3, c_amt - c_date - 8, 13, fid("tdate"))
            textfield(c_amt, cy - 3, c_note - c_amt - 8, 13, fid("tamt"))
            textfield(c_note, cy - 3, x + CW - 12 - c_note, 13, fid("tnote"))
            cy -= rowh
    top = bar_y - pad
    top = half_label_bar(x + 8, CW - 16, top, key, "JANUARY - JUNE", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    top = top - lbl - rows_per_half * rowh - gap
    top = half_label_bar(x + 8, CW - 16, top, key, "JULY - DECEMBER", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    return bar_y - body_h - 10

# ---- $75K SPEND CLUB -----------------------------------------------------
SPEND = [
    ("World of Hyatt Explorist status", "link your World of Hyatt account"),
    ("IHG One Rewards Diamond Elite", "auto if IHG already linked"),
    ("$250 The Shops at Chase credit", "applied automatically"),
    ("$500 Southwest Chase Travel credit", "prepaid Southwest via Chase Travel"),
    ("Southwest Rapid Rewards A-List", "link account, allow 10-15 days"),
]
def draw_spend(y):
    key = "spend"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 19
    body_h = 40 + len(SPEND) * rowh
    bar_y = section_bar(x, y, CW, "The $75K Spend Club - unlock by spending $75,000/yr", key, icon=ic_target)
    card(x, bar_y, CW, body_h, tint, line)
    # progress tracker
    text(x + 16, bar_y - 20, "My spend so far:", font="Body", size=9.5, col=INK)
    textfield(x + 108, bar_y - 24, 70, 14, fid("spd"), fontsize=9.5, line=col)
    text(x + 182, bar_y - 20, "/  $75,000", font="Head", size=9.5, col=col)
    # progress bar track
    pbx = x + 270; pbw = CW - 270 - 16
    c.setFillColor(white); c.setStrokeColor(line); c.setLineWidth(1)
    c.roundRect(pbx, bar_y - 24, pbw, 12, 6, stroke=1, fill=1)
    for t in range(1, 4):
        tx = pbx + pbw * t / 4
        c.setStrokeColor(alpha(col, 0.4)); c.line(tx, bar_y - 24, tx, bar_y - 12)
    cy = bar_y - 44
    for i, (label, sub) in enumerate(SPEND):
        checkbox(x + 14, cy - 2, 12, fid("sp"), col)
        text(x + 34, cy, label, font="Body", size=9.8, col=INK)
        text(x + 34 + c.stringWidth(label, "Body", 9.8) + 8, cy, "- " + sub, font="Hand", size=9.3, col=MUT)
        cy -= rowh
    return bar_y - body_h - 12

# ---- PERKS & STATUS ------------------------------------------------------
PERKS = [
    "IHG One Rewards Platinum (thru 12/31/27)",
    "Chase Sapphire Lounges (+2 guests)",
    "Priority Pass Select (1,300+ lounges)",
    "Air Canada Maple Leaf Lounges & Cafes",
    "Points Boost - up to 2x on flights & hotels",
    "1:1 transfer to airline & hotel partners",
    "Reserve Travel Designers ($300/trip)",
]
def draw_perks(y):
    key = "perks"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 18
    n = len(PERKS); percol = (n + 1) // 2
    body_h = 14 + percol * rowh
    bar_y = section_bar(x, y, CW, "Perks You Get Automatically", key, icon=ic_crown)
    card(x, bar_y, CW, body_h, tint, line)
    colw = CW / 2
    cy = bar_y - 18
    for i, label in enumerate(PERKS):
        cxx = x + 14 + (colw if i >= percol else 0)
        yy = cy - (i - percol if i >= percol else i) * rowh
        checkbox(cxx, yy - 2, 11, fid("pk"), col)
        text(cxx + 18, yy, label, font="Body", size=9.3, col=INK)
    return bar_y - body_h - 12

# ---- EARNING CHEAT SHEET -------------------------------------------------
EARN = [("8x","Travel"),("5x","Lyft"),("4x","flights"),
        ("4x","hotels"),("3x","dining"),("10x","Peloton"),("1x","all else")]
def draw_earn(y):
    x = MARGIN
    body_h = 44
    c.setFillColor(PURPLE); rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(PURPLE,0.3))
    c.roundRect(x, y - body_h, CW, body_h, 12, stroke=0, fill=1)
    text(x + 16, y - 17, "Earning Cheat-Sheet", font="Head", size=11, col=white)
    text(x + 168, y - 16, "10x Peloton is on purchases over $150 (up to $5,000)",
         font="Hand", size=9, col=alpha(white, 0.85))
    fs = 9
    px = x + 16; py = y - 36
    for mult, cat in EARN:
        mw = c.stringWidth(mult, "Head", fs); cw = c.stringWidth(cat, "Body", fs)
        w = mw + cw + 20
        c.setFillColor(alpha(white, 0.14)); c.roundRect(px, py - 4, w, 17, 8, stroke=0, fill=1)
        text(px + 9, py, mult, font="Head", size=fs, col=GOLD)
        text(px + 9 + mw + 4, py, cat, font="Body", size=fs, col=white)
        px += w + 7
    return y - body_h - 10

# ---- PROTECTIONS ---------------------------------------------------------
PROTECT = [
    "Primary rental car (CDW) to $75k","Trip cancel/interruption to $10k",
    "Trip delay to $500 (6+ hrs)","Lost luggage to $3,000",
    "Baggage delay $100/day x5","Travel accident to $1M",
    "Emergency evacuation to $100k","Emergency medical/dental $2,500",
    "Roadside assistance $50 x4/yr","Purchase protection $10k/item",
    "Return protection $500/item","Extended warranty +1 year",
]
def draw_protect(y):
    key = "protect"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 16
    n = len(PROTECT); percol = (n + 1) // 2
    body_h = 14 + percol * rowh
    bar_y = section_bar(x, y, CW, "Know You're Covered - Travel & Purchase Protection", key, icon=ic_shield)
    card(x, bar_y, CW, body_h, tint, line)
    colw = CW / 2
    cy = bar_y - 17
    for i, label in enumerate(PROTECT):
        cxx = x + 14 + (colw if i >= percol else 0)
        yy = cy - (i - percol if i >= percol else i) * rowh
        checkbox(cxx, yy - 2, 10, fid("pr"), col)
        text(cxx + 16, yy, label, font="Body", size=8.8, col=INK)
    return bar_y - body_h - 10

def footer():
    y = 22
    c.setStrokeColor(alpha(MUT, 0.4)); c.setLineWidth(0.7)
    c.line(MARGIN, y + 14, PAGE_W - MARGIN, y + 14)
    text(MARGIN, y, "crazy4points.com", font="Head", size=8.5, col=PURPLE)
    text(PAGE_W/2, y, "Verified vs Chase official terms - Jul 2026 - benefits change, confirm at chase.com",
         font="Hand", size=9, col=MUT, center=True)
    text(PAGE_W - MARGIN, y, "Not affiliated with Chase", font="Hand", size=9, col=MUT, right=True)

# =========================================================================
# COMPOSE
# =========================================================================
y = header_band()
y = draw_setup(y)
y = draw_semi(y)
y = draw_monthly(y)
y = draw_annual(y)
footer()
c.showPage()

# PAGE 2 - trackers
y = mini_header(2)
y = draw_dining(y, rows_per_half=5)
y = draw_tickets(y, rows_per_half=4)
footer()
c.showPage()

# PAGE 3 - unlocks, perks, protection
y = mini_header(3)
y = draw_spend(y)
y = draw_perks(y)
y = draw_earn(y)
y = draw_protect(y)
footer()
c.showPage()

c.save()
print("wrote", OUT)
