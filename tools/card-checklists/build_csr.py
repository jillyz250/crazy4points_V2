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

# Brand typography — the SAME faces the website uses (see CLAUDE.md):
#   Playfair Display = headings, Lato = body, Montserrat = UI/labels.
# This replaced Comfortaa/Varela Round/Patrick Hand, which were off-brand and
# read as "wonky" next to crazy4points.com. Files live in design-assets/fonts,
# so the PDF and the site can never drift apart.
BRAND = os.path.join(HERE, "..", "..", "design-assets", "fonts")
pdfmetrics.registerFont(TTFont("Head",   os.path.join(BRAND, "playfair", "playfair-display-v40-latin-700.ttf")))
pdfmetrics.registerFont(TTFont("HeadSm", os.path.join(BRAND, "playfair", "playfair-display-v40-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("Body",   os.path.join(BRAND, "lato", "lato-v25-latin-regular.ttf")))
pdfmetrics.registerFont(TTFont("BodyB",  os.path.join(BRAND, "lato", "lato-v25-latin-700.ttf")))
# Montserrat for the tiny uppercase column labels and pills — a serif is wrong
# at 7pt caps, and this is what the site uses for exactly this job.
pdfmetrics.registerFont(TTFont("UI",     os.path.join(BRAND, "montserrat", "montserrat-v31-latin-600.ttf")))
pdfmetrics.registerFont(TTFont("UIB",    os.path.join(BRAND, "montserrat", "montserrat-v31-latin-700.ttf")))

# ---- palette -------------------------------------------------------------
INK      = HexColor("#2A2140")
MUT      = HexColor("#6E6486")
PURPLE   = HexColor("#6B2D8F")
PURPLE_D = HexColor("#5A237A")
GOLD     = HexColor("#D4AF37")
GOLD_D   = HexColor("#B8901F")
# Brighter gold for text sitting ON the purple bands — brand gold (#D4AF37) is
# too close in value to purple to read at small sizes.
GOLD_L   = HexColor("#F5CE5A")
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
c.setTitle("The Sapphire Reserve Owner's Guide - 2026 Edition")
c.setAuthor("crazy4points.com")

# Registries for the auto-summing "captured" total. Checkbox values come ONLY
# from Chase's published credit amounts, so the running total is factual, never
# an invented valuation. Text fields are whatever the reader typed.
PILL_WIDGETS = []     # (page_no, field_name, rect, off_label, on_label)
SUM_CHECKBOXES = []   # (field_name, dollars_per_check)
SUM_TEXTFIELDS = []   # field_name

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

def star_rating(cx0, cy, n, col, step=10.5, size=10):
    """Clickable 1-5 star rating.

    The stars used to be decoration only — they LOOK interactive, so people
    click them and nothing happens. Each star is now a real borderless
    checkbox using the PDF 'star' glyph: the vector outline stays visible so
    you can see where to click, and ticking fills the star in.
    """
    for s in range(n):
        cx = cx0 + s * step
        star(cx, cy, 4.4, None, stroke=alpha(col, 0.8), sw=0.9)
        c.acroForm.checkbox(
            name=fid("drate"), x=cx - size / 2, y=cy - size / 2, size=size,
            buttonStyle="star", borderColor=None, fillColor=None,
            textColor=col, borderWidth=0, checked=False, forceBorder=False,
        )

def go_pill(gx, cy, url, col):
    """Small clickable GO pill. Only used where the destination actually DOES
    something — a link to a homepage or a login wall saves nobody a step, so
    those rows get no pill at all. Returns the pill's right edge."""
    gw = c.stringWidth("GO", "UIB", 6.6) + 15
    c.setFillColor(alpha(col, 0.16)); c.roundRect(gx, cy - 3, gw, 12, 6, stroke=0, fill=1)
    text(gx + 6, cy + 0.5, "GO", font="UIB", size=6.6, col=col)
    c.setStrokeColor(col); c.setLineWidth(0.9); c.setLineCap(1)
    ax = gx + gw - 6.5
    c.line(ax - 3, cy + 3, ax, cy + 3)
    c.line(ax - 1.4, cy + 4.6, ax, cy + 3); c.line(ax - 1.4, cy + 1.4, ax, cy + 3)
    c.linkURL(url, (gx, cy - 3, gx + gw, cy + 9), relative=0, thickness=0)
    return gx + gw

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
        icon(x + 15, y_top - h/2, white)
        tx = x + 32
    # Montserrat, not Playfair: almost every bar carries a dollar figure, and
    # Playfair's old-style numerals render "$0" so the zero reads as a lowercase
    # "o" and "($540)" sits below the cap line. Playfair stays for the editorial
    # headlines (cover, page titles, scorecard, CTA) where there are no digits.
    text(tx, y_top - h + 8, title, font="UIB", size=11.5, col=white)
    return y_top - h

# ---- little icons (drawn) ------------------------------------------------
def ic_bolt(cx, cy, col):
    c.setFillColor(col)
    p = c.beginPath()
    p.moveTo(cx+2, cy+7); p.lineTo(cx-4, cy-1); p.lineTo(cx-0.5, cy-1)
    p.lineTo(cx-2, cy-7); p.lineTo(cx+4, cy+1); p.lineTo(cx+0.5, cy+1); p.close()
    c.drawPath(p, fill=1, stroke=0)

def ic_star(cx, cy, col):
    star(cx, cy, 7, col)

def ic_cal(cx, cy, col):
    c.setStrokeColor(col); c.setFillColor(col); c.setLineWidth(1.2)
    c.roundRect(cx-6, cy-6, 12, 11, 2, stroke=1, fill=0)
    c.line(cx-6, cy+1.5, cx+6, cy+1.5)
    c.line(cx-3, cy+5, cx-3, cy+7); c.line(cx+3, cy+5, cx+3, cy+7)

def ic_card(cx, cy, col):
    c.setStrokeColor(col); c.setFillColor(col); c.setLineWidth(1.2)
    c.roundRect(cx-7, cy-5, 14, 10, 2, stroke=1, fill=0)
    c.setFillColor(col); c.rect(cx-7, cy+1, 14, 2.2, stroke=0, fill=1)

def ic_target(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.3)
    c.circle(cx, cy, 6.5, stroke=1, fill=0)
    c.circle(cx, cy, 3.2, stroke=1, fill=0)
    c.setFillColor(col); c.circle(cx, cy, 1.2, stroke=0, fill=1)

def ic_crown(cx, cy, col):
    c.setFillColor(col)
    p = c.beginPath()
    p.moveTo(cx-7, cy-4); p.lineTo(cx-7, cy+2); p.lineTo(cx-3.5, cy-1.5)
    p.lineTo(cx, cy+4); p.lineTo(cx+3.5, cy-1.5); p.lineTo(cx+7, cy+2)
    p.lineTo(cx+7, cy-4); p.close()
    c.drawPath(p, fill=1, stroke=0)

def ic_shield(cx, cy, col):
    c.setFillColor(col)
    p = c.beginPath()
    p.moveTo(cx, cy+7); p.lineTo(cx+6, cy+4); p.lineTo(cx+6, cy-2)
    p.lineTo(cx, cy-7); p.lineTo(cx-6, cy-2); p.lineTo(cx-6, cy+4); p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(white); c.setLineWidth(1.4); c.setLineCap(1)
    c.line(cx-2.3, cy+0.5, cx-0.5, cy-1.6); c.line(cx-0.5, cy-1.6, cx+3, cy+2.5)

def ic_ticket(cx, cy, col):
    c.setStrokeColor(col); c.setFillColor(col); c.setLineWidth(1.2)
    c.roundRect(cx-7, cy-4.5, 14, 9, 2, stroke=1, fill=0)
    c.setFillColor(white); c.circle(cx-7, cy, 1.6, stroke=0, fill=1); c.circle(cx+7, cy, 1.6, stroke=0, fill=1)
    c.setStrokeColor(col); c.setLineWidth(0.9); c.setDash(1.2, 1.2)
    c.line(cx, cy-4.5, cx, cy+4.5); c.setDash()

# Icons for the setup grid. Drawn by us on purpose: the tiles could carry the
# real Peloton / DoorDash / StubHub / Lyft / IHG marks, but reproducing eight
# third-party trademarks on our own lead magnet implies endorsements we don't
# have — and an approximated logo looks sloppy to anyone who knows the brand.
def ic_bike(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.3); c.setLineCap(1)
    c.circle(cx - 5, cy - 3, 3.6, stroke=1, fill=0)
    c.circle(cx + 5, cy - 3, 3.6, stroke=1, fill=0)
    c.line(cx - 5, cy - 3, cx - 1, cy + 4); c.line(cx - 1, cy + 4, cx + 5, cy - 3)
    c.line(cx - 1, cy + 4, cx + 2, cy + 4)

def ic_bag(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.3)
    c.roundRect(cx - 5, cy - 6, 10, 10, 1.5, stroke=1, fill=0)
    c.setLineWidth(1.1)
    p = c.beginPath(); p.moveTo(cx - 2.6, cy + 4); p.curveTo(cx - 2.6, cy + 8, cx + 2.6, cy + 8, cx + 2.6, cy + 4)
    c.drawPath(p, stroke=1, fill=0)

def ic_music(cx, cy, col):
    c.setStrokeColor(col); c.setFillColor(col); c.setLineWidth(1.3); c.setLineCap(1)
    c.line(cx - 1, cy - 3, cx - 1, cy + 6); c.line(cx + 5, cy - 5, cx + 5, cy + 4)
    c.line(cx - 1, cy + 6, cx + 5, cy + 4)
    c.circle(cx - 3, cy - 4, 2.2, stroke=0, fill=1)
    c.circle(cx + 3, cy - 6, 2.2, stroke=0, fill=1)

def ic_car(cx, cy, col):
    c.setStrokeColor(col); c.setFillColor(col); c.setLineWidth(1.2)
    c.roundRect(cx - 7, cy - 3, 14, 5, 1.5, stroke=1, fill=0)
    p = c.beginPath(); p.moveTo(cx - 5, cy + 2); p.lineTo(cx - 3, cy + 6)
    p.lineTo(cx + 3, cy + 6); p.lineTo(cx + 5, cy + 2)
    c.drawPath(p, stroke=1, fill=0)
    c.circle(cx - 4, cy - 4, 1.5, stroke=0, fill=1); c.circle(cx + 4, cy - 4, 1.5, stroke=0, fill=1)

def ic_bed(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.25); c.setLineCap(1)
    c.line(cx - 7, cy + 4, cx - 7, cy - 5)
    c.line(cx - 7, cy - 1, cx + 7, cy - 1); c.line(cx + 7, cy - 1, cx + 7, cy - 5)
    c.roundRect(cx - 4.5, cy + 0.5, 5, 3.5, 1, stroke=1, fill=0)
    c.line(cx - 7, cy - 5, cx + 7, cy - 5)

def ic_car2(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.2); c.setLineCap(1)
    c.roundRect(cx - 7, cy - 2, 14, 5, 1.5, stroke=1, fill=0)
    c.line(cx - 4, cy + 3, cx - 2.5, cy + 6); c.line(cx + 4, cy + 3, cx + 2.5, cy + 6)
    c.line(cx - 2.5, cy + 6, cx + 2.5, cy + 6)
    c.setFillColor(col)
    c.circle(cx - 4, cy - 3, 1.4, stroke=0, fill=1); c.circle(cx + 4, cy - 3, 1.4, stroke=0, fill=1)

def ic_globe(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.2)
    c.circle(cx, cy, 6.5, stroke=1, fill=0)
    c.line(cx - 6.5, cy, cx + 6.5, cy)
    p = c.beginPath(); p.moveTo(cx, cy + 6.5); p.curveTo(cx - 4, cy + 2, cx - 4, cy - 2, cx, cy - 6.5)
    c.drawPath(p, stroke=1, fill=0)
    p = c.beginPath(); p.moveTo(cx, cy + 6.5); p.curveTo(cx + 4, cy + 2, cx + 4, cy - 2, cx, cy - 6.5)
    c.drawPath(p, stroke=1, fill=0)

# ---- rich tile icons -----------------------------------------------------
# Bigger and more detailed than the little section-bar glyphs, because in the
# grid the icon is what the eye lands on first. Still drawn by us: eight real
# brand logos on a distributed lead magnet implies endorsements we don't have.
def rc_peloton(cx, cy, col):
    """Classic bicycle silhouette. The stationary-bike drawing was more literal
    but turned to mush at 20px; legibility wins over accuracy for an icon."""
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineCap(1); c.setLineJoin(1)
    r = 4.4
    lx, rx, wy = cx - 6.6, cx + 6.6, cy - 3.2
    c.circle(lx, wy, r, stroke=1, fill=0)
    c.circle(rx, wy, r, stroke=1, fill=0)
    seat, bar = (cx - 2.4, cy + 3.6), (cx + 3.6, cy + 3.6)
    c.line(lx, wy, seat[0], seat[1])          # down tube
    c.line(seat[0], seat[1], bar[0], bar[1])  # top tube
    c.line(bar[0], bar[1], rx, wy)            # head tube
    c.line(seat[0], seat[1], rx, wy)          # seat stay
    c.line(cx - 4.4, cy + 3.6, cx - 0.6, cy + 3.6)   # saddle
    c.line(bar[0], bar[1], cx + 5.6, cy + 4.6)       # handlebar
    c.setFillColor(col)
    c.circle(lx, wy, 0.9, stroke=0, fill=1); c.circle(rx, wy, 0.9, stroke=0, fill=1)

def rc_ticket(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setLineJoin(1)
    c.roundRect(cx - 10, cy - 6, 20, 12, 2, stroke=1, fill=0)
    c.setFillColor(white)
    c.circle(cx - 10, cy, 2.2, stroke=0, fill=1); c.circle(cx + 10, cy, 2.2, stroke=0, fill=1)
    c.setStrokeColor(col); c.setLineWidth(1.4)
    c.circle(cx - 10, cy, 2.2, stroke=1, fill=0); c.circle(cx + 10, cy, 2.2, stroke=1, fill=0)
    c.setLineWidth(0.9); c.setDash(1.4, 1.6)
    c.line(cx, cy - 4.2, cx, cy + 4.2); c.setDash()

def rc_bag(cx, cy, col):              # takeout bag
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1)
    p = c.beginPath()
    p.moveTo(cx - 7, cy + 4); p.lineTo(cx - 5.5, cy - 7); p.lineTo(cx + 5.5, cy - 7)
    p.lineTo(cx + 7, cy + 4); p.close()
    c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(1.3)
    p = c.beginPath(); p.moveTo(cx - 3.2, cy + 4); p.curveTo(cx - 3.2, cy + 9.5, cx + 3.2, cy + 9.5, cx + 3.2, cy + 4)
    c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(1); c.line(cx - 6.2, cy + 0.5, cx + 6.2, cy + 0.5)

def rc_bed(cx, cy, col):              # hotel bed
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineCap(1); c.setLineJoin(1)
    c.line(cx - 10, cy + 5, cx - 10, cy - 6)                  # headboard
    c.line(cx - 10, cy - 1.5, cx + 10, cy - 1.5)              # mattress top
    c.line(cx + 10, cy - 1.5, cx + 10, cy - 6)
    c.line(cx - 10, cy - 6, cx + 10, cy - 6)                  # base
    c.roundRect(cx - 7.5, cy + 0.5, 6.5, 4, 1.2, stroke=1, fill=0)   # pillow
    c.setLineWidth(1.2)
    p = c.beginPath(); p.moveTo(cx + 1, cy + 0.5); p.curveTo(cx + 4, cy + 3.5, cx + 7, cy + 3.5, cx + 9, cy + 0.5)
    c.drawPath(p, stroke=1, fill=0)                            # duvet

def rc_crown(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1)
    p = c.beginPath()
    p.moveTo(cx - 9, cy - 4); p.lineTo(cx - 9, cy + 4); p.lineTo(cx - 4.5, cy - 0.5)
    p.lineTo(cx, cy + 6); p.lineTo(cx + 4.5, cy - 0.5); p.lineTo(cx + 9, cy + 4)
    p.lineTo(cx + 9, cy - 4); p.close()
    c.drawPath(p, stroke=1, fill=0)
    c.line(cx - 9, cy - 6.5, cx + 9, cy - 6.5)
    c.setFillColor(col)
    for dx in (-4.5, 0, 4.5): c.circle(cx + dx, cy + 1.5, 0.9, stroke=0, fill=1)

def rc_key(cx, cy, col):              # car rental = car + key
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1)
    c.roundRect(cx - 9, cy - 5, 18, 5.5, 1.6, stroke=1, fill=0)
    p = c.beginPath(); p.moveTo(cx - 6, cy + 0.5); p.lineTo(cx - 4, cy + 5)
    p.lineTo(cx + 4, cy + 5); p.lineTo(cx + 6, cy + 0.5)
    c.drawPath(p, stroke=1, fill=0)
    c.setFillColor(col)
    c.circle(cx - 5, cy - 5.5, 1.6, stroke=0, fill=1); c.circle(cx + 5, cy - 5.5, 1.6, stroke=0, fill=1)
    c.setStrokeColor(col); c.setLineWidth(1.2)
    c.circle(cx + 8.5, cy + 5.5, 2.2, stroke=1, fill=0)
    c.line(cx + 8.5, cy + 3.3, cx + 8.5, cy + 0.5)

def rc_phone(cx, cy, col):            # rideshare = phone + map pin
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1)
    c.roundRect(cx - 6, cy - 8, 12, 16, 2, stroke=1, fill=0)
    c.setLineWidth(1)
    c.line(cx - 2, cy - 6.2, cx + 2, cy - 6.2)
    c.setLineWidth(1.3)
    c.circle(cx, cy + 2.4, 2.6, stroke=1, fill=0)
    p = c.beginPath(); p.moveTo(cx - 1.9, cy + 0.9); p.lineTo(cx, cy - 3); p.lineTo(cx + 1.9, cy + 0.9)
    c.drawPath(p, stroke=1, fill=0)
    c.setFillColor(col); c.circle(cx, cy + 2.4, 0.9, stroke=0, fill=1)

def rc_passport(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1)
    c.roundRect(cx - 7, cy - 8, 14, 16, 1.8, stroke=1, fill=0)
    c.setLineWidth(1.2)
    # Simple crosshair globe: the curved meridian read like a currency symbol
    # once it was scaled down.
    c.circle(cx, cy + 1.5, 3.4, stroke=1, fill=0)
    c.line(cx - 3.4, cy + 1.5, cx + 3.4, cy + 1.5)
    c.line(cx, cy + 4.9, cx, cy - 1.9)
    c.setLineWidth(1); c.line(cx - 3.5, cy - 5, cx + 3.5, cy - 5)

def rc_tv(cx, cy, col):               # screen on a stand
    c.setStrokeColor(col); c.setLineWidth(1.5); c.setLineJoin(1); c.setLineCap(1)
    c.roundRect(cx - 9.5, cy - 3.5, 19, 12.5, 1.8, stroke=1, fill=0)
    c.line(cx, cy - 3.5, cx, cy - 6.5)
    c.line(cx - 5, cy - 6.5, cx + 5, cy - 6.5)
    c.setLineWidth(1.3)
    p = c.beginPath(); p.moveTo(cx - 1.8, cy + 5.6); p.lineTo(cx + 3.2, cy + 2.7); p.lineTo(cx - 1.8, cy - 0.2); p.close()
    c.setFillColor(col); c.drawPath(p, stroke=0, fill=1)

def rc_music(cx, cy, col):            # double quaver
    c.setStrokeColor(col); c.setLineWidth(1.6); c.setLineCap(1); c.setLineJoin(1)
    c.line(cx - 3.5, cy - 3.5, cx - 3.5, cy + 6.5)
    c.line(cx + 5.5, cy - 5, cx + 5.5, cy + 5)
    c.line(cx - 3.5, cy + 6.5, cx + 5.5, cy + 5)
    c.line(cx - 3.5, cy + 3.2, cx + 5.5, cy + 1.7)
    c.setFillColor(col)
    c.ellipse(cx - 7.2, cy - 5.6, cx - 1.6, cy - 1.8, stroke=0, fill=1)
    c.ellipse(cx + 1.8, cy - 7.1, cx + 7.4, cy - 3.3, stroke=0, fill=1)

def rc_dine(cx, cy, col):             # plate + cutlery
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setLineCap(1)
    c.circle(cx, cy, 7.2, stroke=1, fill=0)
    c.circle(cx, cy, 4.2, stroke=1, fill=0)
    c.setLineWidth(1.5)
    c.line(cx - 10.5, cy + 7, cx - 10.5, cy - 7)
    c.line(cx - 12.5, cy + 7, cx - 12.5, cy + 2); c.line(cx - 8.5, cy + 7, cx - 8.5, cy + 2)
    c.line(cx - 12.5, cy + 2, cx - 8.5, cy + 2)
    c.line(cx + 10.5, cy + 7, cx + 10.5, cy - 7)
    p = c.beginPath(); p.moveTo(cx + 10.5, cy + 7); p.curveTo(cx + 13.5, cy + 4, cx + 13.5, cy + 1, cx + 10.5, cy + 0.5)
    c.drawPath(p, stroke=1, fill=0)

def ic_fork(cx, cy, col):
    c.setStrokeColor(col); c.setLineWidth(1.3); c.setLineCap(1)
    c.line(cx-3, cy+7, cx-3, cy-7)
    c.line(cx-5, cy+7, cx-5, cy+2); c.line(cx-1, cy+7, cx-1, cy+2)
    c.line(cx-5, cy+2, cx-1, cy+2)
    c.line(cx+4, cy+7, cx+4, cy-7); c.line(cx+2, cy+7, cx+6, cy+7)

# =========================================================================
# PAGE 1
# =========================================================================
def header_band():
    y = PAGE_H
    bh = 108
    # gradient-ish band: purple base + soft gold band
    c.setFillColor(PURPLE)
    c.rect(0, y - bh, PAGE_W, bh, stroke=0, fill=1)
    c.setFillColor(alpha(PURPLE_D, 1))
    c.rect(0, y - bh, PAGE_W, 5, stroke=0, fill=1)  # bottom edge
    # logo on a clean white chip (top-right) — the brand mark is purple/gold on
    # transparent, so it needs a light background to read on the purple band.
    chip_w, chip_h = 150, 54
    chip_x = PAGE_W - MARGIN - chip_w
    chip_y = y - 14 - chip_h
    c.setFillColor(white)
    c.roundRect(chip_x, chip_y, chip_w, chip_h, 12, stroke=0, fill=1)
    LOGO = os.path.join(HERE, "..", "..", "public", "crazy4points-logo.png")
    if os.path.exists(LOGO):
        c.drawImage(LOGO, chip_x + 10, chip_y + 8, width=chip_w - 20, height=chip_h - 16,
                    preserveAspectRatio=True, anchor='c', mask='auto')
    # quiet "updated" line under the logo (no chunky pill)
    text(PAGE_W - MARGIN, chip_y - 12, "Updated for 2026", font="UI", size=9, col=alpha(GOLD, 0.95), right=True)
    # title block (left)
    text(MARGIN, y - 44, "The Sapphire Reserve Owner's Guide", font="Head", size=23, col=white)
    text(MARGIN, y - 64, "2026 Edition", font="Head", size=13, col=GOLD)
    # Body, not the handwriting face: with every other label unified, a lone
    # handwritten line read as an inconsistency rather than an accent.
    # Lead with what they LOSE — the fee is already sunk, the credits are not.
    text(MARGIN, y - 84, "Don't let Chase keep your money. There's $2,190 in credits in here, and most",
         font="Body", size=10.2, col=alpha(white, 0.95))
    text(MARGIN, y - 96, "cardholders leave hundreds of it on the table every single year.",
         font="Body", size=10.2, col=alpha(white, 0.95))
    return y - bh - 14

def row_line(x, w, y, col):
    c.setStrokeColor(alpha(col, 0.7)); c.setLineWidth(0.7)
    c.setDash(1, 2); c.line(x, y, x + w, y); c.setDash()

# ---- SET IT UP FIRST -----------------------------------------------------
# Each row carries the URL you actually need to go activate it, rendered as a
# clickable "GO" pill. Destinations are taken from links on Chase's own product
# page (or the government's official site for Global Entry) — never guessed.
SETUP = [
    # No link: this is activated inside Chase Offers behind a login, so there
    # is no public page worth sending anyone to.
    dict(label="Activate StubHub credit", sub="$150 twice a year - find it in Chase Offers first, then pay with the card"),
    dict(label="Activate Peloton credit", sub="$10/mo - easy to miss, it is not automatic",
         url="https://www.onepeloton.com/digital/promotions/chase"),
    dict(label="Activate DashPass", sub="$25/mo in DoorDash promos - you must activate BEFORE you order"),
    dict(label="Activate dining credit", sub="$150 twice a year - only at Sapphire Exclusive Tables restaurants",
         url="https://www.opentable.com/sapphire-reserve-exclusive-tables"),
    # Chase: "Subscriptions run through 6/22/2027" — it's the coverage window,
    # not an activation deadline (the old copy said "activate by", which is wrong).
    dict(label="Claim Apple TV+ & Apple Music", sub="$288/yr of subscriptions, included through 6/22/2027"),
    # shared field name — auto-syncs the "activated" tag in Perks (page 3)
    # The GO goes to IHG enrollment, so say so — the linking itself happens at
    # chase.com behind a login, which is no use as a destination.
    dict(label="Link IHG account -> Platinum status", sub="Platinum Elite - you have to link the two accounts first",
         url="https://www.ihg.com/rewardsclub/us/en/enrollment/join", field="act_ihg"),
    dict(label="Add card to your Lyft account", sub="$10/mo - add the card in the Lyft app or the credit never posts"),
    dict(label="Apply Global Entry / TSA / NEXUS", sub="$120 back once every 4 years - pay the fee with this card",
         url="https://ttp.dhs.gov"),
]
# NOTE: Priority Pass Select is deliberately NOT here. Chase's terms state the
# membership is "automatically activated" for primary cardmembers and authorized
# users, so listing it as a setup task told readers to do unnecessary work.
# It lives in Perks (page 3) as a truly automatic benefit.

# ---- SETUP GRID ----------------------------------------------------------
# Tiles instead of a list: it reads as a board you work through, not homework.
# Every figure verified against Chase's published terms — the version that
# inspired this had Peloton at $20/mo (it's $10), StubHub at $150/yr (it's $300)
# and IHG at Diamond (the card gives PLATINUM; Diamond needs $75K of spend).
# Chase only says "One-time activation required" for TWO of these (Peloton and
# StubHub). The rest are different jobs entirely — link an account, apply once,
# or literally nothing. Lumping them under "activate these" told readers to go
# hunt for switches that don't exist, so every tile now states what it actually
# needs from you.
TAGS = {
    "ACTIVATE":     SEC["setup"][0],    # Chase requires a one-time activation
    "LINK ACCOUNT": SEC["annual"][0],   # connect an account or add the card
    "APPLY ONCE":   SEC["annual"][0],
    "AUTOMATIC":    SEC["perks"][0],    # nothing to do
    "NOTHING TO DO": SEC["perks"][0],
}
GRID = [
    dict(name="Peloton", val="$10/mo credit", note="activation required", icon=rc_peloton,
         tag="ACTIVATE", url="https://www.onepeloton.com/digital/promotions/chase"),
    dict(name="StubHub + viagogo", val="$150 twice a year", note="one activation covers both", icon=rc_ticket,
         tag="ACTIVATE"),
    dict(name="DashPass", val="$25/mo in promos", note="set card as payment", icon=rc_bag,
         tag="LINK ACCOUNT"),
    dict(name="IHG One Rewards", val="Platinum Elite", note="link accounts, 3 weeks", icon=rc_crown,
         tag="LINK ACCOUNT", url="https://www.ihg.com/rewardsclub/us/en/enrollment/join", field="act_ihg"),
    dict(name="Car Rental", val="National, Avis, Hertz", note="enroll for upgrades", icon=rc_key,
         tag="LINK ACCOUNT"),
    dict(name="Lyft", val="$10/mo credit", note="add the card in the app", icon=rc_phone,
         tag="LINK ACCOUNT"),
    dict(name="Global Entry", val="$120 back", note="pay the fee with the card", icon=rc_passport,
         tag="APPLY ONCE", url="https://ttp.dhs.gov"),
    dict(name="Apple TV", val="12 months free", note="activate by 6/22/2027", icon=rc_tv,
         tag="ACTIVATE"),
    dict(name="Apple Music", val="12 months free", note="separate activation", icon=rc_music,
         tag="ACTIVATE"),
    dict(name="Dining Credit", val="$150 twice a year", note="book Exclusive Tables", icon=rc_dine,
         tag="NOTHING TO DO", url="https://www.opentable.com/sapphire-reserve-exclusive-tables"),
]
def text_ls(x, y, s_, font, size, col, spacing=1.2, center=False, right=False):
    """Letterspaced text. reportlab exposes character spacing on a text object,
    not on the canvas, so this wraps beginText/setCharSpace."""
    w = c.stringWidth(s_, font, size) + spacing * max(0, len(s_) - 1)
    sx = x - w / 2 if center else (x - w if right else x)
    t = c.beginText()
    t.setFont(font, size)
    t.setCharSpace(spacing)
    t.setFillColor(col)
    t.setTextOrigin(sx, y)
    t.textOut(s_)
    c.drawText(t)
    return w

def lux_bar(x, y_top, w, title, sub=None, h=30):
    """Deep purple band with a gold hairline and letterspaced caps. Replaces the
    candy-coloured section bar for the premium sections."""
    rrect_shadow(x, y_top - h, w, h, 6, alpha(INK, 0.22))
    c.setFillColor(PURPLE_D)
    c.roundRect(x, y_top - h, w, h, 6, stroke=0, fill=1)
    c.setStrokeColor(GOLD); c.setLineWidth(0.7)
    c.line(x + 14, y_top - h + 5, x + w - 14, y_top - h + 5)
    text_ls(x + 16, y_top - 19, title.upper(), "UIB", 10.5, white, spacing=1.6)
    if sub:
        c.setFillColor(alpha(GOLD_L, 0.9)); c.setFont("Body", 8)
        c.drawRightString(x + w - 16, y_top - 18, sub)
    return y_top - h

def draw_setup_grid(y):
    """Dark tiles, gold rules, serif names. The writable strip at the bottom of
    each tile stays WHITE on purpose: a fully dark tile looks great on screen but
    you cannot write on it once the sheet is printed."""
    x = MARGIN
    cols, gap = 5, 8
    tw = (CW - gap * (cols - 1)) / cols
    th = 100
    rows = (len(GRID) + cols - 1) // cols
    body_h = 12 + rows * th + (rows - 1) * gap
    bar_y = lux_bar(x, y, CW, "Start Here")
    top = bar_y - 10
    for i, item in enumerate(GRID):
        cx0 = x + (i % cols) * (tw + gap)
        cy0 = top - (i // cols) * (th + gap)
        mid = cx0 + tw / 2
        tag = item["tag"]
        actionable = tag in ("ACTIVATE", "LINK ACCOUNT", "APPLY ONCE")
        # tile: deep purple with a gold hairline
        rrect_shadow(cx0, cy0 - th, tw, th, 7, alpha(INK, 0.18))
        c.setFillColor(PURPLE_D)
        c.roundRect(cx0, cy0 - th, tw, th, 7, stroke=0, fill=1)
        c.setStrokeColor(alpha(GOLD, 0.55)); c.setLineWidth(0.7)
        c.roundRect(cx0 + 0.4, cy0 - th + 0.4, tw - 0.8, th - 0.8, 7, stroke=1, fill=0)
        # tag: hairline gold pill, letterspaced
        done = {"ACTIVATE": "ACTIVATED", "LINK ACCOUNT": "LINKED",
                "APPLY ONCE": "APPLIED"}.get(tag)
        tag_w = c.stringWidth(tag, "UIB", 4.9) + 0.7 * (len(tag) - 1) + 11
        pill_name = None
        if done:
            # The checkbox and the pill are two WIDGETS of one field, so ticking
            # the box flips both. Native PDF, no script.
            pill_name = item.get("field") or fid("pill")
            pill_w = max(tag_w, c.stringWidth(done, "Helvetica-Bold", 5) + 12)
            PILL_WIDGETS.append((1, pill_name,
                                 (cx0 + 7, cy0 - 15, cx0 + 7 + pill_w, cy0 - 4.5),
                                 tag, done))
        else:
            c.setStrokeColor(alpha(GOLD_L, 0.4)); c.setLineWidth(0.6)
            c.roundRect(cx0 + 7, cy0 - 15, tag_w, 10.5, 5.2, stroke=1, fill=0)
            text_ls(cx0 + 12.5, cy0 - 12, tag, "UIB", 4.9,
                    alpha(GOLD_L, 0.55), spacing=0.7)
        # gold icon
        item["icon"](mid, cy0 - 33, GOLD_L)
        # serif name, gold figure, muted note
        nsize = 8.2
        while c.stringWidth(item["name"], "HeadSm", nsize) > tw - 18 and nsize > 6.4:
            nsize -= 0.2
        text(mid, cy0 - 53, item["name"], font="HeadSm", size=nsize, col=white, center=True)
        vsize = 8.4
        while c.stringWidth(item["val"], "BodyB", vsize) > tw - 22 and vsize > 6.2:
            vsize -= 0.2
        text(mid, cy0 - 66, item["val"], font="BodyB", size=vsize, col=GOLD_L, center=True)
        text(mid, cy0 - 78, item["note"], font="Body", size=5.9, col=alpha(white, 0.62), center=True)
        # white writable strip
        by = cy0 - th + 7
        if actionable:
            c.setFillColor(white)
            c.roundRect(cx0 + 6, by - 4, tw - 12, 14, 3.5, stroke=0, fill=1)
            checkbox(cx0 + 10, by - 0.5, 10, pill_name, PURPLE)
            textfield(cx0 + 25, by - 1, tw - 33, 11, fid("sud"), fontsize=6.6, line=alpha(PURPLE, 0.35))
        else:
            text(mid, by + 3, "no action needed", font="Body", size=6.3,
                 col=alpha(white, 0.45), center=True)
        if item.get("url"):
            go_pill_lux(cx0 + tw - 31, cy0 - 32, item["url"])
    return bar_y - body_h - 10

def go_pill_lux(gx, cy, url):
    """Gold outline version of the GO pill for the dark tiles."""
    gw = c.stringWidth("GO", "UIB", 5.6) + 14
    c.setStrokeColor(alpha(GOLD_L, 0.8)); c.setLineWidth(0.6)
    c.roundRect(gx, cy - 3, gw, 11, 5.5, stroke=1, fill=0)
    text(gx + 5.5, cy + 0.2, "GO", font="UIB", size=5.6, col=GOLD_L)
    c.setStrokeColor(GOLD_L); c.setLineWidth(0.8); c.setLineCap(1)
    ax = gx + gw - 5.5
    c.line(ax - 2.6, cy + 2.5, ax, cy + 2.5)
    c.line(ax - 1.2, cy + 3.8, ax, cy + 2.5); c.line(ax - 1.2, cy + 1.2, ax, cy + 2.5)
    c.linkURL(url, (gx, cy - 3, gx + gw, cy + 8), relative=0, thickness=0)

def draw_setup(y):
    key = "setup"; col, tint, line = SEC[key]
    x = MARGIN
    rowh = 24
    body_h = len(SETUP) * rowh + 16
    bar_y = section_bar(x, y, CW, "Set It Up First   -   one-time. Skip these and you get $0.", key, icon=ic_bolt)
    card(x, bar_y, CW, body_h, tint, line, shadow=True)
    # tiny "done" hint over the checkbox column
    # Date column — several of these benefits expire or renew, so logging WHEN
    # you activated turns the sheet into a record you can audit next year.
    dtx = x + CW - 96
    text(dtx, bar_y - 12, "DATE DONE", font="UI", size=6.8, col=col)
    cy = bar_y - 26
    for item in SETUP:
        label, sub, url = item["label"], item["sub"], item.get("url")
        name = item.get("field") or fid("su")
        checkbox(x + 17, cy - 4, 15, name, col)
        text(x + 42, cy, label, font="Body", size=10.5, col=INK)
        text(x + 42, cy - 10.5, sub, font="Body", size=8.4, col=MUT)
        lead_from = x + 42 + c.stringWidth(label, "Body", 10.5) + 10
        if url:
            lead_from = go_pill(x + 42 + c.stringWidth(label, "Body", 10.5) + 8, cy, url, col) + 8
        c.setStrokeColor(alpha(col, 0.4)); c.setLineWidth(0.8); c.setDash(1, 3)
        c.line(lead_from, cy + 3, dtx - 6, cy + 3); c.setDash()
        textfield(dtx, cy - 5, 80, 14, fid("sud"), fontsize=9, line=line)
        cy -= rowh
    return bar_y - body_h - 10

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
    text(colH1 + 44, bar_y - 15, "JAN-JUN", font="UI", size=8.5, col=col, right=True)
    text(colH2 + 44, bar_y - 15, "JUL-DEC", font="UI", size=8.5, col=col, right=True)
    cy = bar_y - 40
    for i, (label, sub, amt) in enumerate(SEMI):
        text(x + 16, cy, label, font="Body", size=10.5, col=INK)
        text(x + 16, cy - 10.5, sub, font="Body", size=8.4, col=MUT)
        text(x + 16, cy - 10.5, "", font="Body", size=8)
        # amount tag
        c.setFillColor(alpha(col, 0.16)); c.roundRect(colH1 - 74, cy - 4, 46, 15, 7, stroke=0, fill=1)
        text(colH1 - 51, cy - 0.5, amt+" x2", font="UI", size=8, col=col, center=True)
        checkbox(colH1 + 20, cy - 3, 15, fid("s1"), col)
        checkbox(colH2 + 20, cy - 3, 15, fid("s2"), col)
        if i < len(SEMI) - 1:
            row_line(x + 16, CW - 32, cy - 15, line)
        cy -= rowh
    return bar_y - body_h - 8

# ---- CREDITS: MONTHLY ----------------------------------------------------
MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"]
MONTHLY = [
    ("Lyft ride credit", "$10/mo  -  in-app", 10),
    ("DoorDash restaurant", "$5/mo  -  promo", 5),
    ("DoorDash grocery/retail #1", "$10/mo  -  promo", 10),
    ("DoorDash grocery/retail #2", "$10/mo  -  promo", 10),
    ("Peloton membership", "$10/mo  -  statement credit", 10),
]
def draw_monthly(y):
    key = "monthly"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 25
    grid_x = x + CW - 12 * 20 - 12
    body_h = 22 + len(MONTHLY) * rowh + 6
    bar_y = section_bar(x, y, CW, "Credits to Cash In - Every Month   ($540)", key, icon=ic_cal)
    card(x, bar_y, CW, body_h, tint, line)
    # month letters header
    for m in range(12):
        text(grid_x + m * 20 + 10, bar_y - 15, MONTHS[m], font="UI", size=7.5, col=col, center=True)
    cy = bar_y - 38
    for i, (label, sub, worth) in enumerate(MONTHLY):
        text(x + 16, cy, label, font="Body", size=10, col=INK)
        text(x + 16, cy - 10, sub, font="Body", size=8.4, col=MUT)
        # Dotted leader across the dead space so the eye tracks from the credit
        # name to its 12 boxes instead of the two halves floating apart.
        lx = x + 16 + c.stringWidth(label, "Body", 10) + 10
        c.setStrokeColor(alpha(col, 0.5)); c.setLineWidth(0.8); c.setDash(1, 3)
        c.line(lx, cy + 3, grid_x - 6, cy + 3); c.setDash()
        for m in range(12):
            nm = fid("mo")
            SUM_CHECKBOXES.append((nm, worth))
            checkbox(grid_x + m * 20 + 4, cy - 3, 12, nm, col)
        cy -= rowh
    return bar_y - body_h - 8

# ---- CREDITS: ANNUAL / ONE-TIME -----------------------------------------
ANNUAL = [
    ("$300 Annual Travel Credit", "auto-applies to travel purchases", "page4"),
    ("$250 Chase Travel Hotels", "IHG, Montage, Omni, Pendry... thru 12/31/26"),
    ("$120 Global Entry / TSA / NEXUS", "once every 4 years"),
]
def draw_annual(y):
    key = "annual"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 25
    body_h = 16 + len(ANNUAL) * rowh
    bar_y = section_bar(x, y, CW, "Credits to Cash In - Once a Year", key, icon=ic_target)
    card(x, bar_y, CW, body_h, tint, line)
    cy = bar_y - 18
    for i, item in enumerate(ANNUAL):
        label, sub = item[0], item[1]
        tracked = len(item) > 2
        checkbox(x + 14, cy - 3, 14, fid("an"), col)
        text(x + 36, cy, label, font="Body", size=10.5, col=INK)
        text(x + 36, cy - 10, sub, font="Body", size=8.4, col=MUT)
        # Same leader treatment as the setup + monthly rows.
        lx = x + 36 + c.stringWidth(label, "Body", 10.5) + 10
        c.setStrokeColor(alpha(col, 0.45)); c.setLineWidth(0.8); c.setDash(1, 3)
        c.line(lx, cy + 3, x + CW - 156, cy + 3); c.setDash()
        if tracked:
            text(x + CW - 150, cy, "logged on page 4 ->", font="Body", size=8.2, col=col)
        else:
            text(x + CW - 150, cy, "used:", font="Body", size=8.5, col=MUT)
            _an = fid("and"); SUM_TEXTFIELDS.append(_an)
            textfield(x + CW - 122, cy - 4, 104, 14, _an, line=line)
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
    text(MARGIN, y - 23, "Sapphire Reserve Owner's Guide  -  2026", font="Head", size=13, col=white)
    text(PAGE_W - MARGIN, y - 22, f"page {pageno}", font="Head", size=10, col=GOLD, right=True)
    return y - 34 - 14

# ---- SPLIT (semi-annual) TRACKERS ---------------------------------------
def half_label_bar(x, w, y, key, label, goal, rows_note):
    col, tint, line = SEC[key]
    c.setFillColor(alpha(col, 0.20))
    c.roundRect(x, y - 17, w, 17, 8, stroke=0, fill=1)
    text(x + 12, y - 12.5, label, font="UI", size=8.5, col=col)
    # tally on the right: "$ ___ / $150 used"
    tx = x + w - 150
    text(tx, y - 12, "used  $", font="Body", size=8, col=MUT)
    _tal = fid("tal"); SUM_TEXTFIELDS.append(_tal)
    textfield(tx + 30, y - 15, 40, 12, _tal, fontsize=8, line=col)
    text(tx + 74, y - 12, f"/  ${goal}", font="UI", size=8, col=col)
    return y - 17

def draw_dining(y, rows_per_half=4):
    key = "dining"; col, tint, line = SEC[key]
    x = MARGIN
    hh = 15; lbl = 16; rowh = 22; gap = 8; pad = 8
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "Dining Tracker - Sapphire Exclusive Tables ($300)", key, icon=ic_fork)
    card(x, bar_y, CW, body_h, tint, line)
    # column x's
    c_go = x + 16; c_rest = x + 40; c_date = x + 246; c_amt = x + 318
    c_rate = x + 374; c_note = x + 440
    def cols():
        ly = cy0
        text(c_rest, ly, "RESTAURANT", font="UI", size=6.8, col=col)
        text(c_date, ly, "DATE", font="UI", size=6.8, col=col)
        text(c_amt, ly, "$ USED", font="UI", size=6.8, col=col)
        text(c_rate, ly, "RATING", font="UI", size=6.8, col=col)
        text(c_note, ly, "NOTES", font="UI", size=6.8, col=col)
    def rows():
        cy = cy0 - 19
        for r in range(rows_per_half):
            checkbox(c_go, cy - 2, 12, fid("dgo"), col)
            textfield(c_rest, cy - 3, c_date - c_rest - 8, 13, fid("drest"))
            textfield(c_date, cy - 3, c_amt - c_date - 8, 13, fid("ddate"))
            textfield(c_amt, cy - 3, c_rate - c_amt - 10, 13, fid("damt"))
            star_rating(c_rate + 5, cy + 3, 5, col)
            textfield(c_note, cy - 3, x + CW - 12 - c_note, 13, fid("dnote"))
            cy -= rowh
    top = bar_y - pad
    top = half_label_bar(x + 8, CW - 16, top, key, "JANUARY - JUNE", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    top = top - lbl - rows_per_half * rowh - gap
    top = half_label_bar(x + 8, CW - 16, top, key, "JULY - DECEMBER", 150, rows_per_half)
    cy0 = top - 6; cols(); rows()
    return bar_y - body_h - 8

# ---- THE EDIT STAY TRACKER ----------------------------------------------
def draw_edit(y, rows_per_half=2):
    key = "annual"; col, tint, line = SEC[key]  # peach for The Edit
    x = MARGIN
    hh = 17; lbl = 14; rowh = 24; gap = 8; pad = 10
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "The Edit - hotel credit  ($500/yr, $250 each half)", key, icon=ic_card)
    card(x, bar_y, CW, body_h, tint, line)
    c_book = x + 16; c_hotel = x + 52; c_dates = x + 200
    e1 = x + 270; e2 = x + 332; e3 = x + 398; c_note = x + 462
    def cols():
        ly = cy0
        text(c_hotel, ly, "HOTEL YOU STAYED AT", font="UI", size=6.8, col=col)
        text(c_dates, ly, "DATES", font="UI", size=6.8, col=col)
        text(e1, ly, "EXTRAS INCLUDED", font="UI", size=6.8, col=col)
        text(c_note, ly, "NOTES", font="UI", size=6.8, col=col)
    def rows():
        cy = cy0 - 16
        for r in range(rows_per_half):
            checkbox(c_book, cy - 3, 13, fid("eu"), col)
            textfield(c_hotel, cy - 3, c_dates - c_hotel - 8, 14, fid("ehotel"))
            textfield(c_dates, cy - 3, e1 - c_dates - 10, 14, fid("edate"))
            checkbox(e1, cy - 3, 11, fid("ecr"), col); text(e1 + 14, cy, "$100", font="Body", size=7.5, col=INK)
            checkbox(e2, cy - 3, 11, fid("ebk"), col); text(e2 + 14, cy, "brkfst", font="Body", size=7.5, col=INK)
            checkbox(e3, cy - 3, 11, fid("eup"), col); text(e3 + 14, cy, "upgrd", font="Body", size=7.5, col=INK)
            textfield(c_note, cy - 3, x + CW - 12 - c_note, 14, fid("enote"))
            cy -= rowh
    top = bar_y - pad
    top = half_label_bar(x + 8, CW - 16, top, key, "JANUARY - JUNE", 250, rows_per_half)
    cy0 = top - 6; cols(); rows()
    top = top - lbl - rows_per_half * rowh - gap
    top = half_label_bar(x + 8, CW - 16, top, key, "JULY - DECEMBER", 250, rows_per_half)
    cy0 = top - 6; cols(); rows()
    return bar_y - body_h - 8

# ---- TICKETS TRACKER (StubHub & viagogo) --------------------------------
def draw_tickets(y, rows_per_half=3):
    key = "protect"; col, tint, line = SEC[key]  # periwinkle so the trio reads distinct
    x = MARGIN
    hh = 15; lbl = 16; rowh = 22; gap = 8; pad = 8
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "Tickets Tracker - StubHub & viagogo ($300)", key, icon=ic_ticket)
    card(x, bar_y, CW, body_h, tint, line)
    c_go = x + 16; c_evt = x + 40; c_where = x + 220; c_date = x + 320
    c_amt = x + 390; c_note = x + 448
    def cols():
        ly = cy0
        text(c_evt, ly, "EVENT / SHOW", font="UI", size=6.8, col=col)
        text(c_where, ly, "WHERE", font="UI", size=6.8, col=col)
        text(c_date, ly, "DATE", font="UI", size=6.8, col=col)
        text(c_amt, ly, "$ USED", font="UI", size=6.8, col=col)
        text(c_note, ly, "NOTES", font="UI", size=6.8, col=col)
    def rows():
        cy = cy0 - 19
        for r in range(rows_per_half):
            checkbox(c_go, cy - 2, 12, fid("tgo"), col)
            textfield(c_evt, cy - 3, c_where - c_evt - 8, 13, fid("tevt"))
            # WHERE: two checkboxes instead of a free-text field
            checkbox(c_where, cy - 2, 11, fid("tsh"), col)
            text(c_where + 15, cy, "SH", font="Body", size=8, col=INK)
            checkbox(c_where + 44, cy - 2, 11, fid("tvg"), col)
            text(c_where + 59, cy, "vg", font="Body", size=8, col=INK)
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
    return bar_y - body_h - 8

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
    text(x + 182, bar_y - 20, "/  $75,000", font="UI", size=9.5, col=col)
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
        text(x + 34 + c.stringWidth(label, "Body", 9.8) + 8, cy, "- " + sub, font="Body", size=8.6, col=MUT)
        cy -= rowh
    return bar_y - body_h - 12

