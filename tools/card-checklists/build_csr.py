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
CREAM    = HexColor("#FCF8EC")   # warm ivory — every section panel (v53)
DEEP     = HexColor("#2E1440")   # deep aubergine — big purple surfaces (v53)

# section (header color, soft card tint, line color)
SEC = {
    "setup":   (HexColor("#8A4FD6"), HexColor("#F1E9FB"), HexColor("#DFCFF3")),
    "semi":    (HexColor("#E0699B"), HexColor("#FCE6F1"), HexColor("#F6CFE1")),
    "monthly": (HexColor("#3C90A6"), HexColor("#E1F4FA"), HexColor("#C6E9F2")),
    "annual":  (HexColor("#D98C4F"), HexColor("#FFEEDD"), HexColor("#FAD9BE")),
    "dining":  (HexColor("#CB5783"), HexColor("#FCE1EC"), HexColor("#F6C9DC")),
    "spend":   (HexColor("#C79A20"), HexColor("#FBF3D2"), HexColor("#EFE0A8")),
    "perks":   (HexColor("#539577"), HexColor("#E4F5EC"), HexColor("#C9EAD8")),
    "protect": (HexColor("#7981C5"), HexColor("#EAECFB"), HexColor("#D3D8F4")),
    "edit":    (HexColor("#515A90"), HexColor("#EDEFFB"), HexColor("#CDD3F0")),
}

PAGE_W, PAGE_H = letter
MARGIN = 30
CW = PAGE_W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("The Sapphire Reserve Companion - 2026 Edition")
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

