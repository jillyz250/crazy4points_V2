#!/usr/bin/env python3
"""
Header hybrids - combining what worked in samples 3, 4 and 6.

The three chosen headers share one idea: the branding gets its OWN territory
instead of floating on the title's background. They differ on ground colour
(ivory vs plum) and on how the territory is drawn (a hard panel vs an inset
gold frame). These four permute those two choices.

Drawn at TRUE size (612pt wide) so nothing flatters itself with scaling.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "header-hybrids.pdf")
B = os.path.join(HERE, "..", "..", "design-assets", "fonts")
LOGO = os.path.join(HERE, "..", "..", "public", "crazy4points-logo.png")

pdfmetrics.registerFont(TTFont("Head", os.path.join(B, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("Body", os.path.join(B, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("UIB",  os.path.join(B, "montserrat", "montserrat-v31-latin-700.ttf")))

INK    = HexColor("#2A2140")
MUT    = HexColor("#6E6486")
PURPLE = HexColor("#6B2D8F")
PLUM   = HexColor("#331046")
GOLD   = HexColor("#D4AF37")
GOLD_D = HexColor("#B8901F")
GOLD_L = HexColor("#F5CE5A")
IVORY  = HexColor("#FBF6EC")

PAGE_W, PAGE_H = letter
MARGIN = 30
BH = 104

TITLE = "The Sapphire Reserve Companion"
LINE1 = "Don't let Chase keep your money. There's $2,190 in credits in here, and most"
LINE2 = "cardholders leave hundreds of it on the table every single year."
CTA = "GET THE FREE NEWSLETTER"

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Sapphire Reserve Companion - header hybrids")


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


def logo(x, y, w, h, chip=None, pad=7, radius=9):
    if chip is not None:
        c.setFillColor(chip)
        c.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, radius, stroke=0, fill=1)
    if os.path.exists(LOGO):
        c.drawImage(LOGO, x, y, width=w, height=h,
                    preserveAspectRatio=True, anchor='c', mask='auto')


def cta(cx, y, size=6.0, fill=GOLD, ink=PLUM, outline=None, center_on=None):
    sp = 0.8
    bw = c.stringWidth(CTA, "UIB", size) + sp * (len(CTA) - 1) + 34
    x = (center_on - bw / 2) if center_on is not None else cx
    h = 16
    if fill is not None:
        c.setFillColor(fill); c.roundRect(x, y, bw, h, 8, stroke=0, fill=1)
    if outline is not None:
        c.setStrokeColor(outline); c.setLineWidth(0.9); c.roundRect(x, y, bw, h, 8, stroke=1, fill=0)
    txt(x + 10, y + 5.4, CTA, "UIB", size, ink, spacing=sp)
    c.setStrokeColor(ink); c.setLineWidth(1.0); c.setLineCap(1)
    ax = x + bw - 10
    c.line(ax - 5, y + h / 2, ax, y + h / 2)
    c.line(ax - 2.4, y + h / 2 + 2.4, ax, y + h / 2)
    c.line(ax - 2.4, y + h / 2 - 2.4, ax, y + h / 2)


PW = 176          # branding panel width, shared by the panel variants


def title_block(top, title_col, body_col, kick_col, x=MARGIN):
    txt(x, top - 30, "2026 EDITION", "UIB", 6.8, kick_col, spacing=2.2)
    txt(x, top - 56, TITLE, "Head", 22, title_col)
    txt(x, top - 76, LINE1, "Body", 9.2, body_col)
    txt(x, top - 88, LINE2, "Body", 9.2, body_col)


# ---------------------------------------------------------------- A
def hA(top):
    """IVORY GROUND + PLUM PANEL.  4's light page with 3's walled-off branding,
    inverted: the panel is the dark thing, so the logo gets a white chip."""
    c.setFillColor(IVORY); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - 3, PAGE_W, 3, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, top - BH, PAGE_W, 3, stroke=0, fill=1)
    c.setFillColor(PLUM); c.rect(PAGE_W - PW, top - BH, PW, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(PAGE_W - PW - 3, top - BH, 3, BH, stroke=0, fill=1)
    title_block(top, PURPLE, INK, GOLD_D)
    logo(PAGE_W - PW + 34, top - 46, 108, 28, chip=white)
    cta(0, top - 84, center_on=PAGE_W - PW / 2)


# ---------------------------------------------------------------- B
def hB(top):
    """PLUM GROUND + IVORY PANEL.  6's dark luxury with 3's split. The logo sits
    straight on ivory - no chip needed, which is the cleanest it ever looks."""
    c.setFillColor(PLUM); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setFillColor(IVORY); c.rect(PAGE_W - PW, top - BH, PW, BH, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(PAGE_W - PW - 3, top - BH, 3, BH, stroke=0, fill=1)
    title_block(top, white, alpha(white, 0.88), GOLD)
    logo(PAGE_W - PW + 34, top - 46, 108, 28)
    cta(0, top - 84, center_on=PAGE_W - PW / 2)


# ---------------------------------------------------------------- C
def hC(top):
    """IVORY GROUND + INSET GOLD FRAME.  4 and 6 with no hard panel at all - the
    frame alone does the containing. Lightest on ink of anything here."""
    c.setFillColor(IVORY); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setStrokeColor(GOLD); c.setLineWidth(0.9)
    c.rect(18, top - BH + 11, PAGE_W - 36, BH - 22, stroke=1, fill=0)
    title_block(top, PURPLE, INK, GOLD_D, x=MARGIN + 6)
    logo(PAGE_W - MARGIN - 122, top - 50, 110, 28)
    cta(PAGE_W - MARGIN - 6 - (c.stringWidth(CTA, "UIB", 6.0) + 0.8 * (len(CTA) - 1) + 34),
        top - 82, outline=GOLD, fill=None, ink=PURPLE)


# ---------------------------------------------------------------- D
def hD(top):
    """ALL THREE.  Plum ground, inset gold frame, and the branding lifted onto
    its own ivory block INSIDE the frame. The most finished, the most ink."""
    c.setFillColor(PLUM); c.rect(0, top - BH, PAGE_W, BH, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.75)); c.setLineWidth(0.9)
    c.rect(18, top - BH + 11, PAGE_W - 36, BH - 22, stroke=1, fill=0)
    bx, bw2 = PAGE_W - MARGIN - 154, 148
    c.setFillColor(IVORY)
    c.roundRect(bx, top - BH + 18, bw2, BH - 36, 8, stroke=0, fill=1)
    title_block(top, white, alpha(white, 0.88), GOLD, x=MARGIN + 6)
    logo(bx + 20, top - 48, 108, 26)
    cta(0, top - 78, center_on=bx + bw2 / 2, size=5.6)


HYBRIDS = [
    (hA, "A   Ivory ground + plum panel", "4's light page, 3's walled-off branding"),
    (hB, "B   Plum ground + ivory panel", "6's luxury, 3's split, logo needs no chip"),
    (hC, "C   Ivory + inset gold frame", "4 and 6, no hard panel - lightest on ink"),
    (hD, "D   All three combined", "plum, frame, and an ivory branding block"),
]

txt(MARGIN, PAGE_H - 24, "HEADER HYBRIDS - 3 + 4 + 6, AT ACTUAL SIZE", "UIB", 10, PURPLE, spacing=1.6)
txt(PAGE_W - MARGIN, PAGE_H - 24, "tell me a letter", "Body", 9, MUT, right=True)

y = PAGE_H - 54
for fn, label, blurb in HYBRIDS:
    txt(MARGIN, y - 9, label, "UIB", 8, PURPLE)
    txt(MARGIN + 152, y - 9, blurb, "Body", 7.6, MUT)
    y -= 15
    fn(y)
    y -= BH + 30

c.showPage()
c.save()
print("wrote", OUT)