# ---- PERKS & STATUS ------------------------------------------------------
# (label, activate_field) — activate_field ties the leading checkbox to the
# matching "Set It Up First" task so it auto-checks; None = truly automatic.
PERKS = [
    ("IHG One Rewards Platinum", "act_ihg"),
    ("Chase Sapphire Lounges (+2 guests)", None),
    # Chase: membership is "automatically activated" — no enrollment needed.
    ("Priority Pass Select", None),
    ("Air Canada Maple Leaf Lounges & Cafes", None),
    ("Points Boost - up to 2x on flights & hotels", None),
    ("1:1 transfer to airline & hotel partners", None),
    ("No foreign transaction fees", None),
    ("Exclusive access to card member experiences", None),
    ("Reserve Travel Designers ($300/trip)", None),
]
def draw_perks(y):
    key = "perks"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 18
    n = len(PERKS); percol = (n + 1) // 2
    body_h = 20 + percol * rowh
    bar_y = section_bar(x, y, CW, "Perks You Get Automatically", key, icon=ic_crown)
    card(x, bar_y, CW, body_h, tint, line)
    text(x + 16, bar_y - 13, "IHG status needs activating - tick it in Set It Up First (page 1) and the box here auto-checks",
         font="Body", size=8.2, col=MUT)
    colw = CW / 2
    cy = bar_y - 30
    for i, (label, act) in enumerate(PERKS):
        cxx = x + 14 + (colw if i >= percol else 0)
        yy = cy - (i - percol if i >= percol else i) * rowh
        checkbox(cxx, yy - 2, 11, (act or fid("pk")), col)
        text(cxx + 18, yy, label, font="Body", size=9.3, col=INK)
        if act:
            lw = c.stringWidth(label, "Body", 9.3)
            text(cxx + 18 + lw + 8, yy, "ACTIVATED", font="UI", size=7, col=col)
    return bar_y - body_h - 12

