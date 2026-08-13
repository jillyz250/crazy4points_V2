#!/usr/bin/env python3
"""
Six layouts for the $75K Spend Club, drawn at TRUE size (552pt content width).

The section has two jobs that pull apart: track progress toward $75,000, and
list the five things that unlock when you get there. The current version does
both weakly - a progress bar whose quarter ticks render as four separate boxes,
and a flat list of rewards with no sense of being a prize.

$75,000 a year is also ~$6,250 a month, which nobody tracks as one number. Some
versions below break the tracking into pieces you'd actually fill in.

The five rewards are verbatim from Chase (verified 2026-07-21):
  World of Hyatt Explorist Status - IHG One Rewards Diamond Elite Status -
  $250 Credit for The Shops at Chase - $500 Southwest Airlines Chase Travel
  credit - Southwest Airlines A-list status
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "spend-styles.pdf")
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
ACC    = HexColor("#A8801C")          # the bronze/gold this section already uses

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("$75K Spend Club - six layouts")

REWARDS = [
    ("World of Hyatt Explorist", "link your Hyatt account"),
    ("IHG One Rewards Diamond Elite", "auto if IHG already linked"),
    ("$250 Shops at Chase credit", "applied automatically"),
    ("$500 Southwest travel credit", "prepaid via Chase Travel"),
    ("Southwest A-List status", "link account, 10-15 days"),
]


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


def field(x, y, w, h=13, col=None):
    c.setStrokeColor(alpha(col or INK, 0.4)); c.setLineWidth(0.7); c.setFillColor(PAPER)
    c.rect(x, y, w, h, stroke=1, fill=1)


def shell(y, h, title, sub):
    c.setFillColor(ACC); c.roundRect(MARGIN, y - 26, CW, 26, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD_L); c.setLineWidth(0.7)
    c.line(MARGIN + 14, y - 22, MARGIN + CW - 14, y - 22)
    txt(MARGIN + 16, y - 17, title.upper(), "UIB", 9, white, spacing=1.5)
    txt(MARGIN + CW - 16, y - 16, sub, "Body", 7.6, alpha(white, 0.9), right=True)
    top = y - 26
    c.setFillColor(PAPER); c.roundRect(MARGIN, top - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(1.2)
    c.roundRect(MARGIN + 1, top - h + 1, CW - 2, h - 2, 7, stroke=1, fill=0)
    return top


def progress(x, y, w, h=14, ticks=(0.25, 0.5, 0.75)):
    """A real track with ticks ON it - the current version draws its ticks as
    separate strokes that read as four empty boxes."""
    c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.55)); c.setLineWidth(0.9)
    c.roundRect(x, y, w, h, h / 2, stroke=1, fill=1)
    for t in ticks:
        tx = x + w * t
        c.setStrokeColor(alpha(ACC, 0.35)); c.setLineWidth(0.7)
        c.line(tx, y + 2, tx, y + h - 2)


def reward_line(x, y, name, how, size=8.6):
    box(x, y - 2, 10)
    w = txt(x + 15, y, name, "Body", size, INK)
    txt(x + 15 + w + 7, y, "- " + how, "Body", size - 1.4, MUT)


# ---------------------------------------------------------------- A
def A(y):
    """PROGRESS BAR, FIXED. Closest to today: one running total, a real track
    with quarter marks, rewards listed beneath. The ticks now sit inside the
    bar instead of reading as four empty boxes."""
    h = 132
    top = shell(y, h, "The $75K Spend Club", "spend $75,000 in a year to unlock all five")
    txt(MARGIN + 16, top - 20, "MY SPEND SO FAR", "UIB", 6.2, GOLD_D, spacing=1.4)
    field(MARGIN + 16, top - 40, 90, 15, ACC)
    txt(MARGIN + 112, top - 36, "of  $75,000", "UIB", 8.5, ACC)
    progress(MARGIN + 200, top - 40, CW - 216, 15)
    txt(MARGIN + 200, top - 50, "$0", "Body", 6, MUT)
    txt(MARGIN + CW - 16, top - 50, "$75,000", "Body", 6, MUT, right=True)
    cy = top - 68
    for name, how in REWARDS:
        reward_line(MARGIN + 16, cy, name, how)
        cy -= 13


# ---------------------------------------------------------------- B
def B(y):
    """MILESTONE LADDER. The bar becomes a journey with quarter markers you tick
    off ($18,750 / $37,500 / $56,250 / $75,000), so progress feels reachable
    rather than one distant number."""
    h = 138
    top = shell(y, h, "The $75K Spend Club", "spend $75,000 in a year to unlock all five")
    marks = [("$18,750", 0.25), ("$37,500", 0.5), ("$56,250", 0.75), ("$75,000", 1.0)]
    bx, bw = MARGIN + 24, CW - 60
    c.setStrokeColor(alpha(ACC, 0.5)); c.setLineWidth(1.4)
    c.line(bx, top - 30, bx + bw, top - 30)
    for lab, f in marks:
        mx = bx + bw * f
        c.setFillColor(PAPER); c.setStrokeColor(ACC); c.setLineWidth(1.2)
        c.circle(mx, top - 30, 6, stroke=1, fill=1)
        txt(mx, top - 46, lab, "UIB", 6.6, ACC, center=True)
        txt(mx, top - 55, "quarter " + str(int(f * 4)), "Body", 5.6, MUT, center=True)
    txt(MARGIN + 16, top - 74, "MY SPEND SO FAR  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(MARGIN + 116, top - 78, 80, 14, ACC)
    cy = top - 96
    for i, (name, how) in enumerate(REWARDS):
        col_x = MARGIN + 16 if i < 3 else MARGIN + 290
        yy = cy - (i if i < 3 else i - 3) * 13
        reward_line(col_x, yy, name, how, size=8)


# ---------------------------------------------------------------- C
def C(y):
    """REWARD CARDS. The five unlocks become five little prize tiles, so the
    section looks like something you are working TOWARD. Tracking shrinks to one
    line at the top."""
    h = 132
    top = shell(y, h, "The $75K Spend Club", "spend $75,000 in a year to unlock all five")
    txt(MARGIN + 16, top - 20, "MY SPEND SO FAR  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(MARGIN + 116, top - 24, 78, 14, ACC)
    txt(MARGIN + 200, top - 20, "of  $75,000", "UIB", 8, ACC)
    progress(MARGIN + 268, top - 24, CW - 284, 14)
    tw = (CW - 32 - 4 * 6) / 5
    for i, (name, how) in enumerate(REWARDS):
        px = MARGIN + 16 + i * (tw + 6)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.35)); c.setLineWidth(0.8)
        c.roundRect(px, top - 116, tw, 76, 6, stroke=1, fill=1)
        box(px + tw / 2 - 5, top - 54, 10)
        words = name.split()
        line, lines = "", []
        for w in words:
            t = (line + " " + w).strip()
            if c.stringWidth(t, "Body", 7) > tw - 12:
                lines.append(line); line = w
            else:
                line = t
        lines.append(line)
        ly = top - 70
        for ln in lines[:3]:
            txt(px + tw / 2, ly, ln, "Body", 7, INK, center=True)
            ly -= 9
        txt(px + tw / 2, top - 110, how.split(",")[0][:22], "Body", 5.4, MUT, center=True)


# ---------------------------------------------------------------- D
def D(y):
    """SPLIT PANEL. Tracking lives in its own bordered box on the left, the
    prize list on the right. Cleanest separation of the section's two jobs."""
    h = 118
    top = shell(y, h, "The $75K Spend Club", "spend $75,000 in a year to unlock all five")
    pw = 190
    c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.4)); c.setLineWidth(0.9)
    c.roundRect(MARGIN + 10, top - 106, pw, 96, 6, stroke=1, fill=1)
    txt(MARGIN + 24, top - 26, "MY SPEND SO FAR", "UIB", 6.2, GOLD_D, spacing=1.3)
    field(MARGIN + 24, top - 50, 110, 18, ACC)
    txt(MARGIN + 24, top - 62, "of  $75,000  -  that's about", "Body", 6.6, MUT)
    txt(MARGIN + 24, top - 72, "$6,250 every month", "UIB", 7.4, ACC)
    progress(MARGIN + 24, top - 96, pw - 28, 13)
    txt(MARGIN + 218, top - 24, "WHAT YOU UNLOCK", "UIB", 6.2, GOLD_D, spacing=1.3)
    cy = top - 40
    for name, how in REWARDS:
        reward_line(MARGIN + 218, cy, name, how, size=8.2)
        cy -= 14