def section_bar(x, y_top, w, title, key, h=24, icon=None, sub=None):
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
    if sub:
        # White, not gold: gold subs wash out on the orange (Edit, Key Dates) and
        # amber ($75K) bars. White reads on every bar colour.
        text(x + w - 14, y_top - h + 8, sub, font="UI", size=8.5, col=alpha(white, 0.92), right=True)
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
    """v53 header: a contained rounded card, two-tone — a deep aubergine left
    panel (title + tagline) and a cream right panel (logo + newsletter button),
    split by a thin gold divider."""
    y = PAGE_H
    tm = 18; bh = 104
    x0 = MARGIN; w = CW; top = y - tm; bot = top - bh
    split = x0 + w * 0.655
    rrect_shadow(x0, bot, w, bh, 12, alpha(INK, 0.18))
    # cream base card, then the deep-purple left clipped to the rounded shape
    c.setFillColor(CREAM); c.roundRect(x0, bot, w, bh, 12, stroke=0, fill=1)
    c.saveState()
    clip = c.beginPath(); clip.roundRect(x0, bot, w, bh, 12); c.clipPath(clip, stroke=0, fill=0)
    c.setFillColor(DEEP); c.rect(x0, bot, split - x0, bh, stroke=0, fill=1)
    c.restoreState()
    c.setStrokeColor(GOLD); c.setLineWidth(1.1); c.line(split, bot + 10, split, top - 10)
    c.setStrokeColor(alpha(GOLD, 0.8)); c.setLineWidth(1)
    c.roundRect(x0, bot, w, bh, 12, stroke=1, fill=0)
    # left: eyebrow, serif title, tagline
    text(x0 + 20, top - 24, "2026 EDITION", font="UI", size=8, col=alpha(GOLD, 0.95))
    tt = "The Sapphire Reserve Companion"
    tsz = 22
    while c.stringWidth(tt, "Head", tsz) > split - x0 - 36 and tsz > 14:
        tsz -= 0.5
    text(x0 + 20, top - 50, tt, font="Head", size=tsz, col=white)
    text(x0 + 20, top - 72, "Don't let Chase keep your money. There's $2,190 in credits in here, and most",
         font="Body", size=9.5, col=alpha(white, 0.95))
    text(x0 + 20, top - 86, "cardholders leave hundreds of it on the table every single year.",
         font="Body", size=9.5, col=alpha(white, 0.95))
    # right (cream panel): logo + newsletter button
    rc = (split + (x0 + w)) / 2
    LOGO = os.path.join(HERE, "..", "..", "public", "crazy4points-logo.png")
    if os.path.exists(LOGO):
        lw = (x0 + w) - split - 40
        c.drawImage(LOGO, rc - lw / 2, top - 46, width=lw, height=34,
                    preserveAspectRatio=True, anchor='c', mask='auto')
    btn_w = (x0 + w) - split - 34; btn_h = 22
    btn_x = rc - btn_w / 2; btn_y = bot + 16
    c.setFillColor(GOLD); c.roundRect(btn_x, btn_y, btn_w, btn_h, 11, stroke=0, fill=1)
    _blab = "SIGN UP FOR THE INSIDER LIST"
    _bfs = 7.0
    while c.stringWidth(_blab, "UIB", _bfs) > btn_w - 26 and _bfs > 5.4:
        _bfs -= 0.2
    text(btn_x + btn_w / 2 - 7, btn_y + btn_h / 2 - 3, _blab,
         font="UIB", size=_bfs, col=DEEP, center=True)
    c.setStrokeColor(DEEP); c.setLineWidth(1.2); c.setLineCap(1)
    ax = btn_x + btn_w - 14
    c.line(ax - 6, btn_y + btn_h / 2, ax, btn_y + btn_h / 2)
    c.line(ax - 3, btn_y + btn_h / 2 + 3, ax, btn_y + btn_h / 2)
    c.line(ax - 3, btn_y + btn_h / 2 - 3, ax, btn_y + btn_h / 2)
    c.linkURL("https://www.crazy4points.com/newsletter",
              (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), relative=0)
    return bot - 16

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
# White cards: big purple figure on top, gold hairline, serif name below, a
# "mark done" checkbox bottom-right. 9 cards fill row 1 (5) + row 2 (4) with one
# empty slot. Every figure verified against Chase's published terms.
GRID = [
    dict(amt="$10",      sub="per month",           name="Peloton",           note="activation required",       icon=rc_peloton,  url="https://www.onepeloton.com/digital/promotions/chase"),
    dict(amt="$150",     sub="twice a year",         name="StubHub + viagogo", note="one activation covers both", icon=rc_ticket),
    dict(amt="$25",      sub="monthly promos",       name="DoorDash",          note="DashPass + set as payment",  icon=rc_bag),
    dict(amt="Platinum", sub="Elite status",         name="IHG One Rewards",   note="link accounts, 3 weeks",     icon=rc_crown,    url="https://www.ihg.com/rewardsclub/us/en/enrollment/join", field="act_ihg"),
    dict(amt="Elite",    sub="National, Avis, Hertz", name="Car Rental",       note="enroll for upgrades",        icon=rc_key),
    dict(amt="$10",      sub="per month",           name="Lyft",              note="add the card in the app",    icon=rc_phone),
    dict(amt="$120",     sub="application fee",       name="Global Entry",      note="pay the fee with the card",  icon=rc_passport, url="https://ttp.dhs.gov"),
    dict(amt="Free",     sub="through 6/22/2027",     name="Apple TV",          note="activate to start it",       icon=rc_tv),
    dict(amt="Free",     sub="through 6/22/2027",     name="Apple Music",       note="separate activation",        icon=rc_music),
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
    # Reset PDF character-spacing (Tc) to 0. reportlab leaves the last Tc in the
    # page content stream, so without this every following drawString /
    # drawRightString inherits this letterspacing — which the width calc ignores,
    # making right-aligned text over-run its anchor. Reset once here, globally.
    t0 = c.beginText(); t0.setCharSpace(0); c.drawText(t0)
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
        c.setFillColor(alpha(GOLD_L, 0.9)); c.setFont("UI", 8)
        c.drawRightString(x + w - 16, y_top - 18, sub)
    return y_top - h

def draw_setup_grid(y):
    """White cards, gold border. Big purple figure ($10 / Platinum / Free) with a
    small note under it, a gold hairline, then the serif item name and its note,
    and a 'mark done' checkbox bottom-right. The IHG card's checkbox shares the
    'act_ihg' field with the Perks page (page 3), so ticking one ticks both."""
    x = MARGIN
    cols, gap = 5, 8
    tw = (CW - gap * (cols - 1)) / cols
    th = 100
    pad = 11
    rows = (len(GRID) + cols - 1) // cols
    body_h = 12 + rows * th + (rows - 1) * gap
    bar_y = lux_bar(x, y, CW, "Activate / Link - Start Here", sub="4 to activate  ·  4 to link  ·  1 to apply for")
    top = bar_y - 10
    for i, item in enumerate(GRID):
        cx0 = x + (i % cols) * (tw + gap)
        cy0 = top - (i // cols) * (th + gap)
        lx = cx0 + pad
        # white card with a gold hairline border + a whisper of shadow
        rrect_shadow(cx0, cy0 - th, tw, th, 8, alpha(INK, 0.07))
        c.setFillColor(white)
        c.setStrokeColor(alpha(GOLD, 0.85)); c.setLineWidth(0.9)
        c.roundRect(cx0, cy0 - th, tw, th, 8, stroke=1, fill=1)
        # gold line icon, top-right
        item["icon"](cx0 + tw - 18, cy0 - 16, alpha(PURPLE, 0.62))
        # big purple figure (auto-shrink words like "Platinum" to fit)
        asz = 23
        while c.stringWidth(item["amt"], "Head", asz) > tw - pad * 2 and asz > 12:
            asz -= 0.4
        text(lx, cy0 - 42, item["amt"], font="Head", size=asz, col=PURPLE)
        # small note under the figure
        text(lx, cy0 - 53, item["sub"], font="Body", size=7.3, col=MUT)
        # GO pill on the note row, right side (only where the link does something)
        if item.get("url"):
            gw = c.stringWidth("GO", "UIB", 6.6) + 15
            go_pill(cx0 + tw - pad - gw, cy0 - 53, item["url"], GOLD)
        # gold hairline
        c.setStrokeColor(alpha(GOLD, 0.6)); c.setLineWidth(0.7)
        c.line(lx, cy0 - 60, cx0 + tw - pad, cy0 - 60)
        # serif name (auto-shrink to one line)
        nsz = 11
        while c.stringWidth(item["name"], "HeadSm", nsz) > tw - pad * 2 and nsz > 7.5:
            nsz -= 0.2
        text(lx, cy0 - 75, item["name"], font="HeadSm", size=nsz, col=INK)
        # note under the name
        ntsz = 7
        while c.stringWidth(item["note"], "Body", ntsz) > tw - pad * 2 and ntsz > 5.4:
            ntsz -= 0.15
        text(lx, cy0 - 85, item["note"], font="Body", size=ntsz, col=MUT)
        # 'mark done' + checkbox, bottom-right
        cb = 10
        cbx = cx0 + tw - pad - cb
        cby = cy0 - th + 6
        fld = item.get("field") or f"card{i}"
        checkbox(cbx, cby, cb, fld, PURPLE)
        text(cbx - 4, cby + 1.5, "mark done", font="Body", size=6.8,
             col=alpha(PURPLE, 0.62), right=True)
        # paired "DONE" stamp (top-left): blank until ticked, then green DONE
        PILL_WIDGETS.append((1, fld, (cx0 + 8, cy0 - 16, cx0 + 42, cy0 - 4), "", "DONE"))
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
    bar_y = section_bar(x, y, CW, "ACTIVATE / LINK  -  START HERE", key, icon=ic_bolt, sub="4 to activate  ·  4 to link  ·  1 to apply for")
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
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
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
    ("Lyft ride credit", "$10/mo  -  in-app  -  through 9/30/2027", 10),
    ("DoorDash restaurant", "$5/mo  -  promo", 5),
    ("DoorDash grocery/retail #1", "$10/mo  -  promo", 10),
    ("DoorDash grocery/retail #2", "$10/mo  -  promo", 10),
    ("Peloton membership", "$10/mo  -  statement credit  -  through 12/31/2027", 10),
]
def draw_monthly(y):
    key = "monthly"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 25
    grid_x = x + CW - 12 * 20 - 12
    body_h = 22 + len(MONTHLY) * rowh + 12
    bar_y = section_bar(x, y, CW, "EVERY MONTH", key, icon=ic_cal, sub="$540 a year if you catch them all")
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    # month letters header
    for m in range(12):
        text(grid_x + m * 20 + 10, bar_y - 16, MONTHS[m], font="UI", size=7.5, col=col, center=True)
    cy = bar_y - 37
    for i, (label, sub, worth) in enumerate(MONTHLY):
        if i % 2 == 1:  # zebra band (v53)
            c.setFillColor(alpha(GOLD, 0.07))
            c.roundRect(x + 6, cy - 16, CW - 12, 24, 3, stroke=0, fill=1)
        text(x + 16, cy, label, font="Body", size=10, col=INK)
        text(x + 16, cy - 13, sub, font="Body", size=8, col=MUT)
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
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
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
    c.setFillColor(DEEP); c.rect(0, y - 34, PAGE_W, 34, stroke=0, fill=1)
    text(MARGIN, y - 23, "Sapphire Reserve Companion", font="Head", size=13, col=white)
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
    bar_y = section_bar(x, y, CW, "DINING  -  SAPPHIRE EXCLUSIVE TABLES", key, icon=ic_fork)
    # BOOK pill (OpenTable Exclusive Tables) at the far right, sub to its left
    pw = c.stringWidth("BOOK", "UIB", 7.5) + 26
    pbx = x + CW - 14 - pw
    c.setStrokeColor(white); c.setLineWidth(1)
    c.roundRect(pbx, bar_y + 5, pw, 13, 6.5, stroke=1, fill=0)
    text(pbx + 8, bar_y + 8.5, "BOOK", font="UIB", size=7.5, col=white)
    c.setStrokeColor(white); c.setLineWidth(1); c.setLineCap(1)
    ax = pbx + pw - 8
    c.line(ax - 4, bar_y + 11.5, ax, bar_y + 11.5)
    c.line(ax - 2, bar_y + 13.3, ax, bar_y + 11.5); c.line(ax - 2, bar_y + 9.7, ax, bar_y + 11.5)
    c.linkURL("https://www.opentable.com/sapphire-reserve-exclusive-tables",
              (pbx, bar_y + 5, pbx + pw, bar_y + 18), relative=0)
    text(pbx - 10, bar_y + 8, "$300 a year, $150 in each half", font="UI", size=8.5,
         col=alpha(white, 0.92), right=True)
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    # column x's
    c_num = x + 14; c_go = x + 26; c_rest = x + 48; c_date = x + 246; c_amt = x + 318
    c_rate = x + 374; c_note = x + 440
    def cols():
        ly = cy0
        text(c_rest, ly, "RESTAURANT NAME", font="UI", size=6.8, col=GOLD_D)
        text(c_date, ly, "DATE", font="UI", size=6.8, col=GOLD_D)
        text(c_amt, ly, "$ USED", font="UI", size=6.8, col=GOLD_D)
        text(c_rate, ly, "WORTH IT?", font="UI", size=6.8, col=GOLD_D)
        text(c_note, ly, "NOTES", font="UI", size=6.8, col=GOLD_D)
    def rows():
        cy = cy0 - 19
        for r in range(rows_per_half):
            text(c_num, cy, str(r + 1), font="UIB", size=8.5, col=col)
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
    """The Edit does NOT reset each half (unlike Dining/Tickets), so it is one
    annual $500 tracked as two prepaid STAY boxes side by side, each with the
    per-stay perks (breakfast, upgrade, early/late check-in) as checkboxes."""
    x = MARGIN
    blue = SEC["edit"][0]
    body_h = 178
    bar_y = section_bar(x, y, CW, "THE EDIT  -  HOTEL CREDIT", "edit", icon=ic_card,
                        sub="$250 per prepaid booking, up to $500 a year")
    card(x, bar_y, CW, body_h, white, alpha(GOLD, 0.85))
    top = bar_y - 10
    # ---- BOOK PREPAID sub-bar ----
    sbh = 22
    c.setFillColor(SEC["edit"][1]); c.roundRect(x + 8, top - sbh, CW - 16, sbh, 5, stroke=0, fill=1)
    c.setFillColor(blue); c.roundRect(x + 8, top - sbh, 4, sbh, 2, stroke=0, fill=1)
    text_ls(x + 20, top - 15, "BOOK PREPAID THROUGH CHASE TRAVEL  -  2 NIGHTS MINIMUM",
            "UIB", 8, blue, spacing=1.0)
    text(x + CW - 132, top - 15, "used  $", font="Body", size=8.5, col=blue)
    textfield(x + CW - 96, top - 18, 46, 14, fid("eused"), fontsize=9, style="inset", line=alpha(blue, 0.5))
    text(x + CW - 44, top - 15, "/ $500", font="UIB", size=9, col=blue)
    # ---- two STAY boxes ----
    top2 = top - sbh - 10
    boxh = 122
    bw = (CW - 16 - 12) / 2
    for si in range(2):
        sx = (x + 8) if si == 0 else (x + 8 + bw + 12)
        c.setFillColor(HexColor("#FBFBFE")); c.setStrokeColor(alpha(blue, 0.4)); c.setLineWidth(0.9)
        c.roundRect(sx, top2 - boxh, bw, boxh, 6, stroke=1, fill=1)
        bx = sx + 12
        # header: STAY N + used $
        text_ls(bx, top2 - 16, f"STAY {si + 1}", "UIB", 8.5, blue, spacing=1.3)
        text(sx + bw - 96, top2 - 16, "used  $", font="Body", size=8, col=blue)
        textfield(sx + bw - 64, top2 - 19, 50, 13, fid("su"), fontsize=8.5, style="inset", line=alpha(blue, 0.5))
        # left column: hotel name + dates/nights
        colr = sx + bw * 0.56
        textfield(bx, top2 - 42, colr - bx - 6, 14, fid("shotel"))
        text(bx, top2 - 52, "HOTEL NAME", font="UI", size=6.4, col=GOLD_D)
        dw = (colr - bx - 6 - 6) / 2
        textfield(bx, top2 - 74, dw, 14, fid("sdate"))
        textfield(bx + dw + 6, top2 - 74, dw, 14, fid("snight"))
        text(bx, top2 - 84, "DATES", font="UI", size=6.4, col=GOLD_D)
        text(bx + dw + 6, top2 - 84, "NIGHTS", font="UI", size=6.4, col=GOLD_D)
        # right column: 5 perk checkboxes
        cbx = colr + 6
        perks = ["$100 credit", "breakfast", "room upgrade", "early check-in", "late check-out"]
        pcy = top2 - 36
        for pk in perks:
            checkbox(cbx, pcy - 8, 10, fid("ep"), blue)
            text(cbx + 15, pcy - 6, pk, font="Body", size=7.6, col=INK)
            pcy -= 16
    # ---- footer note ----
    text(x + 20, top2 - boxh - 12,
         "Wi-Fi is included on every Edit stay. The upgrade and early/late times are \"if available\" - ask at check-in.",
         font="Body", size=7.3, col=MUT)
    return bar_y - body_h - 8

# ---- TICKETS TRACKER (StubHub & viagogo) --------------------------------
def draw_tickets(y, rows_per_half=3):
    key = "perks"; col, tint, line = SEC[key]  # green, matching v53
    x = MARGIN
    hh = 15; lbl = 16; rowh = 22; gap = 8; pad = 8
    half_h = hh + lbl + rows_per_half * rowh
    body_h = pad + half_h + gap + half_h + 6
    bar_y = section_bar(x, y, CW, "TICKETS  -  STUBHUB & VIAGOGO", key, icon=ic_ticket, sub="$300 a year, $150 in each half")
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    c_go = x + 16; c_evt = x + 40; c_where = x + 220; c_date = x + 320
    c_amt = x + 390; c_note = x + 448
    def cols():
        ly = cy0
        text(c_evt, ly, "EVENT / SHOW", font="UI", size=6.8, col=GOLD_D)
        text(c_where, ly, "WHERE", font="UI", size=6.8, col=GOLD_D)
        text(c_date, ly, "DATE", font="UI", size=6.8, col=GOLD_D)
        text(c_amt, ly, "$ USED", font="UI", size=6.8, col=GOLD_D)
        text(c_note, ly, "NOTES", font="UI", size=6.8, col=GOLD_D)
    def rows():
        cy = cy0 - 19
        for r in range(rows_per_half):
            checkbox(c_go, cy - 2, 12, fid("tgo"), col)
            textfield(c_evt, cy - 3, c_where - c_evt - 8, 13, fid("tevt"))
            # WHERE: two named checkboxes (full words, matching v53)
            checkbox(c_where, cy - 2, 11, fid("tsh"), col)
            text(c_where + 14, cy, "StubHub", font="Body", size=7.5, col=INK)
            checkbox(c_where + 49, cy - 2, 11, fid("tvg"), col)
            text(c_where + 63, cy, "viagogo", font="Body", size=7.5, col=INK)
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
# (title, gold sub-line, muted note) — five milestones you unlock at $75k spend.
SPEND = [
    ("World of Hyatt",    "Explorist status",   "link your World of Hyatt account"),
    ("IHG One Rewards",   "Diamond Elite",      "auto if IHG already linked"),
    ("The Shops at Chase", "$250 credit",        "applied automatically"),
    ("Southwest",         "$500 travel credit", "prepaid Southwest via Chase Travel"),
    ("Southwest",         "A-List status",      "link account, allow 10-15 days"),
]
def draw_spend(y):
    """Dark purple panel: a spend-so-far field, a 10-block progress bar, five
    numbered milestone cards, and two write-in rows for the Shops/Southwest
    credits. Mirrors the premium 'lux' styling of the Set-It-Up bar."""
    x = MARGIN
    cream = SEC["spend"][1]
    body_h = 238
    bar_y = lux_bar(x, y, CW, "The $75K Spend Club",
                    sub="counts Jan 1 - Dec 31, not your anniversary year")
    top = bar_y
    # dark panel + gold hairline
    rrect_shadow(x, top - body_h, CW, body_h, 8, alpha(INK, 0.22))
    c.setFillColor(DEEP); c.roundRect(x, top - body_h, CW, body_h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.7)); c.setLineWidth(1)
    c.roundRect(x + 1, top - body_h + 1, CW - 2, body_h - 2, 8, stroke=1, fill=0)
    inx = x + 18
    # ---- spend so far row ----
    yy = top - 28
    lw = text_ls(inx, yy, "MY SPEND SO FAR   $", "UIB", 8.5, GOLD_L, spacing=1.3)
    fx = inx + lw + 8
    c.setFillColor(cream); c.roundRect(fx, yy - 4, 108, 15, 3, stroke=0, fill=1)
    textfield(fx, yy - 4, 108, 15, fid("spd"), fontsize=9.5, style="inset", line=SEC["spend"][2])
    ox = fx + 116
    text(ox, yy, "of ", font="Body", size=9.5, col=alpha(white, 0.85))
    text(ox + c.stringWidth("of ", "Body", 9.5), yy, "$75,000", font="UIB", size=11, col=GOLD_L)
    text(x + CW - 18, yy, "10 blocks  -  $7,500 each", font="UI", size=8,
         col=alpha(GOLD_L, 0.75), right=True)
    # ---- 10-block progress bar — each block is a clickable checkbox ----
    pby = yy - 22
    pbx = inx; pbw = CW - 36
    c.setStrokeColor(alpha(GOLD, 0.55)); c.setLineWidth(1)
    c.roundRect(pbx, pby - 14, pbw, 18, 5, stroke=1, fill=0)
    seg = pbw / 10
    for t in range(1, 10):
        c.line(pbx + seg * t, pby - 14, pbx + seg * t, pby + 4)
    for m in range(10):
        c.acroForm.checkbox(name=fid("sq"), x=pbx + seg * m + seg / 2 - 6.5, y=pby - 11,
                            size=13, buttonStyle="check", borderColor=None,
                            fillColor=None, textColor=GOLD_L, borderWidth=0, checked=False)
    text(inx, pby - 26, "each block = $7,500  -  tick one every time you clear another $7,500",
         font="Body", size=7.5, col=alpha(white, 0.55))
    text(x + CW - 18, pby - 26, "reach $75K and you keep every unlock through the end of next year",
         font="BodyB", size=7.5, col=alpha(GOLD_L, 0.9), right=True)
    # ---- five milestone cards ----
    cy = pby - 40
    cols = 5; g = 8
    cw = (CW - 36 - g * (cols - 1)) / cols
    ch = 96
    for i, (title, sub, note) in enumerate(SPEND):
        mx = inx + i * (cw + g)
        c.setFillColor(alpha(white, 0.06)); c.roundRect(mx, cy - ch, cw, ch, 6, stroke=0, fill=1)
        c.setStrokeColor(alpha(GOLD, 0.5)); c.setLineWidth(0.8)
        c.roundRect(mx, cy - ch, cw, ch, 6, stroke=1, fill=0)
        midx = mx + cw / 2
        # number circle
        c.setFillColor(GOLD); c.circle(midx, cy - 16, 9, stroke=0, fill=1)
        text(midx, cy - 19.5, str(i + 1), font="UIB", size=10, col=PURPLE_D, center=True)
        tsz = 9
        while c.stringWidth(title, "UIB", tsz) > cw - 10 and tsz > 6.5:
            tsz -= 0.2
        text(midx, cy - 42, title, font="UIB", size=tsz, col=white, center=True)
        ssz = 8.5
        while c.stringWidth(sub, "BodyB", ssz) > cw - 8 and ssz > 6:
            ssz -= 0.2
        text(midx, cy - 54, sub, font="BodyB", size=ssz, col=GOLD_L, center=True)
        nsz = 6.4
        while c.stringWidth(note, "Body", nsz) > cw - 6 and nsz > 4.4:
            nsz -= 0.15
        text(midx, cy - 66, note, font="Body", size=nsz, col=alpha(white, 0.5), center=True)
        mfld = f"ms{i}"
        checkbox(midx - 5.5, cy - ch + 8, 11, mfld, GOLD)
        # paired "DONE" stamp (top-right of the milestone card)
        PILL_WIDGETS.append((3, mfld, (mx + cw - 40, cy - 13, mx + cw - 8, cy - 3), "", "DONE"))
    # ---- two write-in rows ----
    by = cy - ch - 16
    for lbl, act in (("$250 Shops at Chase", "what I bought"),
                     ("$500 Southwest", "what I booked")):
        text(inx, by, lbl, font="BodyB", size=9, col=GOLD_L)
        text(inx + 128, by, act, font="Body", size=8, col=alpha(white, 0.55))
        fx2 = inx + 208
        fw2 = x + CW - 18 - fx2
        c.setFillColor(cream); c.roundRect(fx2, by - 4, fw2, 15, 3, stroke=0, fill=1)
        textfield(fx2, by - 4, fw2, 15, fid("sc"), fontsize=9, style="inset", line=SEC["spend"][2])
        by -= 22
    return top - body_h - 12