# ---- EARNING CHEAT SHEET -------------------------------------------------
# "8x Travel" was misleading: 8x applies only through Chase Travel (incl. The
# Edit). Booking flights/hotels DIRECT earns 4x, so the old label could cost a
# reader points. "direct" is spelled out on the 4x pills for the same reason.
EARN = [("8x","Chase Travel"),("5x","Lyft"),("4x","flights direct"),
        ("4x","hotels direct"),("3x","dining"),("10x","Peloton"),("1x","all else")]
def draw_earn(y):
    x = MARGIN
    body_h = 44
    c.setFillColor(PURPLE); rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(PURPLE,0.3))
    c.roundRect(x, y - body_h, CW, body_h, 12, stroke=0, fill=1)
    text(x + 16, y - 17, "Earning Cheat-Sheet", font="UIB", size=11.5, col=white)
    text(x + 168, y - 16, "10x Peloton is on purchases over $150 (up to $5,000)",
         font="Body", size=8.2, col=alpha(white, 0.88))
    # Pills were alpha 0.14 white on purple — near-invisible on screen and worse
    # in grayscale print. Stronger fill + brighter gold reads cleanly both ways.
    fs = 9
    px = x + 16; py = y - 36
    for mult, cat in EARN:
        mw = c.stringWidth(mult, "UIB", fs); cw = c.stringWidth(cat, "Body", fs)
        w = mw + cw + 18
        # Solid white pill with dark text — a translucent pill left gold-on-purple
        # washed out at 9pt and unreadable in grayscale print.
        c.setFillColor(white); c.roundRect(px, py - 4, w, 17, 8, stroke=0, fill=1)
        text(px + 8, py, mult, font="UIB", size=fs, col=PURPLE)
        text(px + 8 + mw + 4, py, cat, font="Body", size=fs, col=INK)
        px += w + 6
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
    # 3 columns (was 2): these are short reference lines, so three columns reads
    # just as well and frees ~32pt for the Key Dates strip below.
    x = MARGIN; rowh = 16
    n = len(PROTECT); percol = (n + 2) // 3
    body_h = 14 + percol * rowh
    bar_y = section_bar(x, y, CW, "Know You're Covered - Travel & Purchase Protection", key, icon=ic_shield)
    card(x, bar_y, CW, body_h, tint, line)
    colw = CW / 3
    cy = bar_y - 17
    for i, label in enumerate(PROTECT):
        cxx = x + 14 + (i // percol) * colw
        yy = cy - (i % percol) * rowh
        checkbox(cxx, yy - 2, 10, fid("pr"), col)
        text(cxx + 16, yy, label, font="Body", size=8.3, col=INK)
    return bar_y - body_h - 10

# ---- CREDIT SCORECARD ----------------------------------------------------
def draw_scorecard(y):
    x = MARGIN; body_h = 58
    rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(GOLD, 0.35))
    c.setFillColor(HexColor("#FBF3D2")); c.setStrokeColor(GOLD); c.setLineWidth(1.4)
    c.roundRect(x, y - body_h, CW, body_h, 12, stroke=1, fill=1)
    star(x + 24, y - 21, 8, GOLD)
    text(x + 42, y - 18, "My Credit Scorecard", font="Head", size=13, col=PURPLE)
    text(x + 42, y - 34, "Up to ~$2,190/yr in statement credits - no extra spend needed.", font="Body", size=8.5, col=MUT)
    text(x + 42, y - 46, "(Apple TV+/Music & DashPass are extra.)  Beat that $795 fee!", font="Body", size=8.5, col=MUT)
    lx = x + CW - 214; vx = lx + 100
    text(lx, y - 24, "Captured ($)", font="UI", size=9, col=PURPLE)
    textfield(vx, y - 27, x + CW - 16 - vx, 15, fid("scap"), fontsize=10, line=GOLD)
    text(lx, y - 46, "Left on table ($)", font="UI", size=9, col=PURPLE)
    textfield(vx, y - 49, x + CW - 16 - vx, 15, fid("sleft"), fontsize=10, line=GOLD)
    return y - body_h - 10

