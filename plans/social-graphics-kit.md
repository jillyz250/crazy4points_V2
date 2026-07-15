# crazy4points Social Graphics KIT

**A visual language, not a pile of templates.** People should never think "that's template #4" — they should think "that's a Crazy4Points post." Recognition beats novelty. This doc is the single source of truth for the `instagram-post` skill and the `tools/social-graphics/build_graphic.py` generator.

---

## Brand constants (on EVERY template — this is what makes it "yours")
- **Palette (Royal Glow):** primary purple `#6B2D8F`, accent gold `#D4AF37`, cream/off-white, near-black text `#1A1A1A`.
- **Fonts:** Playfair Display (elegant serif) for headlines/hero; a clean sans for eyebrow, body, pills, CTA.
- **Logo:** Crazy4Points logo in a rounded white chip, **bottom-center, 60px minimum inset from all edges**, slight shadow/stroke so it holds on photos.
- **No emojis. No em/en dashes.** Premium-but-friendly.

## Fixed hierarchy + anchors (only the MIDDLE changes)
Every template uses the same skeleton and anchor positions. Consistency here is what makes a brand feel expensive.
```
Eyebrow    (upper area, small caps, tracked)
Headline   (the question / setup)
Hero       (the ONE thing — big word, number, or image)
Support    (1 line or up to 3 pills)
CTA        (bottom)
Logo       (bottom-center)
```

## Global rules (all templates)
- **Design for 0.7 seconds. ONE message per card.** Don't fit the article onto the image — create curiosity; the article explains.
- **One idea, every element.** Every line, pill, stat, and label must support that single takeaway. Never mix topics on one card — e.g. a "book this hotel with points" graphic must not also tout a flight perk. If a fact belongs to a different story, it goes in the caption or a separate post. (This is the coherence test: read the pills top to bottom — do they tell ONE story? If not, cut the outlier.)
- **Never make a raw point count the hero / focal number.** A big "25,000" invites the viewer to do value-math ("is that a good deal?") and can imply a bargain that isn't there (e.g. 25,000 Aeroplan for a Hyatt night is often worse than booking Hyatt directly). Lead with the qualitative win. Only use a hero number when it is unambiguously and favorably the story (a genuinely elevated sign-up bonus, a headline discount like "40% off") — never a conversion cost or transfer amount that reads as a comparison.
- **Bullets: 0 (with 1 hero) or exactly 3. Never 5, never 7.** Instagram is not PowerPoint.
- **Max text payload per template is a hard limit (below). If the copy doesn't fit, switch templates — never shrink the font.**
- **Minimum font ~42px** on the 1080 canvas. Suggested sizes: hero 180-260pt, headline 90-120pt, body 48-60pt, pills 42-50pt, eyebrow 28-36pt, CTA 40-48pt.
- **Accessibility / legibility:**
  - Never place text directly on a busy photo. Use a dark gradient overlay (20-35% opacity), a cream panel, or a translucent purple bar behind text.
  - Text over photos sits over "quiet" areas (avoid busy skies, crowds, detailed architecture).
  - **Gold is for headlines, numbers, and small accents only — never body copy.** Body is cream/white/purple. Aim WCAG AA (purple-on-cream, gold-on-purple, white-on-purple).
- **CTA wording rotates** so readers don't go CTA-blind: "Full guide in bio" · "Read the full breakdown" · "See the sweet spots" · "Learn how it works" · "More details in bio" · "Full how-to in the comments."

---

## Template catalog

### CORE (~80% of posts — your visual identity)

**1. Big Word** — *Emotion: Excitement*
Solid color background (gold OR purple variant). The signature layout.
Layout: eyebrow, serif question headline, HUGE bold accent phrase (the hero), 3 pill bullets, CTA, logo.
Payload: eyebrow <=6 words · headline <=10 words · big word <=3 words · exactly 3 pills, <=7 words each.
Notes: your most recognizable card; target ~35% of posts. Accent phrase in the opposite brand color (purple word on gold bg, gold word on purple bg).

**2. Stat Hero** — *Emotion: Surprise*
One giant number is the focal point.
Layout: eyebrow, giant number (hero), subline, optional 0-2 micro-bullets, CTA, logo.
Payload: number 1-2 tokens ("75,000", "40% off") · subline <=14 words · micro-bullets <=6 words each.