# ---- PERKS & STATUS ------------------------------------------------------
# (label, activate_field) — activate_field ties the leading checkbox to the
# matching "Set It Up First" task so it auto-checks; None = truly automatic.
PERKS = [
    ("Chase Sapphire Lounges (+2 guests)", None),
    # Chase: membership is "automatically activated" — no enrollment needed.
    ("Priority Pass Select", None),
    ("Air Canada Maple Leaf Lounges & Cafes", None),
    ("Points Boost - up to 2x via Chase Travel", None),
    ("1:1 transfer to airline & hotel partners", None),
    ("No foreign transaction fees", None),
    ("Exclusive access to card member experiences", None),
    ("Reserve Travel Designers - service worth up to $300", None),
]
def draw_perks(y):
    key = "perks"; col, tint, line = SEC[key]
    x = MARGIN; rowh = 18
    n = len(PERKS); percol = (n + 1) // 2
    body_h = 20 + percol * rowh
    bar_y = section_bar(x, y, CW, "PERKS YOU GET AUTOMATICALLY", key, icon=ic_crown, sub="nothing to tick, nothing to switch on")
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    colw = CW / 2
    cy = bar_y - 22
    for i, (label, act) in enumerate(PERKS):
        cxx = x + 16 + (colw if i >= percol else 0)
        yy = cy - (i - percol if i >= percol else i) * rowh
        # gold bullet, not a checkbox — these are automatic, nothing to tick
        c.setFillColor(GOLD); c.circle(cxx + 3, yy + 3, 2.3, stroke=0, fill=1)
        text(cxx + 14, yy, label, font="Body", size=9.3, col=INK)
    return bar_y - body_h - 12