def draw_notes(y, body_h=84):
    key = "perks"; col, tint, line = SEC[key]  # mint
    x = MARGIN
    bar_y = section_bar(x, y, CW, "Notes & Reminders", key, icon=ic_star)
    card(x, bar_y, CW, body_h, tint, line)
    c.acroForm.textfield(name=fid("notes"), x=x + 14, y=bar_y - body_h + 10, width=CW - 28,
        height=body_h - 20, fontName="Helvetica", fontSize=10, borderColor=line, fillColor=white,
        borderWidth=0.8, borderStyle="solid", forceBorder=True, fieldFlags="multiline")
    return bar_y - body_h - 10

# ---- KEY DATES -----------------------------------------------------------
# Missing a reset is the single most common way people lose money on this card,
# so every deadline lives in one strip. All dates verified vs Chase's terms.
RESETS = [
    ("1st of the month", "Lyft $10  -  DoorDash $25  -  Peloton $10"),
    ("Jan 1 & Jul 1", "The Edit $250  -  Dining $150  -  Tickets $150"),
    ("Your anniversary", "$300 travel credit resets"),
    ("Jan 1", "$75K spend counter resets"),
]
ENDS = [
    ("Sep 30, 2026", "Marriott Gold closes (if invited)"),
    ("Dec 31, 2026", "$250 Chase Travel hotel credit"),
    ("Jun 22, 2027", "Apple TV+ & Apple Music"),
    ("Mar 31, 2027", "Lyft 5x points offer ends"),
    ("Sep 30, 2027", "Lyft $10/mo credits end"),
    ("Dec 31, 2027", "StubHub, Peloton, DashPass, IHG"),
    ("Every 4 yrs", "Global Entry / TSA / NEXUS"),
]
def draw_dates(y):
    key = "annual"; col, tint, line = SEC[key]
    x = MARGIN
    rows = max(len(RESETS), len(ENDS))
    body_h = 28 + rows * 15
    bar_y = section_bar(x, y, CW, "Key Dates - don't leave money behind", key, icon=ic_cal)
    card(x, bar_y, CW, body_h, tint, line)
    leftw = CW * 0.56
    text(x + 14, bar_y - 14, "RESETS - USE IT OR LOSE IT", font="UI", size=7.2, col=col)
    text(x + 14 + leftw, bar_y - 14, "ENDS ON", font="UI", size=7.2, col=col)
    for i, (when, what) in enumerate(RESETS):
        yy = bar_y - 30 - i * 15
        text(x + 14, yy, when, font="UI", size=8.6, col=INK)
        text(x + 14 + 88, yy, what, font="Body", size=8.2, col=MUT)
    for i, (when, what) in enumerate(ENDS):
        yy = bar_y - 30 - i * 15
        text(x + 14 + leftw, yy, when, font="UI", size=8.6, col=INK)
        text(x + 14 + leftw + 74, yy, what, font="Body", size=8.2, col=MUT)
    return bar_y - body_h - 10