**3. Split** — *Emotion: Clarity*
Half travel photo, half solid-color panel with the offer. The workhorse for dense offers.
Layout: photo one half; color panel holds headline + up to 3 short lines/pills + CTA; logo.
Payload: headline <=10 words · panel up to 3 lines, <=10 words/line.
Notes: color panel gives guaranteed contrast, so this handles denser copy safely.

**4. Destination Editorial** — *Emotion: Wanderlust*
Full travel photo, sell the dream + one redemption. (Merges the old "Photo Editorial" + "Destination Spotlight".)
Layout: destination label (small), serif headline, ONE redemption block over a quiet area / behind an overlay, CTA, logo.
Payload: destination label 1-2 words · headline <=10 words · redemption block <=2 lines, <=10 words/line.
Notes: use sparingly (photos vary in tone) — but this is what makes travel content aspirational.

### SPECIALTY (~20% — used by need, sparingly)

**5. Comparison / VS** — *Emotion: Confidence*
Two columns for "which is better" math.
Payload: column header <=4 words · <=3 bullets/column, <=7 words each.

**6. Program Update** — *Emotion: Attention*
Premium "pay attention" card for program/partner changes. NOT red/CNN — on-brand and calm.
Layout: eyebrow "PROGRAM UPDATE", headline, one support line, CTA, logo.
Payload: headline <=10 words · support <=14 words.

**7. Countdown** — *Emotion: Urgency*
Real deadlines only (ties to a deal's `end_date`). Never fake scarcity.
Layout: eyebrow "ENDS", big date (hero), one line, CTA, logo.
Payload: date 1-3 tokens · line <=10 words.

**8. Deal Dashboard** — *Emotion: Scannability*
Transfer-bonus / multi-deal roundup in a clean grid.
Layout: eyebrow/title, 2-5 rows (issuer -> partner, rate, end date), CTA, logo.
Payload: 2-5 rows, each <=8 words (e.g. "Amex -> Hilton  30%  ends Jul 31").

**9. Tip / Quote Card** — *Emotion: Trust*
Minimal, one punchy evergreen line. The evergreen machine.
Payload: one line, <=14 words.

**Dropped:** Boarding-Pass / Luggage-Tag — cleverness over 0.7s readability. Revisit only as a rare seasonal one-off.

---

## Selection logic (how to pick a template)
1. **What content type is this?** (deal · transfer bonus · program change · countdown/deadline · comparison · tip · aspirational/destination · roundup)
2. **What emotion should the viewer feel?** (see the emotion per template above)
3. **Which eligible template best delivers it?** Content-type -> eligible templates:
   - Deal -> Big Word, Split, Stat Hero
   - Transfer bonus -> Stat Hero, Deal Dashboard, Big Word
   - Program change -> Program Update, Comparison, Tip
   - Deadline-driven -> Countdown, Big Word
   - "Which is better" -> Comparison, Split
   - Evergreen tip -> Tip Card, Destination Editorial
   - Destination / aspirational -> Destination Editorial, Split
   - Roundup / multiple deals -> Deal Dashboard
4. **Payload check:** does the copy fit the chosen template's limits? If not, pick another template (never shrink fonts).
5. **Anti-repetition:** don't repeat the previous post's background color or layout; never 3 of anything in a row (no Gold/Gold/Gold, Photo/Photo/Photo, Big-Word/Big-Word/Big-Word).

## Feed-balance targets (think in grids of 9)
Rough mix across a 9-post grid: ~30% Big Word (gold+purple), ~25% photo-based (Split + Destination), and at least 1 each of Stat Hero, Comparison, Tip. Prevents "purple-purple-purple" clumping and keeps the profile grid attractive.

---

## Implementation notes (build_graphic.py)
- Add a `template` field to the JSON config; each template is a named layout function sharing the brand constants + anchors.
- Enforce max payloads at build time (warn/refuse rather than autoshrink).
- Bake the accessibility overlays into the photo templates (Split, Destination).
- 1080x1080 output. Logo asset is 1317x509 — size it into the bottom-center chip with the 60px inset.
- Build order: Core 4 first (Big Word, Stat Hero, Split, Destination), then Specialty as needed.

Related: [[project_social_content_engine]], the `instagram-post` and `facebook-post` skills, [[project_best_rate_guarantee_guide]] (BRG graphic was an early Big-Word example).