# ---------------------------------------------------------------- E
def E(y):
    """QUARTERLY. Four boxes instead of one - $75,000 a year is $18,750 a
    quarter, which is a number you can actually check yourself against. The
    running total is the sum of the four."""
    h = 128
    top = shell(y, h, "The $75K Spend Club", "$18,750 a quarter keeps you on pace")
    qs = ["Q1  JAN-MAR", "Q2  APR-JUN", "Q3  JUL-SEP", "Q4  OCT-DEC"]
    qw = (CW - 32 - 3 * 8) / 4
    for i, q in enumerate(qs):
        px = MARGIN + 16 + i * (qw + 8)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.35)); c.setLineWidth(0.8)
        c.roundRect(px, top - 48, qw, 38, 5, stroke=1, fill=1)
        txt(px + qw / 2, top - 22, q, "UIB", 6, ACC, center=True)
        field(px + 10, top - 42, qw - 20, 14, ACC)
    txt(MARGIN + 16, top - 62, "YEAR TO DATE  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(MARGIN + 104, top - 66, 70, 14, ACC)
    txt(MARGIN + 182, top - 62, "of  $75,000", "UIB", 8, ACC)
    progress(MARGIN + 250, top - 66, CW - 266, 14)
    cy = top - 84
    for i, (name, how) in enumerate(REWARDS):
        col_x = MARGIN + 16 if i < 3 else MARGIN + 290
        yy = cy - (i if i < 3 else i - 3) * 13
        reward_line(col_x, yy, name, how, size=8)


# ---------------------------------------------------------------- F
def F(y):
    """MONTHLY LEDGER. Twelve small boxes, one per month. The most work to keep
    up, but the only version that shows you mid-year whether you are on pace -
    and it matches the monthly-credits grid on page 1."""
    h = 126
    top = shell(y, h, "The $75K Spend Club", "about $6,250 a month keeps you on pace")
    MO = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
    gw = (CW - 32) / 12
    for i, m in enumerate(MO):
        px = MARGIN + 16 + i * gw
        txt(px + gw / 2, top - 18, m, "UIB", 6.4, GOLD_D, center=True)
        field(px + 3, top - 36, gw - 6, 14, ACC)
    c.setStrokeColor(alpha(GOLD, 0.5)); c.setLineWidth(0.7)
    c.line(MARGIN + 16, top - 46, MARGIN + CW - 16, top - 46)
    txt(MARGIN + 16, top - 60, "YEAR TO DATE  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(MARGIN + 104, top - 64, 70, 14, ACC)
    txt(MARGIN + 182, top - 60, "of  $75,000", "UIB", 8, ACC)
    progress(MARGIN + 250, top - 64, CW - 266, 14)
    cy = top - 82
    for i, (name, how) in enumerate(REWARDS):
        col_x = MARGIN + 16 if i < 3 else MARGIN + 290
        yy = cy - (i if i < 3 else i - 3) * 13
        reward_line(col_x, yy, name, how, size=8)


ITEMS = [
    (A, "A   Progress bar, fixed", "closest to today; ticks now sit inside the bar"),
    (B, "B   Milestone ladder", "quarter markers you tick off along the way"),
    (C, "C   Reward cards", "the five unlocks become prize tiles"),
    (D, "D   Split panel", "tracking boxed on the left, prizes on the right"),
    (E, "E   Quarterly", "$18,750 a quarter - a number you can check"),
    (F, "F   Monthly ledger", "twelve boxes; matches the page 1 credits grid"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "$75K SPEND CLUB - SIX LAYOUTS, ACTUAL SIZE", "UIB", 10,
        PURPLE, spacing=1.5)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a letter   ({n} of 2)", "Body", 9, MUT, right=True)
    y = PAGE_H - 56
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 150, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 196
    c.showPage()


sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