# ---- NEWSLETTER CTA ------------------------------------------------------
NEWSLETTER_URL = "https://www.crazy4points.com/newsletter"
CARDFINDER_URL = "https://www.crazy4points.com/cards"

def qr_png(url, path):
    """Render a QR to PNG. Matters because this sheet gets PRINTED."""
    import qrcode
    qrcode.make(url, border=1).save(path)
    return path

def draw_cta(y):
    """The ask. "Get the next checklist" asks someone to want another
    newsletter, which nobody does. This sells the outcome instead: never lose a
    credit again. Every claim is something the site actually does, and the two
    counts are pulled from the live database, not rounded for marketing."""
    x = MARGIN; body_h = 132
    rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(PURPLE, 0.3))
    c.setFillColor(PURPLE); c.roundRect(x, y - body_h, CW, body_h, 12, stroke=0, fill=1)
    star(x + 26, y - 24, 8, GOLD_L)
    text(x + 44, y - 19, "Never miss another credit", font="Head", size=15, col=white)
    text(x + 44, y - 35, "Free from Crazy4Points. We obsess over points so you don't have to.",
         font="Body", size=8.8, col=alpha(white, 0.9))
    by = y - 54
    for b in ["Updated checklists whenever Chase changes a benefit",
              "New checklists for other premium cards",
              "Transfer bonus alerts and award sweet spots",
              "A heads-up before your credits expire"]:
        c.setStrokeColor(GOLD_L); c.setLineWidth(1.3); c.setLineCap(1)
        c.line(x + 46, by + 3, x + 49, by); c.line(x + 49, by, x + 54, by + 6)
        text(x + 60, by, b, font="Body", size=8.6, col=white)
        by -= 13
    text(x + 44, y - 118,
         "We track 105 credit cards and 115 loyalty programs so you don't have to.",
         font="Body", size=7.8, col=alpha(white, 0.7))
    # QR codes: on paper a hyperlink is dead, a QR still works.
    qy = y - 104
    for i, (url, cap) in enumerate([(NEWSLETTER_URL, "Subscribe free"),
                                    (CARDFINDER_URL, "Free Card Finder")]):
        qx = x + CW - 186 + i * 92
        png = qr_png(url, os.path.join(HERE, "_qr%d.png" % i))
        c.setFillColor(white); c.roundRect(qx - 5, qy - 5, 70, 70, 6, stroke=0, fill=1)
        c.drawImage(png, qx, qy, width=60, height=60, mask='auto')
        text(qx + 30, qy - 15, cap, font="UIB", size=7.2, col=GOLD_L, center=True)
        c.linkURL(url, (qx - 5, qy - 5, qx + 65, qy + 65), relative=0, thickness=0)
    return y - body_h - 10
