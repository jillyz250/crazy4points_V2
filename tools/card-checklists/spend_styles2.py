#!/usr/bin/env python3
"""
Six richer takes on the $75K Spend Club, all built out from sampler C
(reward tiles). True size, 552pt content width.

Three things every version now carries:
  1. Spend tracking stays prominent - the tiles are the prize, not the point.
  2. Each reward gets a STATUS PILL that flips when you tick it, the same
     native-PDF trick as the Start Here tiles on page 1 (gold "TO CLAIM" ->
     green "UNLOCKED"). No JavaScript, so it works in Preview and on a phone.
  3. Each tile says HOW the reward arrives, because three of the five need you
     to do something and two land on their own.

Verified against creditcards.chase.com/rewards-credit-cards/sapphire/reserve
on 2026-07-21:
  - the threshold is a CALENDAR year: "Purchases made with your Sapphire
    Reserve or J.P. Morgan Reserve card between January 1 and December 31 of
    each year, beginning in 2025, will count towards the $75,000 spend
    requirement." (Not the anniversary year the $300 travel credit uses.)
  - "$500 Southwest Airlines purchases made on Chase Travel"
  - The Shops at Chase: Chase says only "purchases at The Shops at Chase" and
    never names what is sold there, so no version below claims otherwise.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "spend-styles-2.pdf")
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
GOLD_F = HexColor("#F9ECC7")
IVORY  = HexColor("#FAF6EC")
BAND   = HexColor("#FBF9F4")
PAPER  = HexColor("#FFFFFF")
GREEN  = HexColor("#2D8B56")
ACC    = HexColor("#A8801C")

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("$75K Spend Club - six richer layouts")

# (short name, how it arrives, needs you to act?)
REWARDS = [
    ("World of Hyatt", "Explorist status", "link your Hyatt account", True),
    ("IHG One Rewards", "Diamond Elite status", "automatic if IHG is linked", False),
    ("The Shops at Chase", "$250 credit", "applied automatically", False),
    ("Southwest", "$500 travel credit", "book on Chase Travel", True),
    ("Southwest", "A-List status", "link account, 10-15 days", True),
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


def box(x, y, sz=10, col=ACC):
    c.setStrokeColor(col); c.setLineWidth(0.9); c.setFillColor(PAPER)
    c.rect(x, y, sz, sz, stroke=1, fill=1)


def field(x, y, w, h=13, col=None):
    c.setStrokeColor(alpha(col or INK, 0.4)); c.setLineWidth(0.7); c.setFillColor(PAPER)
    c.rect(x, y, w, h, stroke=1, fill=1)


def pill(x, y, label, w=None, done=False, size=5.2):
    """Status pill. In the real build these become a second widget of the same
    checkbox field, so ticking the box flips the pill - the trick already used
    on the Start Here tiles."""
    pw = w or (c.stringWidth(label, "UIB", size) + 0.8 * (len(label) - 1) + 14)
    if done:
        c.setFillColor(GREEN); c.roundRect(x, y, pw, 11, 5.5, stroke=0, fill=1)
        txt(x + 7, y + 3.4, label, "UIB", size, white, spacing=0.8)
    else:
        c.setFillColor(GOLD_F); c.setStrokeColor(GOLD_D); c.setLineWidth(0.6)
        c.roundRect(x, y, pw, 11, 5.5, stroke=1, fill=1)
        txt(x + 7, y + 3.4, label, "UIB", size, GOLD_D, spacing=0.8)
    return pw


def meter(x, y, w, h=15, fill=0.0, dark=False):
    track = alpha(white, 0.16) if dark else BAND
    edge = alpha(GOLD_L, 0.6) if dark else alpha(ACC, 0.55)
    c.setFillColor(track); c.setStrokeColor(edge); c.setLineWidth(0.9)
    c.roundRect(x, y, w, h, h / 2, stroke=1, fill=1)
    if fill > 0:
        c.setFillColor(GOLD if dark else ACC)
        c.roundRect(x, y, w * fill, h, h / 2, stroke=0, fill=1)
    for t in (0.25, 0.5, 0.75):
        c.setStrokeColor(alpha(GOLD_L, 0.5) if dark else alpha(ACC, 0.3))
        c.setLineWidth(0.7)
        c.line(x + w * t, y + 2.5, x + w * t, y + h - 2.5)


def shell(y, h, sub, dark=False):
    bg = PLUM if dark else ACC
    c.setFillColor(bg); c.roundRect(MARGIN, y - 26, CW, 26, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD_L); c.setLineWidth(0.7)
    c.line(MARGIN + 14, y - 22, MARGIN + CW - 14, y - 22)
    txt(MARGIN + 16, y - 17, "THE $75K SPEND CLUB", "UIB", 9, white, spacing=1.5)
    txt(MARGIN + CW - 16, y - 16, sub, "Body", 7.4, alpha(GOLD_L, 0.95), right=True)
    top = y - 26
    c.setFillColor(PAPER); c.roundRect(MARGIN, top - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.9)); c.setLineWidth(1.2)
    c.roundRect(MARGIN + 1, top - h + 1, CW - 2, h - 2, 7, stroke=1, fill=0)
    return top


CAL = "counts Jan 1 - Dec 31, not your anniversary year"


def tracker_row(x, y, w):
    """Shared one-line tracker: field, target, meter."""
    txt(x, y + 12, "MY SPEND SO FAR  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(x + 100, y + 8, 76, 15, ACC)
    txt(x + 184, y + 12, "of  $75,000", "UIB", 8.4, ACC)
    meter(x + 254, y + 8, w - 254, 15, fill=0.34)


# ---------------------------------------------------------------- 1
def V1(y):
    """PRIZE TILES + PILLS. Sampler C with the pill added and the tiles given
    room to breathe: reward on top, how it arrives underneath, status pill at
    the foot of each tile."""
    h = 150
    top = shell(y, h, CAL)
    tracker_row(MARGIN + 16, top - 34, CW - 32)
    tw = (CW - 32 - 4 * 7) / 5
    for i, (name, what, how, act) in enumerate(REWARDS):
        px = MARGIN + 16 + i * (tw + 7)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.4)); c.setLineWidth(0.9)
        c.roundRect(px, top - 134, tw, 84, 6, stroke=1, fill=1)
        box(px + 8, top - 66, 10)
        txt(px + tw / 2, top - 80, name, "UIB", 6.8, INK, center=True)
        txt(px + tw / 2, top - 90, what, "Body", 6.6, ACC, center=True)
        txt(px + tw / 2, top - 104, how[:26], "Body", 5.4, MUT, center=True)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pw = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(px + tw / 2 - pw / 2, top - 126, lab, done=(i == 1))


# ---------------------------------------------------------------- 2
def V2(y):
    """TROPHY SHELF. The whole block goes plum and the tiles become gold-edged
    plaques, so the section reads as a reward you are working toward rather
    than another checklist. Heaviest on ink."""
    h = 152
    c.setFillColor(PLUM); c.roundRect(MARGIN, y - 26, CW, 26, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD_L); c.setLineWidth(0.7)
    c.line(MARGIN + 14, y - 22, MARGIN + CW - 14, y - 22)
    txt(MARGIN + 16, y - 17, "THE $75K SPEND CLUB", "UIB", 9, white, spacing=1.5)
    txt(MARGIN + CW - 16, y - 16, CAL, "Body", 7.4, alpha(GOLD_L, 0.95), right=True)
    top = y - 26
    c.setFillColor(PLUM); c.roundRect(MARGIN, top - h, CW, h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.8)); c.setLineWidth(0.9)
    c.roundRect(MARGIN + 5, top - h + 5, CW - 10, h - 10, 6, stroke=1, fill=0)
    txt(MARGIN + 22, top - 24, "MY SPEND SO FAR  $", "UIB", 6.2, GOLD_L, spacing=1.2)
    field(MARGIN + 122, top - 28, 76, 15, GOLD_L)
    txt(MARGIN + 206, top - 24, "of  $75,000", "UIB", 8.4, GOLD_L)
    meter(MARGIN + 276, top - 28, CW - 298, 15, fill=0.34, dark=True)
    tw = (CW - 44 - 4 * 7) / 5
    for i, (name, what, how, act) in enumerate(REWARDS):
        px = MARGIN + 22 + i * (tw + 7)
        c.setFillColor(alpha(white, 0.07))
        c.setStrokeColor(alpha(GOLD, 0.6)); c.setLineWidth(0.8)
        c.roundRect(px, top - 138, tw, 96, 6, stroke=1, fill=1)
        c.setFillColor(GOLD_L); c.circle(px + tw / 2, top - 58, 8, stroke=0, fill=1)
        txt(px + tw / 2, top - 61, str(i + 1), "UIB", 8, PLUM, center=True)
        txt(px + tw / 2, top - 82, name, "UIB", 6.8, white, center=True)
        txt(px + tw / 2, top - 92, what, "Body", 6.6, GOLD_L, center=True)
        txt(px + tw / 2, top - 106, how[:26], "Body", 5.4, alpha(white, 0.62), center=True)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pw = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(px + tw / 2 - pw / 2, top - 130, lab, done=(i == 1))


# ---------------------------------------------------------------- 3
def V3(y):
    """TILES + QUARTERLY PACING. Keeps C's tiles but replaces the single spend
    box with four quarter boxes, so you can tell in April whether you are on
    pace. Most useful tracking of the six."""
    h = 168
    top = shell(y, h, CAL)
    qs = ["Q1", "Q2", "Q3", "Q4"]
    qw = 74
    txt(MARGIN + 16, top - 20, "SPEND BY QUARTER  -  $18,750 KEEPS YOU ON PACE",
        "UIB", 6.2, GOLD_D, spacing=1.2)
    for i, q in enumerate(qs):
        px = MARGIN + 16 + i * (qw + 6)
        txt(px + 4, top - 32, q, "UIB", 6, ACC)
        field(px, top - 48, qw, 14, ACC)
    txt(MARGIN + 340, top - 32, "YEAR TO DATE  $", "UIB", 6.2, GOLD_D, spacing=1.2)
    field(MARGIN + 430, top - 36, 60, 14, ACC)
    txt(MARGIN + 340, top - 48, "of $75,000", "UIB", 7.4, ACC)
    meter(MARGIN + 396, top - 52, CW - 412, 12, fill=0.34)
    tw = (CW - 32 - 4 * 7) / 5
    for i, (name, what, how, act) in enumerate(REWARDS):
        px = MARGIN + 16 + i * (tw + 7)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.4)); c.setLineWidth(0.9)
        c.roundRect(px, top - 152, tw, 88, 6, stroke=1, fill=1)
        box(px + 8, top - 80, 10)
        txt(px + tw / 2, top - 94, name, "UIB", 6.8, INK, center=True)
        txt(px + tw / 2, top - 104, what, "Body", 6.6, ACC, center=True)
        txt(px + tw / 2, top - 118, how[:26], "Body", 5.4, MUT, center=True)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pw = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(px + tw / 2 - pw / 2, top - 144, lab, done=(i == 1))


# ---------------------------------------------------------------- 4
def V4(y):
    """HERO METER, TILE ROW. The spend meter becomes the biggest thing on the
    block - a wide gold bar with the milestone figures printed along it - and
    the tiles sit beneath as the payoff."""
    h = 162
    top = shell(y, h, CAL)
    txt(MARGIN + 16, top - 22, "MY SPEND SO FAR  $", "UIB", 6.6, GOLD_D, spacing=1.3)
    field(MARGIN + 122, top - 27, 90, 17, ACC)
    txt(MARGIN + 222, top - 22, "of  $75,000", "UIB", 10, ACC)
    meter(MARGIN + 16, top - 52, CW - 32, 18, fill=0.34)
    for lab, f in (("$0", 0.0), ("$18,750", 0.25), ("$37,500", 0.5),
                   ("$56,250", 0.75), ("$75,000", 1.0)):
        mx = MARGIN + 16 + (CW - 32) * f
        anchor = "left" if f == 0 else ("right" if f == 1 else "center")
        txt(mx, top - 62, lab, "Body", 5.6, MUT,
            center=(anchor == "center"), right=(anchor == "right"))
    tw = (CW - 32 - 4 * 7) / 5
    for i, (name, what, how, act) in enumerate(REWARDS):
        px = MARGIN + 16 + i * (tw + 7)
        c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.4)); c.setLineWidth(0.9)
        c.roundRect(px, top - 148, tw, 78, 6, stroke=1, fill=1)
        box(px + 8, top - 86, 10)
        txt(px + tw / 2, top - 100, name, "UIB", 6.8, INK, center=True)
        txt(px + tw / 2, top - 110, what, "Body", 6.6, ACC, center=True)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pw = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(px + tw / 2 - pw / 2, top - 128, lab, done=(i == 1))
        txt(px + tw / 2, top - 142, how[:26], "Body", 5.4, MUT, center=True)


# ---------------------------------------------------------------- 5
def V5(y):
    """SPLIT: TRACKER PANEL + STACKED TILES. Tracking gets its own bordered
    panel on the left with the monthly pace spelled out; the five rewards stack
    on the right as full-width rows, so long names never wrap."""
    h = 162
    top = shell(y, h, CAL)
    pw = 176
    c.setFillColor(BAND); c.setStrokeColor(alpha(ACC, 0.45)); c.setLineWidth(0.9)
    c.roundRect(MARGIN + 10, top - 150, pw, 140, 6, stroke=1, fill=1)
    txt(MARGIN + 24, top - 26, "MY SPEND SO FAR", "UIB", 6.2, GOLD_D, spacing=1.3)
    field(MARGIN + 24, top - 50, 110, 18, ACC)
    txt(MARGIN + 24, top - 64, "of  $75,000", "UIB", 8.4, ACC)
    meter(MARGIN + 24, top - 86, pw - 28, 14, fill=0.34)
    txt(MARGIN + 24, top - 102, "that's about", "Body", 6.4, MUT)
    txt(MARGIN + 24, top - 114, "$6,250 a month", "UIB", 8.6, ACC)
    txt(MARGIN + 24, top - 128, "or $18,750 a quarter", "Body", 6.4, MUT)
    rx = MARGIN + 200
    txt(rx, top - 22, "WHAT YOU UNLOCK", "UIB", 6.2, GOLD_D, spacing=1.3)
    cy = top - 40
    for i, (name, what, how, act) in enumerate(REWARDS):
        if i % 2:
            c.setFillColor(BAND); c.rect(rx - 6, cy - 11, CW - (rx - MARGIN) + 0, 24, stroke=0, fill=1)
        box(rx, cy - 1, 10)
        w = txt(rx + 16, cy, name, "UIB", 7.4, INK)
        txt(rx + 16 + w + 5, cy, what, "Body", 7.4, ACC)
        txt(rx + 16, cy - 9, how, "Body", 5.8, MUT)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pwl = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(MARGIN + CW - 16 - pwl, cy - 2, lab, done=(i == 1))
        cy -= 24


# ---------------------------------------------------------------- 6
def V6(y):
    """TILES WITH A GOLD HEADER STRIP. Each tile gets a solid gold cap carrying
    its number, which gives the row a rhythm the flat tiles lack, and the pill
    sits inside the tile body. The most decorated of the six."""
    h = 156
    top = shell(y, h, CAL)
    tracker_row(MARGIN + 16, top - 34, CW - 32)
    tw = (CW - 32 - 4 * 7) / 5
    for i, (name, what, how, act) in enumerate(REWARDS):
        px = MARGIN + 16 + i * (tw + 7)
        c.saveState()
        pth = c.beginPath(); pth.roundRect(px, top - 140, tw, 90, 6)
        c.clipPath(pth, stroke=0)
        c.setFillColor(PAPER); c.rect(px, top - 140, tw, 90, stroke=0, fill=1)
        c.setFillColor(ACC); c.rect(px, top - 68, tw, 18, stroke=0, fill=1)
        c.restoreState()
        c.setStrokeColor(alpha(ACC, 0.45)); c.setLineWidth(0.9)
        c.roundRect(px, top - 140, tw, 90, 6, stroke=1, fill=0)
        txt(px + tw / 2, top - 62, f"UNLOCK {i + 1}", "UIB", 5.8, white, center=True, spacing=1.0)
        txt(px + tw / 2, top - 84, name, "UIB", 6.8, INK, center=True)
        txt(px + tw / 2, top - 94, what, "Body", 6.6, ACC, center=True)
        txt(px + tw / 2, top - 108, how[:26], "Body", 5.4, MUT, center=True)
        box(px + 8, top - 132, 10)
        lab = "TO CLAIM" if act else "AUTOMATIC"
        pwl = c.stringWidth(lab, "UIB", 5.2) + 0.8 * (len(lab) - 1) + 14
        pill(px + tw - 8 - pwl, top - 132, lab, done=(i == 1))


ITEMS = [
    (V1, "1   Prize tiles + pills", "sampler C, with a status pill on every tile"),
    (V2, "2   Trophy shelf", "the whole block goes plum; tiles become plaques"),
    (V3, "3   Tiles + quarterly pacing", "four quarter boxes instead of one total"),
    (V4, "4   Hero meter", "the bar is the biggest thing; milestones printed on it"),
    (V5, "5   Tracker panel + stacked rows", "no wrapping; pace spelled out"),
    (V6, "6   Gold-capped tiles", "each tile numbered in a solid gold header"),
]


def sheet(items, n):
    txt(MARGIN, PAGE_H - 24, "$75K SPEND CLUB - SIX RICHER TAKES, ACTUAL SIZE", "UIB", 10,
        PURPLE, spacing=1.4)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a number   ({n} of 2)", "Body", 9, MUT, right=True)
    txt(MARGIN, PAGE_H - 38, "the green pill shows what a claimed reward looks like - "
        "ticking the box flips it, no JavaScript needed", "Body", 7, MUT)
    y = PAGE_H - 66
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 170, y - 9, blurb, "Body", 7.4, MUT)
        y -= 16
        fn(y)
        y -= 222
    c.showPage()


sheet(ITEMS[:3], 1)
sheet(ITEMS[3:], 2)
c.save()
print("wrote", OUT)