# ---- EARNING CHEAT SHEET -------------------------------------------------
# "8x Travel" was misleading: 8x applies only through Chase Travel (incl. The
# Edit). Booking flights/hotels DIRECT earns 4x, so the old label could cost a
# reader points. "direct" is spelled out on the 4x pills for the same reason.
EARN = [("8x","Chase Travel"),("5x","Lyft"),("4x","flights direct"),
        ("4x","hotels direct"),("3x","dining"),("10x","Peloton"),("1x","all else")]
def draw_earn(y):
    """v53 dark bar: HOW YOU EARN header, gold hairline, then 7 columns each with
    a big gold multiplier over a white category label, thin dividers between."""
    x = MARGIN
    body_h = 60
    rrect_shadow(x, y - body_h, CW, body_h, 10, alpha(PURPLE, 0.3))
    c.setFillColor(DEEP); c.roundRect(x, y - body_h, CW, body_h, 10, stroke=0, fill=1)
    text_ls(x + 16, y - 18, "HOW YOU EARN", "UIB", 10.5, white, spacing=1.4)
    text(x + CW - 16, y - 17, "10x Peloton is on purchases over $150 (up to $5,000)",
         font="Body", size=8, col=alpha(white, 0.85), right=True)
    c.setStrokeColor(alpha(GOLD, 0.5)); c.setLineWidth(0.7)
    c.line(x + 14, y - 26, x + CW - 14, y - 26)
    n = len(EARN)
    colw = (CW - 20) / n
    for i, (mult, cat) in enumerate(EARN):
        cxc = x + 10 + colw * i + colw / 2
        text(cxc, y - 44, mult, font="Head", size=17, col=GOLD_L, center=True)
        text(cxc, y - 54, cat, font="Body", size=7.4, col=white, center=True)
        if i > 0:
            c.setStrokeColor(alpha(white, 0.18)); c.setLineWidth(0.6)
            c.line(x + 10 + colw * i, y - 32, x + 10 + colw * i, y - 56)
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
    body_h = 14 + percol * rowh + 28
    bar_y = section_bar(x, y, CW, "KNOW YOU'RE COVERED", key, icon=ic_shield, sub="travel and purchase protection, included")
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    colw = CW / 3
    cy = bar_y - 17
    for i, label in enumerate(PROTECT):
        cxx = x + 14 + (i // percol) * colw
        yy = cy - (i % percol) * rowh
        checkbox(cxx, yy - 2, 10, fid("pr"), col)
        text(cxx + 16, yy, label, font="Body", size=8.3, col=INK)
    # general disclaimer + a specific New York carve-out (NY-heavy audience)
    text(x + 14, bar_y - body_h + 17,
         "These are Chase's published limits. Deductibles, time limits and eligibility rules apply - check your Guide to Benefits before you rely on them.",
         font="Body", size=7.2, col=MUT)
    text(x + 14, bar_y - body_h + 6,
         "New York residents: lost luggage capped at $2,000/bag  -  purchase-protection claims within 90 days  -  rental-car coverage is secondary if you carry auto insurance.",
         font="BodyB", size=7.2, col=GOLD_D)
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
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    c.acroForm.textfield(name=fid("notes"), x=x + 14, y=bar_y - body_h + 10, width=CW - 28,
        height=body_h - 20, fontName="Helvetica", fontSize=10, borderColor=line, fillColor=white,
        borderWidth=0.8, borderStyle="solid", forceBorder=True, fieldFlags="multiline")
    return bar_y - body_h - 10

# ---- KEY DATES -----------------------------------------------------------
# Missing a reset is the single most common way people lose money on this card,
# so every deadline lives in one strip. All dates verified vs Chase's terms.
RESETS = [
    ("1st of the month", "Lyft $10  -  DoorDash $25  -  Peloton $10"),
    ("Jan 1 & Jul 1", "Dining $150  -  Tickets $150"),
    ("Your anniversary", "$300 travel credit resets"),
    ("Jan 1", "$75K spend counter resets"),
]
ENDS = [
    ("Sep 30, 2026", "Register Marriott Gold (if invited)"),
    ("Dec 31, 2026", "$250 Chase Travel hotel credit"),
    ("Jun 22, 2027", "Apple TV+ & Apple Music"),
    ("Sep 30, 2027", "Lyft 5x points + $10/mo credit"),
    ("Dec 31, 2027", "StubHub, Peloton, DashPass, IHG"),
    ("Every 4 yrs", "Global Entry / TSA / NEXUS"),
]
def draw_dates(y):
    key = "annual"; col, tint, line = SEC[key]
    x = MARGIN
    rows = max(len(RESETS), len(ENDS))
    body_h = 28 + rows * 15 + 14
    bar_y = section_bar(x, y, CW, "KEY DATES", key, icon=ic_cal, sub="what resets, and what runs out")
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    leftw = CW * 0.56
    text(x + 14, bar_y - 14, "RESETS - USE IT OR LOSE IT", font="UI", size=7.2, col=col)
    text(x + 14 + leftw, bar_y - 14, "RUNS OUT ON", font="UI", size=7.2, col=col)
    for i, (when, what) in enumerate(RESETS):
        yy = bar_y - 30 - i * 15
        text(x + 14, yy, when, font="UI", size=8.6, col=INK)
        text(x + 14 + 88, yy, what, font="Body", size=8.2, col=MUT)
    for i, (when, what) in enumerate(ENDS):
        yy = bar_y - 30 - i * 15
        text(x + 14 + leftw, yy, when, font="UI", size=8.6, col=INK)
        text(x + 14 + leftw + 74, yy, what, font="Body", size=8.2, col=MUT)
    text(x + 14, bar_y - body_h + 9,
         "The Edit is not in the half-year list because it has no half-year deadline - $250 per prepaid booking, "
         "up to $500 a year, any time.",
         font="Body", size=7.4, col=MUT)
    return bar_y - body_h - 10

# ---- NEWSLETTER CTA ------------------------------------------------------
NEWSLETTER_URL = "https://www.crazy4points.com/newsletter"
CARDFINDER_URL = "https://www.crazy4points.com/cards"
INSTAGRAM_URL = "https://www.instagram.com/crazy4points/"
FACEBOOK_URL = "https://www.facebook.com/Crazy4Points"

def qr_png(url, path):
    """Render a QR to PNG. Matters because this sheet gets PRINTED."""
    import qrcode
    qrcode.make(url, border=1).save(path)
    return path

def draw_cta(y):
    """Closing ask: subscribe. Two QR codes get their own bordered cards with a
    real gap between them - a phone camera can't reliably tell two adjacent
    codes apart, so they need separation."""
    x = MARGIN; body_h = 150
    rrect_shadow(x, y - body_h, CW, body_h, 12, alpha(PURPLE, 0.3))
    c.setFillColor(DEEP); c.roundRect(x, y - body_h, CW, body_h, 12, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.5)); c.setLineWidth(1)
    c.roundRect(x + 5, y - body_h + 5, CW - 10, body_h - 10, 9, stroke=1, fill=0)
    star(x + 32, y - 34, 9, GOLD_L)
    text(x + 52, y - 30, "Don't leave money on the table", font="Head", size=17, col=white)
    text(x + 52, y - 52, "There's over $2,000 in credits here. Most people never claim it all.",
         font="Body", size=9.5, col=alpha(white, 0.92))
    text(x + 52, y - 66, "The Insider List helps you catch every one.",
         font="Body", size=9.5, col=alpha(white, 0.85))
    # gold button
    btnw = 250; btnh = 26; bx = x + 52; byb = y - 104
    c.setFillColor(GOLD); c.roundRect(bx, byb, btnw, btnh, 13, stroke=0, fill=1)
    text(bx + 18, byb + btnh / 2 - 4, "crazy4points.com/newsletter", font="UIB", size=11, col=PURPLE_D)
    c.setStrokeColor(PURPLE_D); c.setLineWidth(1.4); c.setLineCap(1)
    ax = bx + btnw - 18
    c.line(ax - 7, byb + btnh / 2, ax, byb + btnh / 2)
    c.line(ax - 3.5, byb + btnh / 2 + 3.5, ax, byb + btnh / 2)
    c.line(ax - 3.5, byb + btnh / 2 - 3.5, ax, byb + btnh / 2)
    c.linkURL(NEWSLETTER_URL, (bx, byb, bx + btnw, byb + btnh), relative=0, thickness=0)
    # social follow line, under the button
    sy = byb - 16
    def _seg(px, ss, link=None, bold=False):
        text(px, sy, ss, font=("BodyB" if bold else "Body"), size=8.5,
             col=(GOLD_L if bold else alpha(white, 0.8)))
        w = c.stringWidth(ss, ("BodyB" if bold else "Body"), 8.5)
        if link:
            c.linkURL(link, (px, sy - 2, px + w, sy + 9), relative=0, thickness=0)
        return px + w
    px = _seg(x + 52, "Follow ")
    px = _seg(px, "@crazy4points", bold=True)
    px = _seg(px, " on ")
    px = _seg(px, "Instagram", link=INSTAGRAM_URL, bold=True)
    px = _seg(px, " & ")
    px = _seg(px, "Facebook", link=FACEBOOK_URL, bold=True)
    # ---- two well-separated QR cards on the right ----
    qs = 54; pad = 7; cw2 = qs + pad * 2
    gap = 34
    c2l = x + CW - 18 - cw2
    c1l = c2l - gap - cw2
    ctop = y - 24
    for i, (cl, url, cap) in enumerate([(c1l, NEWSLETTER_URL, "The Insider List"),
                                        (c2l, CARDFINDER_URL, "Free Card Finder")]):
        c.setFillColor(white); c.roundRect(cl, ctop - cw2, cw2, cw2, 8, stroke=0, fill=1)
        c.setStrokeColor(alpha(GOLD, 0.85)); c.setLineWidth(1)
        c.roundRect(cl, ctop - cw2, cw2, cw2, 8, stroke=1, fill=0)
        png = qr_png(url, os.path.join(HERE, "_qr%d.png" % i))
        c.drawImage(png, cl + pad, ctop - cw2 + pad, width=qs, height=qs, mask='auto')
        text(cl + cw2 / 2, ctop - cw2 - 12, cap, font="UIB", size=8, col=GOLD_L, center=True)
        c.linkURL(url, (cl, ctop - cw2, cl + cw2, ctop), relative=0, thickness=0)
    text((c1l + c2l + cw2) / 2, ctop - cw2 - 24, "scan if you printed this",
         font="Body", size=7, col=alpha(white, 0.55), center=True)
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
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
    text(x + 16, bar_y - 15,
         "Sapphire Lounges include two guests. Priority Pass: extra guests $27 each per visit. Air Canada: one guest free, then $59.",
         font="Body", size=8.2, col=MUT)
    nb = 13
    gx = x + CW - nb * 16 - 14
    cy = bar_y - 40
    for label, sub, url in LOUNGES:
        text(x + 16, cy, label, font="Body", size=9.8, col=INK)
        text(x + 16, cy - 10, sub, font="Body", size=8.2, col=MUT)
        # These links DO earn their place: they show you where the lounges are.
        lx = go_pill(x + 16 + c.stringWidth(label, "Body", 9.8) + 8, cy, url, col) + 8
        c.setStrokeColor(alpha(col, 0.5)); c.setLineWidth(0.8); c.setDash(1, 3)
        c.line(lx, cy + 3, gx - 6, cy + 3); c.setDash()
        for m in range(nb):
            checkbox(gx + m * 16 + 3, cy - 4, 11, fid("lv"), col)
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
    """Scorecard: six credit fields (each with its Chase target) + MY TOTAL of
    $2,190, then a second row where the reader assigns their OWN value to the
    non-credit perks (lounges, Apple, status) and nets it against the $795 fee.
    We never print a dollar value on a lounge — the reader decides."""
    x = MARGIN
    body_h = 104
    top = y
    rrect_shadow(x, top - body_h, CW, body_h, 8, alpha(INK, 0.06))
    c.setFillColor(HexColor("#FBF6E4"))
    c.roundRect(x, top - body_h, CW, body_h, 8, stroke=0, fill=1)
    c.setStrokeColor(alpha(GOLD, 0.85)); c.setLineWidth(1)
    c.roundRect(x + 1, top - body_h + 1, CW - 2, body_h - 2, 8, stroke=1, fill=0)
    inx = x + 16
    text_ls(inx, top - 20, "WHAT I'VE CLAIMED SO FAR", "UIB", 9, GOLD_D, spacing=1.6)
    text(x + CW - 16, top - 20, "write in what you have actually used",
         font="Body", size=8, col=MUT, right=True)
    cats = [("MONTHLY", 540), ("THE EDIT", 500), ("DINING", 300),
            ("TICKETS", 300), ("TRAVEL", 300), ("HOTELS", 250)]
    cell = 57
    fy = top - 56
    for i, (lbl, amt) in enumerate(cats):
        cx = inx + i * cell
        text_ls(cx, top - 38, lbl, "UIB", 6.4, GOLD_D, spacing=0.8)
        c.setFillColor(white); c.roundRect(cx, fy, 34, 16, 2, stroke=0, fill=1)
        textfield(cx, fy, 34, 16, fid("cl"), fontsize=9, style="inset", line=SEC["spend"][2])
        text(cx + 38, fy + 4, f"/{amt}", font="UI", size=8, col=MUT)
    dvx = inx + 6 * cell + 4
    c.setStrokeColor(alpha(GOLD, 0.5)); c.setLineWidth(0.8)
    c.line(dvx, top - 30, dvx, top - 96)
    tx = dvx + 14
    text_ls(tx, top - 38, "MY TOTAL", "UIB", 6.4, GOLD_D, spacing=0.8)
    tfw = x + CW - 16 - tx - 74
    c.setFillColor(white); c.roundRect(tx, fy, tfw, 16, 2, stroke=0, fill=1)
    textfield(tx, fy, tfw, 16, fid("tot"), fontsize=10, style="inset", line=SEC["spend"][2])
    text(tx + tfw + 8, fy + 6, "of $2,190", font="UIB", size=11, col=GOLD_D)
    text(tx + tfw + 8, fy - 5, "fee $795", font="Body", size=8, col=MUT)
    # ---- row 2: reader-assigned extras + net vs the fee ----
    c.setStrokeColor(alpha(GOLD, 0.4)); c.setLineWidth(0.7)
    c.line(inx, top - 66, x + CW - 16, top - 66)
    fy2 = top - 94
    text_ls(inx, top - 76, "LOUNGES + EXTRAS WORTH TO ME", "UIB", 6.4, GOLD_D, spacing=0.8)
    c.setFillColor(white); c.roundRect(inx, fy2, 56, 16, 2, stroke=0, fill=1)
    textfield(inx, fy2, 56, 16, fid("lx"), fontsize=9, style="inset", line=SEC["spend"][2])
    text(inx + 62, fy2 + 4, "(what the lounges + perks are worth to you)", font="Body", size=7, col=MUT)
    text_ls(tx, top - 76, "AHEAD BY", "UIB", 6.4, GOLD_D, spacing=0.8)
    c.setFillColor(white); c.roundRect(tx, fy2, tfw, 16, 2, stroke=0, fill=1)
    textfield(tx, fy2, tfw, 16, fid("net"), fontsize=10, style="inset", line=SEC["spend"][2])
    text(tx + tfw + 8, fy2 + 4, "after the $795 fee", font="Body", size=8, col=MUT)
    return top - body_h - 12