# ---- LOUNGE VISITS -------------------------------------------------------
# Lounges are the benefit people use most and track least. One box per visit.
# NOTE: we deliberately do NOT print a dollar value per visit — a lounge visit
# has no fixed worth, and inventing one would be the kind of fake valuation the
# brand rules forbid. The reader assigns their own number below; the only
# figure quoted here is Chase's own.
LOUNGES = [
    ("Chase Sapphire Lounges by The Club", "you + 2 guests", "https://account.chase.com/sapphire-airport-lounge"),
    ("Priority Pass Select lounges", "1,300+ worldwide, you + 2 guests", "https://www.prioritypass.com/select"),
    ("Air Canada Maple Leaf Lounges", "Star Alliance flights, +1 guest free", "https://www.aircanada.com/lounges"),
]
def draw_lounges(y):
    key = "perks"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 28
    body_h = 32 + len(LOUNGES) * rowh
    bar_y = section_bar(x, y, CW, "Lounge Visits - tick a box each time you go", key, icon=ic_crown)
    card(x, bar_y, CW, body_h, tint, line)
    text(x + 16, bar_y - 15,
         "Two guests free per card, then $27 each. Air Canada allows one free guest, then $59 each.",
         font="Body", size=8.2, col=MUT)
    gx = x + CW - 12 * 18 - 16
    cy = bar_y - 38
    for label, sub, url in LOUNGES:
        text(x + 16, cy, label, font="Body", size=9.8, col=INK)
        text(x + 16, cy - 10, sub, font="Body", size=8.2, col=MUT)
        # These links DO earn their place: they show you where the lounges are.
        lx = go_pill(x + 16 + c.stringWidth(label, "Body", 9.8) + 8, cy, url, col) + 8
        c.setStrokeColor(alpha(col, 0.5)); c.setLineWidth(0.8); c.setDash(1, 3)
        c.line(lx, cy + 3, gx - 6, cy + 3); c.setDash()
        for m in range(12):
            checkbox(gx + m * 18 + 3, cy - 4, 11, fid("lv"), col)
        cy -= rowh
    return bar_y - body_h - 10

