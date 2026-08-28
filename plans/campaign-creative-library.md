# Campaign creative library

Reusable ad creatives for paid-social campaigns. Each entry stores the **exact
Copilot image prompt** so we can regenerate or adapt it in seconds — for a similar
experience, copy the prompt and **swap the color scheme to that event's team
colors** (brand-safe: colors are not trademarks, only logos/names are).

Source files live in `~/Desktop/Crazy4Points Graphics/`; on-site heroes live in
`public/campaigns/`. See also memory `reference_campaign_landing_pages` (the full
Facebook-ad process) and the `facebook-post` skill.

## How to reuse for a new experience
1. Find the closest entry below (same shape — game / concert / suite / VIP access).
2. Copy its prompt. Swap: the **color scheme** → the event's team/brand colors;
   the **hero words / banner** → the new teams / artist / program; the **date +
   action** line. Keep: no real logos, room for the C4P logo, "no watermark".
3. Paste into Copilot, download, save to the graphics folder, catalog it here.
4. A/B test the Copilot image vs a clean `build_graphic.py` version (same copy).

---

## Entries

### VIP College Football Experience — Notre Dame vs North Carolina (2026-08)
- **Shape:** premium VIP game-day / auction experience
- **Colors:** Royal Glow purple + metallic gold (brand default). *Adapt: use the
  home team's colors next time — e.g. ND navy + gold, UNC Carolina blue.*
- **Files:** `~/Desktop/Crazy4Points Graphics/Copilot_20260828_150958.png`;
  on-site `public/campaigns/nd-unc-marriott.jpg`
- **Used on:** `/go/nd-unc-marriott-moment` landing + the featured experience listing
- **Copilot prompt:**
  > A premium cinematic sports-marketing graphic, square 1:1 format. Royal purple and metallic gold color scheme. Background: a college football stadium at night under bright floodlights, a packed crowd in soft focus, purple and gold confetti falling. Foreground left: a luxury VIP lanyard credential, deep purple with gold foil edges, embossed with a small gold football icon and the word "VIP" only — no other text on the badge. Foreground right: a glossy metallic gold football helmet, generic, no team logos. Bold layered typography centered: a giant gold 3D "VIP" at top, then silver-white "COLLEGE FOOTBALL" and gold script "Experience." A purple ribbon banner reading "NOTRE DAME vs NORTH CAROLINA." Below it, smaller white text: "October 3 · Bid Marriott points." Leave empty space at the bottom center for a logo. Luxurious, high-energy, editorial ad quality. No real team logos on the helmet, jerseys, or badge. No watermark.