# ---- $300 TRAVEL CREDIT TRACKER -----------------------------------------
# This credit does NOT get spent in one go. Chase applies it automatically to
# travel purchases until it runs out, so in practice it disappears in small
# bites — parking, transit, tolls, a taxi. A single "used $___" box can't show
# that, so it gets line items and an auto "how much is left" readout.
TC_USED, TC_LEFT = "tc_used", "tc_left"
TRAVEL_CREDIT = 300
def draw_travel_credit(y):
    """v53 TRAVEL CREDITS ($550): the $300 annual travel credit (6 line items)
    plus the $250 Chase Travel hotels credit (2 line items). Cream panel, gold
    border, crimson accents; every "used $" box is a manual write-in so it works
    outside Acrobat too."""
    x = MARGIN
    pink = SEC["dining"][0]
    cream = SEC["spend"][1]
    body_h = 288
    bar_y = section_bar(x, y, CW, "TRAVEL CREDITS", "dining", icon=ic_cal,
                        sub="$550 a year, logged as you spend it")
    card(x, bar_y, CW, body_h, white, alpha(GOLD, 0.85))

    def subbar(top, title, goal, renewal=False):
        sbh = 18
        c.setFillColor(cream); c.roundRect(x + 8, top - sbh, CW - 16, sbh, 4, stroke=0, fill=1)
        c.setFillColor(pink); c.roundRect(x + 8, top - sbh, 4, sbh, 2, stroke=0, fill=1)
        text_ls(x + 20, top - 12.5, title, "UIB", 7.5, pink, spacing=0.9)
        rx = x + CW - 14
        text(rx, top - 12.5, f"/ ${goal}", font="UIB", size=8.5, col=pink, right=True)
        gx = rx - c.stringWidth(f"/ ${goal}", "UIB", 8.5) - 6
        textfield(gx - 46, top - 15, 44, 12, fid("tcu"), fontsize=8, style="inset", line=alpha(pink, 0.5))
        text(gx - 52, top - 12.5, "used  $", font="Body", size=8, col=pink, right=True)
        if renewal:
            text(x + 232, top - 12.5, "my renewal date", font="Body", size=8, col=MUT)
            textfield(x + 312, top - 15, 62, 12, fid("trn"), fontsize=8, style="inset", line=alpha(pink, 0.4))
        return top - sbh

    def tbl(top, headers, xs, nrows, prefix):
        for (lbl, hx) in zip(headers, xs):
            text(hx, top, lbl, font="UI", size=6.6, col=GOLD_D)
        cy = top - 15
        c_ck = x + 16
        for r in range(nrows):
            if r % 2 == 1:  # zebra band (v53)
                c.setFillColor(alpha(GOLD, 0.06))
                c.roundRect(x + 10, cy - 6, CW - 20, 15, 2, stroke=0, fill=1)
            checkbox(c_ck, cy - 3, 11, fid(prefix + "k"), pink)
            for j, hx in enumerate(xs):
                w = (xs[j + 1] - hx - 10) if j + 1 < len(xs) else (x + CW - 14 - hx)
                textfield(hx, cy - 3, w, 13, fid(prefix + str(j)))
            cy -= 16
        return cy

    # ---- Block A: $300 annual travel credit ----
    top = subbar(bar_y - 8, "$300 ANNUAL TRAVEL CREDIT", 300, renewal=True)
    text(x + 16, top - 11, "COUNTS: parking, tolls, taxis, trains, buses, airlines, hotels, car rental.",
         font="Body", size=7.5, col=INK)
    text(x + 16, top - 21, "DOESN'T COUNT: in-flight purchases, shops inside hotels and airports, sightseeing, gift cards.",
         font="Body", size=7.5, col=MUT)
    text(x + 16, top - 31, "This one resets on your account anniversary, not January 1 - and the annual fee posts on the same date.",
         font="Body", size=7.5, col=MUT)
    aend = tbl(top - 46, ["DATE", "WHAT IT WAS", "$ USED"],
               [x + 34, x + 120, x + CW - 118], 6, "tca")

    # ---- Block B: $250 Chase Travel hotels ----
    top = subbar(aend - 8, "$250 CHASE TRAVEL HOTELS  -  ENDS 12/31/26", 250)
    text(x + 16, top - 11,
         "Prepaid Chase Travel booking, two-night minimum. IHG, Montage, Pendry, Omni, Virgin, Minor and Pan Pacific.",
         font="Body", size=7.5, col=MUT)
    tbl(top - 26, ["HOTEL", "DATES", "$ USED"],
        [x + 34, x + 250, x + CW - 118], 2, "tch")
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
    card(x, bar_y, CW, body_h, CREAM, alpha(GOLD, 0.8))
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
    text(MARGIN, y + 2, "crazy4points.com", font="UI", size=8.5, col=PURPLE)
    # Full disclaimer (v53): the sheet uses Chase trademarks throughout.
    disc = ("Not affiliated with, endorsed by, or sponsored by Chase. Benefits verified against "
            "Chase's published terms in July 2026 and can change at any time - always confirm on "
            "chase.com before you rely on them.")
    ds = 7.0
    while c.stringWidth(disc, "Body", ds) > CW - 4 and ds > 5.4:
        ds -= 0.1
    text(PAGE_W / 2, y - 6, disc, font="Body", size=ds, col=alpha(MUT, 0.9), center=True)