# ---- RUNNING TOTAL -------------------------------------------------------
CAP_FIELD, LOUNGE_FIELD, NET_FIELD = "cap_total", "lounge_val", "net_total"
ANNUAL_FEE = 795  # Chase published
# Every field here is WRITABLE and every target is PRINTED, because PDF
# JavaScript only runs in Adobe Acrobat. In Chrome, Safari, Preview and phone
# viewers a read-only "auto" field just sits there empty looking broken, so the
# sheet has to add up by hand. The auto-calc still runs for Acrobat users as a
# bonus, it is simply no longer what the design depends on.
CAP_LINES = [
    ("cap_monthly", "Monthly credits",     540),
    ("cap_edit",    "The Edit hotel",      500),
    ("cap_dining",  "Dining",              300),
    ("cap_tickets", "StubHub + viagogo",   300),
    ("cap_travel",  "Travel credit",       300),
    ("cap_hotels",  "Chase Travel hotels", 250),
]
def draw_total(y):
    x = MARGIN; body_h = 152
    rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(GOLD, 0.35))
    c.setFillColor(HexColor("#FBF3D2")); c.setStrokeColor(GOLD); c.setLineWidth(1.4)
    c.roundRect(x, y - body_h, CW, body_h, 12, stroke=1, fill=1)
    star(x + 24, y - 21, 8, GOLD)
    text(x + 42, y - 18, "What I've Captured", font="Head", size=13, col=PURPLE)
    text(x + 42, y - 32, "Fill in what you have actually claimed. The target beside each line is the most Chase will give you.",
         font="Body", size=8, col=MUT)

    def money(nm, bx, by_, w=54):
        c.acroForm.textfield(name=nm, x=bx, y=by_, width=w, height=13,
            fontName="Helvetica", fontSize=9, borderColor=GOLD, fillColor=white,
            textColor=INK, borderWidth=0.8, borderStyle="solid", forceBorder=True)

    colw = (CW - 84) / 2
    for i, (nm, label, target) in enumerate(CAP_LINES):
        cxx = x + 42 + (colw if i >= 3 else 0)
        yy = y - 52 - (i % 3) * 17
        text(cxx, yy, label, font="Body", size=8.6, col=INK)
        money(nm, cxx + 118, yy - 3)
        text(cxx + 176, yy, f"/ ${target}", font="Body", size=8, col=MUT)

    ry = y - 110
    c.setStrokeColor(alpha(GOLD_D, 0.5)); c.setLineWidth(0.8)
    c.line(x + 42, ry + 12, x + CW - 42, ry + 12)
    text(x + 42, ry, "Total captured", font="UIB", size=9.5, col=PURPLE)
    money(CAP_FIELD, x + 160, ry - 3, 64)
    text(x + 230, ry, f"/ ${sum(t for _, _, t in CAP_LINES):,}", font="UIB", size=9, col=GOLD_D)
    text(x + 300, ry, "Annual fee", font="Body", size=8.6, col=INK)
    text(x + 360, ry, f"- ${ANNUAL_FEE}", font="UIB", size=9, col=MUT)

    ry2 = ry - 18
    text(x + 42, ry2, "Lounges + extras worth to me", font="Body", size=8.6, col=INK)
    money(LOUNGE_FIELD, x + 160, ry2 - 3, 64)
    text(x + 300, ry2, "Ahead by", font="UIB", size=9.5, col=PURPLE)
    money(NET_FIELD, x + 360, ry2 - 3, 64)

    ry3 = ry2 - 20
    text(x + 42, ry3, "My card anniversary", font="Body", size=8.6, col=INK)
    c.acroForm.textfield(name="anniv", x=x + 160, y=ry3 - 3, width=64, height=13,
        fontName="Helvetica", fontSize=9, borderColor=GOLD, fillColor=white,
        textColor=INK, borderWidth=0.8, borderStyle="solid", forceBorder=True)
    text(x + 230, ry3, "credits reset on the calendar year, the fee posts on your anniversary",
         font="Body", size=7.4, col=MUT)
    return y - body_h - 10

# ---- $300 TRAVEL CREDIT TRACKER -----------------------------------------
# This credit does NOT get spent in one go. Chase applies it automatically to
# travel purchases until it runs out, so in practice it disappears in small
# bites — parking, transit, tolls, a taxi. A single "used $___" box can't show
# that, so it gets line items and an auto "how much is left" readout.
TC_USED, TC_LEFT = "tc_used", "tc_left"
TRAVEL_CREDIT = 300
def draw_travel_credit(y, rows=4):
    key = "annual"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 17
    body_h = 38 + rows * rowh
    bar_y = section_bar(x, y, CW, f"${TRAVEL_CREDIT} Travel Credit - spend it in as many bites as you like", key, icon=ic_cal)
    card(x, bar_y, CW, body_h, tint, line)
    text(x + 16, bar_y - 12,
         "COUNTS: parking lots and garages, tolls, taxis, limos, ferries, trains, buses, airlines, hotels, car rental.",
         font="Body", size=7.7, col=INK)
    text(x + 16, bar_y - 22,
         "DOESN'T COUNT: in-flight purchases, shops inside hotels and airports, sightseeing, excursions, gift cards.",
         font="Body", size=7.7, col=MUT)
    c_date, c_what, c_amt = x + 16, x + 96, x + CW - 210
    text(c_date, bar_y - 34, "DATE", font="UI", size=6.8, col=col)
    text(c_what, bar_y - 34, "WHAT IT WAS", font="UI", size=6.8, col=col)
    text(c_amt, bar_y - 34, "$ USED", font="UI", size=6.8, col=col)
    cy = bar_y - 48
    for _ in range(rows):
        textfield(c_date, cy - 3, 72, 13, fid("tcd"))
        textfield(c_what, cy - 3, c_amt - c_what - 10, 13, fid("tcw"))
        nm = fid("tca"); SUM_TEXTFIELDS.append(nm)
        textfield(c_amt, cy - 3, 60, 13, nm)
        cy -= rowh
    # auto used / left
    rx = x + CW - 130
    text(rx, bar_y - 48, "used", font="UI", size=7.4, col=col)
    text(rx, bar_y - 48 - rowh, "left", font="UI", size=7.4, col=col)
    text(rx + 114, bar_y - 48, f"of ${TRAVEL_CREDIT}", font="Body", size=7.2, col=MUT)
    for i, nm in enumerate((TC_USED, TC_LEFT)):
        c.acroForm.textfield(
            name=nm, x=rx + 26, y=bar_y - 52 - i * rowh, width=84, height=14,
            fontName="Helvetica", fontSize=10, borderColor=col,
            fillColor=white, textColor=INK, borderWidth=0.8,
            borderStyle="solid", forceBorder=True)
    return bar_y - body_h - 10

BREAKEVEN = [
    ("Monthly credits", 540, "monthly"),
    ("The Edit hotel", 500, "annual"),
    ("Dining", 300, "dining"),
    ("Tickets", 300, "protect"),
    ("Travel credit", 300, "perks"),
    ("Chase Travel hotels", 250, "spend"),
]
def draw_breakeven(y):
    x = MARGIN; body_h = 68
    total = sum(v for _, v, _ in BREAKEVEN)
    bar_y = section_bar(x, y, CW, "Break-Even at a Glance", "setup", icon=ic_target)
    col, tint, line = SEC["setup"]
    card(x, bar_y, CW, body_h, tint, line)
    bx, bw, bh = x + 16, CW - 32, 22
    by = bar_y - 40
    scale = bw / total
    # stacked segments, one per credit group
    cx = bx
    for label, val, key in BREAKEVEN:
        w = val * scale
        c.setFillColor(SEC[key][0])
        c.rect(cx, by, w, bh, stroke=0, fill=1)
        if w > 42:
            text(cx + w / 2, by + 7, f"${val}", font="UIB", size=7.4, col=white, center=True)
        cx += w
    c.setStrokeColor(alpha(INK, 0.25)); c.setLineWidth(0.8)
    c.roundRect(bx, by, bw, bh, 3, stroke=1, fill=0)
    # Fee marker: ticks ABOVE and BELOW the bar plus a pointer, never a line
    # through it — a line across the middle sliced the "$500" segment label in half.
    fx = bx + ANNUAL_FEE * scale
    c.setStrokeColor(INK); c.setLineWidth(1.6)
    c.line(fx, by + bh, fx, by + bh + 7)
    c.line(fx, by - 6, fx, by)
    p = c.beginPath()
    p.moveTo(fx - 3.6, by + bh + 7); p.lineTo(fx + 3.6, by + bh + 7); p.lineTo(fx, by + bh + 2.5); p.close()
    c.setFillColor(INK); c.drawPath(p, fill=1, stroke=0)
    text(fx, by + bh + 11, f"${ANNUAL_FEE} fee - you break even here",
         font="UIB", size=7.6, col=INK, center=True)
    text(bx, by - 16, f"${total:,} in statement credits, no extra spend needed",
         font="Body", size=8.4, col=INK)
    text(bx + bw, by - 16, "Lounges, status and points are on top of this",
         font="Body", size=8, col=MUT, right=True)
    return bar_y - body_h - 10

def footer():
    y = 22
    c.setStrokeColor(alpha(MUT, 0.4)); c.setLineWidth(0.7)
    c.line(MARGIN, y + 14, PAGE_W - MARGIN, y + 14)
    # Branding only — no footer hyperlink, and no "verified vs Chase" line.
    # The newsletter CTA on the last page carries the one link that matters.
    text(MARGIN, y, "crazy4points.com", font="UI", size=8.5, col=PURPLE)
    # "Not affiliated with Chase" stays deliberately: the sheet uses Chase's
    # trademarks throughout, so the disclaimer is worth keeping.
    text(PAGE_W - MARGIN, y, "Not affiliated with Chase", font="Body", size=8, col=MUT, right=True)

# =========================================================================
# COMPOSE
# =========================================================================
# PAGE 1 - setup + the non-semi credits + earning cheat-sheet
y = header_band()
y = draw_setup_grid(y)
y = draw_monthly(y)
y = draw_annual(y)
y = draw_earn(y)
footer()
c.showPage()

# PAGE 2 - twice-a-year credits, each tracked in place
y = mini_header(2)
text(MARGIN, y - 6, "Twice-a-Year Credits", font="Head", size=15, col=PURPLE)
text(MARGIN, y - 22, "Each resets Jan-Jun and Jul-Dec. Log them here as you use them.", font="Body", size=9.5, col=MUT)
y = y - 34
y = draw_edit(y, rows_per_half=2)
y = draw_dining(y, rows_per_half=3)
y = draw_tickets(y, rows_per_half=2)
footer()
c.showPage()

# PAGE 3 - unlocks, perks, protection, scorecard, notes
y = mini_header(3)
y = draw_spend(y)
y = draw_perks(y)
y = draw_protect(y)
y = draw_scorecard(y)
y = draw_dates(y)
footer()
c.showPage()

# PAGE 4 - lounge visits, the running total, notes, and the ask
y = mini_header(4)
y = draw_travel_credit(y)
y = draw_lounges(y)
y = draw_total(y)
y = draw_breakeven(y)
y = draw_cta(y)
footer()
c.showPage()

c.save()


