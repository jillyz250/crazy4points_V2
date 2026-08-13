#!/usr/bin/env python3
"""
Header band sampler for the Sapphire Reserve Companion.

Six treatments of the page-1 header, each drawn at TRUE size (612pt wide, the
real page width) so what you see is what lands on the page - no scaling to
flatter it.

Same five pieces in every one: title, edition, the money line, the logo, and
the newsletter button. What changes is the structure, the palette, and which
piece is asked to carry the page.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "header-styles.pdf")
B = os.path.join(HERE, "..", "..", "design-assets", "fonts")
LOGO = os.path.join(HERE, "..", "..", "public", "crazy4points-logo.png")

pdfmetrics.registerFont(TTFont("Head",  os.path.join(B, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("HeadR", os.path.join(B, "playfair", "playfair-display-v40-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("Body",  os.path.join(B, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("UI",    os.path.join(B, "montserrat", "montserrat-v31-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("UIB",   os.path.join(B, "montserrat", "montserrat-v31-latin-700.ttf")))

INK      = HexColor("#2A2140")
MUT      = HexColor("#6E6486")
PURPLE   = HexColor("#6B2D8F")
PURPLE_D = HexColor("#5A237A")
PLUM     = HexColor("#331046")
GOLD     = HexColor("#D4AF37")
GOLD_L   = HexColor("#F5CE5A")
IVORY    = HexColor("#FBF6EC")

PAGE_W, PAGE_H = letter
MARGIN = 30
BH = 104                      # true header height

TITLE = "The Sapphire Reserve Companion"
EDITION = "2026 Edition"
LINE1 = "Don't let Chase keep your money. There's $2,190 in credits in here, and most"
LINE2 = "cardholders leave hundreds of it on the table every single year."
SHORT = "Don't let Chase keep your money. There's $2,190 in credits in here."
CTA = "GET THE FREE NEWSLETTER"

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Sapphire Reserve Companion - header options")


def alpha(col, a):
    return Color(col.red, col.green, col.blue, alpha=a)


def txt(x, y, s, font, size, col, center=False, right=False, spacing=0):
    if spacing:
        w = c.stringWidth(s, font, size) + spacing * max(0, len(s) - 1)
        sx = x - w / 2 if center else (x - w if right else x)
        t = c.beginText(); t.setFont(font, size); t.setCharSpace(spacing)
        t.setFillColor(col); t.setTextOrigin(sx, y); t.textOut(s); c.drawText(t)
        t2 = c.beginText(); t2.setCharSpace(0); c.drawText(t2)   # Tc persists past ET
        return w
    c.setFont(font, size); c.setFillColor(col)
    (c.drawCentredString if center else (c.drawRightString if right else c.drawString))(x, y, s)
    return c.stringWidth(s, font, size)


def logo(x, y, w, h, chip=None, chip_pad=8, radius=12):
    """Draw the mark, optionally on a chip. The brand file is purple/gold on
    transparent, so it needs a light backing on any dark ground."""
    if chip is not None:
        c.setFillColor(chip)
        c.roundRect(x - chip_pad, y - chip_pad, w + chip_pad * 2, h + chip_pad * 2,
                    radius, stroke=0, fill=1)
    if os.path.exists(LOGO):
        c.drawImage(LOGO, x, y, width=w, height=h,
                    preserveAspectRatio=True, anchor='c', mask='auto')


def cta(x, y, w=None, size=6.4, fill=GOLD, ink=PURPLE_D, outline=None, right_edge=None):
    """Gold pill with an arrow. Returns its width."""
    sp = 0.8
    bw = w or (c.stringWidth(CTA, "UIB", size) + sp * (len(CTA) - 1) + 36)
    if right_edge is not None:
        x = right_edge - bw
    h = 16
    if fill is not None:
        c.setFillColor(fill); c.roundRect(x, y, bw, h, 8, stroke=0, fill=1)
    if outline is not None:
        c.setStrokeColor(outline); c.setLineWidth(0.9)
        c.roundRect(x, y, bw, h, 8, stroke=1, fill=0)
    txt(x + 11, y + 5.4, CTA, "UIB", size, ink, spacing=sp)
    c.setStrokeColor(ink); c.setLineWidth(1.0); c.setLineCap(1)
    ax = x + bw - 11
    c.line(ax - 5, y + h / 2, ax, y + h / 2)
    c.line(ax - 2.4, y + h / 2 + 2.4, ax, y + h / 2)
    c.line(ax - 2.4, y + h / 2 - 2.4, ax, y + h / 2)
    return bw


# ---------------------------------------------------------------- 1
def h1(top):
    """CURRENT, TIGHTENED - same bones, better hierarchy. The edition becomes a
    small-caps kicker ABOVE the title so the title owns its own line, and a gold
    hairline separates the promise from the branding."""
    c.setFillColor(PURPLE); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(PURPLE_D); c.rect(0, top - BH, PAGE_W, 5, stroke=0, fill=1)
    txt(MARGIN, top - 26, "2026 EDITION", "UIB", 7, GOLD_L, spacing=2.2)
    txt(MARGIN, top - 52, TITLE, "Head", 24, white)
    c.setStrokeColor(alpha(GOLD, 0.55)); c.setLineWidth(0.7)
    c.line(MARGIN, top - 62, MARGIN + 300, top - 62)
    txt(MARGIN, top - 78, LINE1, "Body", 9.6, alpha(white, 0.92))
    txt(MARGIN, top - 90, LINE2, "Body", 9.6, alpha(white, 0.92))
    logo(PAGE_W - MARGIN - 124, top - 56, 124, 40, chip=white)
    cta(0, top - 90, right_edge=PAGE_W - MARGIN)


# ---------------------------------------------------------------- 2
def h2(top):
    """CENTRED - symmetrical and calm. Logo centred at the top, title beneath,
    one short promise line, button centred. The most 'cover page' of the six."""
    c.setFillColor(PURPLE); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - BH, PAGE_W, 3, stroke=0, fill=1)
    logo(PAGE_W / 2 - 52, top - 32, 104, 26, chip=white, chip_pad=6, radius=9)
    txt(PAGE_W / 2, top - 58, TITLE, "Head", 21, white, center=True)
    txt(PAGE_W / 2, top - 72, SHORT, "Body", 8.8, alpha(white, 0.82), center=True)
    bw = c.stringWidth(CTA, "UIB", 6.4) + 0.8 * (len(CTA) - 1) + 36
    cta((PAGE_W - bw) / 2, top - 96)


# ---------------------------------------------------------------- 3
def h3(top):
    """SPLIT PANEL - the title sits on purple, the branding on its own ivory
    block. Strongest separation of 'what this is' from 'who made it'."""
    c.setFillColor(PURPLE); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    pw = 186
    c.setFillColor(IVORY); c.rect(PAGE_W - pw, top - BH, pw, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(PAGE_W - pw - 3, top - BH, 3, BH, stroke=0, fill=1)
    txt(MARGIN, top - 36, TITLE, "Head", 22, white)
    txt(MARGIN, top - 50, EDITION, "UIB", 8.5, GOLD_L)
    txt(MARGIN, top - 72, LINE1, "Body", 9.4, alpha(white, 0.9))
    txt(MARGIN, top - 84, LINE2, "Body", 9.4, alpha(white, 0.9))
    logo(PAGE_W - pw + 30, top - 46, 126, 32)
    cta(PAGE_W - pw + 22, top - 84, size=6.0)


# ---------------------------------------------------------------- 4
def h4(top):
    """IVORY EDITORIAL - light instead of purple. Gold rules top and bottom,
    purple serif title. Reads as stationery, and uses almost no ink."""
    c.setFillColor(IVORY); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - 3, PAGE_W, 3, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - BH, PAGE_W, 3, stroke=0, fill=1)
    txt(MARGIN, top - 30, "2026 EDITION", "UIB", 7, HexColor("#B8901F"), spacing=2.2)
    txt(MARGIN, top - 56, TITLE, "Head", 24, PURPLE)
    txt(MARGIN, top - 74, LINE1, "Body", 9.4, INK)
    txt(MARGIN, top - 86, LINE2, "Body", 9.4, INK)
    logo(PAGE_W - MARGIN - 120, top - 52, 120, 38)
    cta(0, top - 88, right_edge=PAGE_W - MARGIN, fill=None, outline=GOLD, ink=PURPLE)


# ---------------------------------------------------------------- 5
def h5(top):
    """GOLD RAIL - a gold bar down the left edge acts as a bookmark, and the
    money line gets promoted to the same weight as the title."""
    c.setFillColor(PURPLE); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - BH, 9, BH, stroke=0, fill=1)
    x = MARGIN + 6
    txt(x, top - 30, TITLE, "Head", 21, white)
    txt(x, top - 44, EDITION, "UIB", 8, GOLD_L)
    cx = x
    cx += txt(cx, top - 68, "There's ", "Head", 15, GOLD_L)
    cx += txt(cx, top - 68, "$2,190", "UIB", 13.5, GOLD_L)
    txt(cx, top - 68, " in credits in here.", "Head", 15, GOLD_L)
    txt(x, top - 84, "Most cardholders leave hundreds of it on the table every year.",
        "Body", 9.2, alpha(white, 0.85))
    logo(PAGE_W - MARGIN - 116, top - 50, 116, 36, chip=white, chip_pad=7, radius=10)
    cta(0, top - 88, right_edge=PAGE_W - MARGIN, size=6.0)


# ---------------------------------------------------------------- 6
def h6(top):
    """DARK LUXE - deep plum with an inset gold frame, matching the Start Here
    band below it. The most expensive-looking, and the heaviest on ink."""
    c.setFillColor(PLUM); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.7)); c.setLineWidth(0.8)
    c.rect(MARGIN - 12, top - BH + 10, PAGE_W - 2 * (MARGIN - 12), BH - 20, stroke=1, fill=0)
    txt(MARGIN, top - 34, "2026 EDITION", "UIB", 6.6, GOLD, spacing=2.4)
    txt(MARGIN, top - 58, TITLE, "Head", 23, white)
    c.setStrokeColor(GOLD); c.setLineWidth(0.7)
    c.line(MARGIN, top - 68, MARGIN + 240, top - 68)
    txt(MARGIN, top - 82, SHORT, "Body", 9.2, alpha(white, 0.86))
    logo(PAGE_W - MARGIN - 118, top - 52, 118, 36, chip=white, chip_pad=7, radius=6)
    cta(0, top - 84, right_edge=PAGE_W - MARGIN, size=6.0)


STYLES = [
    (h1, "1  Current, tightened", "edition as a kicker, gold rule, same palette"),
    (h2, "2  Centred", "symmetrical, logo on top, one promise line"),
    (h3, "3  Split panel", "branding gets its own ivory block"),
    (h4, "4  Ivory editorial", "light ground, purple serif, barely any ink"),
    (h5, "5  Gold rail", "the dollar figure promoted to headline weight"),
    (h6, "6  Dark luxe", "plum + inset gold frame, matches Start Here"),
]

def sheet(items, page_no):
    txt(MARGIN, PAGE_H - 24, "SIX HEADERS - SHOWN AT ACTUAL SIZE", "UIB", 10, PURPLE, spacing=1.8)
    txt(PAGE_W - MARGIN, PAGE_H - 24, f"tell me a number   ({page_no} of 2)",
        "Body", 9, MUT, right=True)
    y = PAGE_H - 52
    for fn, label, blurb in items:
        txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
        txt(MARGIN + 118, y - 9, blurb, "Body", 7.6, MUT)
        y -= 15
        fn(y)
        y -= BH + 30
    c.showPage()


sheet(STYLES[:3], 1)
sheet(STYLES[3:], 2)
c.save()
print("wrote", OUT)