# =========================================================================
# COMPOSE
# =========================================================================
# v53 "Companion" layout: 3 pages.
# PAGE 1 - claimed tracker + activate/link cards + earn cheat-sheet + every-month grid
y = header_band() + 6
y = draw_total(y) + 8
y = draw_setup_grid(y) + 8
y = draw_earn(y) + 6
y = draw_monthly(y)
footer()
c.showPage()

# PAGE 2 - twice-a-year credits, each tracked in place
y = mini_header(2)
# cream banner with a gold left accent (v53)
c.setFillColor(CREAM); c.roundRect(MARGIN, y - 20, CW, 20, 5, stroke=0, fill=1)
c.setFillColor(GOLD); c.roundRect(MARGIN, y - 20, 4, 20, 2, stroke=0, fill=1)
text(MARGIN + 14, y - 13, "Dining and Tickets reset each half-year - use them or lose them.  The Edit does not.",
     font="Body", size=9.5, col=INK)
y = y - 30
y = draw_edit(y, rows_per_half=2)
y = draw_dining(y, rows_per_half=2)
y = draw_tickets(y, rows_per_half=2)
footer()
c.showPage()

# PAGE 3 - $75k spend club, perks, protection, key dates
# tighten inter-section gaps to reclaim the room the NY callout added
y = mini_header(3)
y = draw_spend(y) + 5
y = draw_perks(y) + 5
y = draw_protect(y) + 4
y = draw_dates(y)
footer()
c.showPage()

# PAGE 4 - travel credits, lounge visits, newsletter CTA
y = mini_header(4)
y = draw_travel_credit(y)
y = draw_lounges(y)
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
        # Blank off-state for stamps that should show nothing until ticked
        # (the white cards + milestones: clean when unchecked, green DONE on tick).
        if not filled and not (label or "").strip():
            return b"q Q"
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
        # Row-order tab navigation: pressing Tab walks the fields top-to-bottom,
        # left-to-right by position instead of the annotation creation order.
        page[NameObject("/Tabs")] = NameObject("/R")
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