def add_cumulative_star_js(path):
    """Make the star ratings behave like a real rating widget.

    Out of the box each star is an independent checkbox, so clicking the 4th
    star fills ONLY the 4th. Readers expect 4 stars to mean "four out of five",
    so each star gets a mouse-up JavaScript action that fills every star up to
    and including the one clicked and clears the rest.

    NOTE: PDF JavaScript runs in Acrobat/Reader and most full PDF apps, but
    macOS Preview does NOT execute it. In Preview the stars still toggle
    individually — the sheet stays usable, it just doesn't cascade.
    """
    import json
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import (NameObject, DictionaryObject, TextStringObject,
                               ArrayObject, BooleanObject)

    writer = PdfWriter(clone_from=path)
    rows_done = 0
    for page in writer.pages:
        stars = [a.get_object() for a in (page.get("/Annots") or [])
                 if str(a.get_object().get("/T", "")).startswith("drate")]
        rows = {}
        for w in stars:
            rows.setdefault(round(float(w["/Rect"][1])), []).append(w)
        for _y, ws in rows.items():
            ws.sort(key=lambda w: float(w["/Rect"][0]))
            names = [str(w["/T"]) for w in ws]
            for k, w in enumerate(ws):
                js = (f"var f={json.dumps(names)};var n={k};"
                      "for(var i=0;i<f.length;i++){"
                      "this.getField(f[i]).value=(i<=n)?'Yes':'Off';}")
                act = DictionaryObject()
                act[NameObject("/S")] = NameObject("/JavaScript")
                act[NameObject("/JS")] = TextStringObject(js)
                aa = DictionaryObject()
                aa[NameObject("/U")] = act
                w[NameObject("/AA")] = aa
            rows_done += 1
    # ---- status pills (NO JavaScript) ----------------------------------------
    # PDF JavaScript only runs in Adobe Acrobat, and almost nobody opens a PDF
    # there — it's Preview, Chrome, Safari or a phone. So the pill is a real
    # checkbox whose two appearance streams ARE the two states: a gold
    # "ACTIVATE" outline when off, a solid green "ACTIVATED" pill when on.
    # Toggling appearances is native PDF, so this works in every viewer.
    from pypdf.generic import (DecodedStreamObject, FloatObject, NumberObject,
                               IndirectObject)

    def _pill_stream(w, h, label, filled):
        """Content stream for one pill state. Rounded ends drawn with beziers."""
        r = h / 2.0
        k = 0.5523 * r
        gold = "0.961 0.808 0.353"
        green = "0.176 0.545 0.337"
        ops = ["q"]
        path = (
            f"{r:.2f} 0 m {w-r:.2f} 0 l "
            f"{w-r+k:.2f} 0 {w:.2f} {r-k:.2f} {w:.2f} {r:.2f} c "
            f"{w:.2f} {r+k:.2f} {w-r+k:.2f} {h:.2f} {w-r:.2f} {h:.2f} c "
            f"{r:.2f} {h:.2f} l "
            f"{r-k:.2f} {h:.2f} 0 {r+k:.2f} 0 {r:.2f} c "
            f"0 {r-k:.2f} {r-k:.2f} 0 {r:.2f} 0 c h"
        )
        if filled:
            ops += [f"{green} rg", f"{path} f", "1 1 1 rg"]
        else:
            ops += [f"{gold} RG", "0.6 w", f"{path} S", f"{gold} rg"]
        tx = (w - len(label) * 2.9) / 2.0
        ops += ["BT /Helv 5 Tf", f"1 0 0 1 {max(4.0, tx):.2f} {h/2-1.7:.2f} Tm",
                f"({label}) Tj", "ET", "Q"]
        return "\n".join(ops).encode("latin-1")

    helv = writer._root_object["/AcroForm"]["/DR"]["/Font"]["/Helv"]
    for page_no, fname, rect, off_label, on_label in PILL_WIDGETS:
        page = writer.pages[page_no - 1]
        x0, y0, x1, y1 = rect
        w, h = x1 - x0, y1 - y0
        aps = {}
        for state, label, filled in (("/Off", off_label, False), ("/Yes", on_label, True)):
            st = DecodedStreamObject()
            st.set_data(_pill_stream(w, h, label, filled))
            st[NameObject("/Type")] = NameObject("/XObject")
            st[NameObject("/Subtype")] = NameObject("/Form")
            st[NameObject("/FormType")] = NumberObject(1)
            st[NameObject("/BBox")] = ArrayObject([FloatObject(0), FloatObject(0),
                                                   FloatObject(w), FloatObject(h)])
            res = DictionaryObject()
            fonts = DictionaryObject(); fonts[NameObject("/Helv")] = helv
            res[NameObject("/Font")] = fonts
            st[NameObject("/Resources")] = res
            aps[state] = writer._add_object(st)
        n = DictionaryObject()
        n[NameObject("/Off")] = aps["/Off"]; n[NameObject("/Yes")] = aps["/Yes"]
        ap = DictionaryObject(); ap[NameObject("/N")] = n

        # Find the checkbox reportlab already drew in the white strip, and make
        # it and the pill two KIDS of one parent field. One field, two widgets:
        # tick either and both redraw from the shared value. This is what makes
        # "check the box, the pill turns green" work with no JavaScript at all.
        box_ref = None
        for a in (page.get("/Annots") or []):
            if str(a.get_object().get("/T", "")) == fname:
                box_ref = a
                break

        pill = DictionaryObject()
        pill[NameObject("/Type")] = NameObject("/Annot")
        pill[NameObject("/Subtype")] = NameObject("/Widget")
        pill[NameObject("/Rect")] = ArrayObject([FloatObject(v) for v in rect])
        pill[NameObject("/F")] = NumberObject(4)
        pill[NameObject("/AP")] = ap
        pill[NameObject("/AS")] = NameObject("/Off")
        pill[NameObject("/MK")] = DictionaryObject()
        pill_ref = writer._add_object(pill)

        if box_ref is not None:
            box = box_ref.get_object()
            parent = DictionaryObject()
            parent[NameObject("/FT")] = NameObject("/Btn")
            parent[NameObject("/T")] = TextStringObject(fname)
            parent[NameObject("/V")] = NameObject("/Off")
            parent[NameObject("/Kids")] = ArrayObject([box_ref, pill_ref])
            parent_ref = writer._add_object(parent)
            # kids must not carry the field name or value themselves
            for k in ("/T", "/V", "/FT", "/Ff"):
                if k in box:
                    del box[NameObject(k)]
            box[NameObject("/Parent")] = parent_ref
            pill[NameObject("/Parent")] = parent_ref
            fields = writer._root_object["/AcroForm"][NameObject("/Fields")]
            for i, fref in enumerate(fields):
                if fref.idnum == box_ref.idnum:
                    fields[i] = parent_ref
                    break
            else:
                fields.append(parent_ref)
        else:
            pill[NameObject("/FT")] = NameObject("/Btn")
            pill[NameObject("/T")] = TextStringObject(fname)
            pill[NameObject("/V")] = NameObject("/Off")
            writer._root_object["/AcroForm"][NameObject("/Fields")].append(pill_ref)

        annots = page.get("/Annots")
        if annots is None:
            page[NameObject("/Annots")] = ArrayObject([pill_ref])
        else:
            annots.append(pill_ref)

    # ---- auto-summing total ------------------------------------------------
    # "Statement credits claimed" adds up every ticked credit using Chase's own
    # published amounts, plus whatever the reader typed in the "used" boxes.
    # "Ahead by" subtracts the published $795 fee. Both fields are read-only so
    # the numbers can't be edited into fiction.
    lines = json.dumps([n for n, _, _ in CAP_LINES])
    cap_js = (
        f"var a={lines};var t=0;var any=false;"
        "for(var i=0;i<a.length;i++){var g=this.getField(a[i]);"
        "if(g){var v=parseFloat(String(g.value).replace(/[^0-9.\\-]/g,''));"
        "if(!isNaN(v)){t+=v;any=true;}}}"
        "if(any){event.value=t;}"
    )
    net_js = (
        f"var a=parseFloat(String(this.getField('{CAP_FIELD}').value).replace(/[^0-9.\\-]/g,''))||0;"
        f"var b=parseFloat(String(this.getField('{LOUNGE_FIELD}').value).replace(/[^0-9.\\-]/g,''))||0;"
        f"var n=a+b-{ANNUAL_FEE};"
        "if(a||b){event.value=n;}"
    )
    # The travel credit's line items roll up into "used" and "left".
    tc_amts = json.dumps([n for n in SUM_TEXTFIELDS if n.startswith("tca")])
    tc_used_js = (
        f"var a={tc_amts};var t=0;"
        "for(var i=0;i<a.length;i++){var g=this.getField(a[i]);"
        "if(g){var v=parseFloat(String(g.value).replace(/[^0-9.\\-]/g,''));"
        "if(!isNaN(v)){t+=v;}}}"
        "event.value=t?('$'+t):'';"
    )
    tc_left_js = (
        f"var u=parseFloat(String(this.getField('{TC_USED}').value).replace(/[^0-9.\\-]/g,''))||0;"
        f"event.value=('$'+Math.max(0,{TRAVEL_CREDIT}-u));"
    )
    calc_map = {CAP_FIELD: cap_js, NET_FIELD: net_js,
                TC_USED: tc_used_js, TC_LEFT: tc_left_js}
    calc_refs = []
    for page in writer.pages:
        for a in (page.get("/Annots") or []):
            o = a.get_object()
            nm = str(o.get("/T", ""))
            js = calc_map.get(nm)
            if not js:
                continue
            act = DictionaryObject()
            act[NameObject("/S")] = NameObject("/JavaScript")
            act[NameObject("/JS")] = TextStringObject(js)
            aa = DictionaryObject()
            aa[NameObject("/C")] = act
            o[NameObject("/AA")] = aa
            calc_refs.append(a)
    # /CO tells the viewer which fields to recalculate, and in what order.
    if calc_refs:
        form = writer._root_object["/AcroForm"]
        form[NameObject("/CO")] = ArrayObject(calc_refs)

    # Do NOT set /NeedAppearances. It tells the viewer to throw away every
    # field's appearance stream and redraw it, which destroyed the custom vector
    # stars: the viewer fell back to the ZapfDingbats checkbox glyph, couldn't
    # find that font, and painted a black blob over each star. Register ZaDb in
    # the form's resources anyway, so viewers that regenerate regardless still
    # have the font they need.
    form = writer._root_object["/AcroForm"]
    dr = form.get("/DR")
    if dr is not None:
        fonts = dr.get("/Font")
        if fonts is not None and "/ZaDb" not in fonts:
            zadb = DictionaryObject()
            zadb[NameObject("/Type")] = NameObject("/Font")
            zadb[NameObject("/Subtype")] = NameObject("/Type1")
            zadb[NameObject("/BaseFont")] = NameObject("/ZapfDingbats")
            fonts[NameObject("/ZaDb")] = writer._add_object(zadb)

    with open(path, "wb") as fh:
        writer.write(fh)
    return rows_done


_rows = add_cumulative_star_js(OUT)
print(f"wrote {OUT}  (cumulative star JS on {_rows} rating rows)")
