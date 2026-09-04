# Alert Creative Prompts — the image arsenal

## ⭐⭐ THE DIVISION OF LABOR (Jill, 2026-09-04 — "this is gold")
**Prompts come from CLAUDE. Image generation happens in CHATGPT. Processing comes back to CLAUDE.**
This is the proven workflow — whoever owns images (Kesha = social, Devon = page art) follows it every time:
1. **Claude/Morgan writes the prompt** — brand-accurate, correctly sized, with the exact target filename. (Claude does NOT generate images; it writes the prompts.)
2. **The owner (or Jill) runs it in ChatGPT** to generate. (ChatGPT is the generator — better output than the alternatives; generate one-at-a-time or as triptychs.)
3. **Claude does the post-work** — split/rename to convention, background cutout (rembg), composite, catalog in `campaign_creatives`, back up to the repo.
Never ask ChatGPT to render TEXT-heavy logos/wordmarks (it garbles letters) — Claude builds those from the real logo file.


Jill runs these in Copilot to build an **arsenal** of images; we tag what each can be
used for and **rotate** them across alerts (never repeat the same look back-to-back).
**3 starter variants per category below.** Owner of the arsenal: **Kesha** (with Reese/
Devon) — a running task keeps it growing. Always `node scripts/creative-for.mjs` and
reuse before generating.

## ⭐⭐ THE MASCOT MASTER (Jill, 2026-09-04) — how to make new outfits/poses of the girl
Our brand mascot is a consistent character (brown hair, brand-purple dress, polished 3D style) —
she must look like the SAME girl every time. The master reference lives at
**`Crazy4Points Graphics/mascot/crazy4points-mascot-MASTER.png`** (transparent hero cutout).
To make ANY new version (seasonal, outfit swap, new pose), **UPLOAD the MASTER to ChatGPT** with a
prompt like:

> Use this image as my Crazy4Points master mascot. Keep her face, hair, body proportions and 3D
> illustration style consistent. Create a [OCCASION] version of her — [outfit + pose details]. Keep
> her sophisticated and stylish, not costume-like. Transparent background.

Example (July 4th): *"…Create a Fourth of July version of her. Give her a chic red, white and blue
summer outfit and a fun celebratory pose. Keep her sophisticated and stylish, not costume-like.
Transparent background."*

Then Claude does the post-work: **rembg cutout to remove any halo/background**, crop, name
`mascot-<descriptor>.png`, catalog + back up. The MASTER is what guarantees she stays on-model —
never generate the mascot from a text description alone (she'll drift); always seed from the MASTER.
Established pose library: hero, presenting, thinking, surprised, celebrate, sad, secret, cheer,
flight-attendant. Flight-attendant = the AVATAR persona; main mascot = the dress look. Both brown-haired.

## Shared style base (prepend to EVERY prompt)
> Create a 1080x1080 social graphic. Premium, clean, lots of whitespace. Headline in an
> elegant serif (Playfair-style). Palette: `<BRAND/EVENT COLORS>`. Render "`<BRAND>`" as
> plain text exactly as written, but do NOT draw any logo, emblem, or trademark. No icons,
> no stock-photo clutter. Numbers + headline in gold. Room for a small wordmark bottom-center.

Then pick a variant for the type:

## 1. Card bonus increase
- a) **Stat Hero:** the number "`<BONUS>`" enormous and centered, "`<CARD>` welcome bonus" above, "Ends `<DATE>`" pill.
- b) **Before/after bump:** "`<OLD>` → `<BONUS>`" showing the jump, card name below.
- c) **Card-art forward:** the card floating at an angle on a color-block field, "`<BONUS>` bonus" as the headline.

## 2. Transfer bonus
- a) **Split arrow:** "`<FROM>` → `<TO>`" with a bold arrow, "`<X>`% bonus" headline.
- b) **Big percent:** "`<X>`%" as the giant hero, "transfer bonus to `<TO>`" subtext.
- c) **Route teaser:** a faint world-map arc between two cities, "`<X>`% to `<TO>`" overlaid.

## 3. Devaluation
- a) **Countdown:** "Book before `<DATE>`" with a clock motif, "`<PROGRAM>` prices rising" subtext.
- b) **Calendar mark:** a big circled "`<DATE>`" with "`<PROGRAM>` award change" headline.
- c) **Split rising:** "today `<OLD>` → `<DATE>` `<NEW>`" showing the increase.

## 4. Partner change
- a) **Connected:** "`<A>` + `<B>`" joined by a link motif, "now connected" headline.
- b) **New route unlocked:** "`<A>` now reaches `<B>`", subtext what it unlocks.
- c) **Ended-partner (deadline):** "`<A>` ✕ `<B>` ends `<DATE>`", use-it-now framing.

## 5. Limited-time offer
- a) **Big Word:** one phrase hero ("`<X>`% OFF" / "`<BONUS>` POINTS"), "Ends `<DATE>`" pill.
- b) **Deal Dashboard:** 3 stat tiles for a multi-part promo (never 5).
- c) **Ticket/tag motif:** a stylized price-tag or ticket with the offer + deadline.

## 6. Sweepstakes / giveaway
- a) **Prize hero:** "`<PRIZE>`" enormous in gold + "GIVEAWAY" label + "Enter by `<DATE>`".
- b) **Confetti/celebration:** festive field, "Win `<PRIZE>`" headline, "`<PROGRAM>`" name.
- c) **Golden ticket:** a stylized ticket reading the prize + entry deadline.

## 7. Program / policy change
- a) **Old → new:** "`<OLD>` → `<NEW>`", "`<what changed>`" headline, "Effective `<DATE>`".
- b) **Announcement bar:** a clean banner "`<PROGRAM>`: `<change>`", neutral palette.
- c) **Good-news variant:** brighter palette when the change is a benefit ADDED.

## 8. Award sale / buy points
- a) **Discount Stat Hero:** "`<X>`% OFF" giant in gold, "on `<PROGRAM>` points" subtext.
- b) **Sale banner:** "POINTS SALE" + "`<X>`% bonus" + "Ends `<DATE>`".
- c) **Bonus-stack:** "buy points, get `<X>`% more" with a subtle stacked-coins motif (no $ figures).

## 9. Status promo
- a) **Tier Big Word:** "`<TIER>`" as the hero, "`<PROGRAM>` status match" subtext.
- b) **Ladder:** "`<OLD TIER>` → `<TIER>`" as a step-up, "Register by `<DATE>`".
- c) **Perk-forward:** "Skip to `<TIER>`" with 3 perk words (lounge, upgrades, bags).

## Generic / brand (reusable across any alert)
- a) **Royal Glow brand card:** purple + gold, "#Crazy4Points" + "crazy4points.com", clean.
- b) **"New alert" frame:** a branded template with a blank hero zone for quick text drops.
- c) **Aspirational travel:** a premium-cabin / lobby scene (no real brand), for wanderlust posts.

## ⭐ Batch generation in Copilot — best practice (Jill confirmed 2026-09-04)
Copilot can make **many images in ONE run**, auto-name them, and hand back a **single ZIP** —
don't generate one at a time. The efficient flow the image owner (Kesha social / Devon page-art)
should always use:

1. **Batch the prompts.** Send them numbered, one per line (1., 2., 3., …). Prepend the Shared Style
   Base to each (or tell Copilot "use my Crazy4Points brand kit — Royal Glow purple/gold, Playfair"
   once for the whole batch; say "let each prompt have its own style" only when you deliberately want
   variety).
   - ⚠️ **ALWAYS tell Copilot: "generate each as a SEPARATE full-size 1080x1080 image — do NOT combine
     them into one sheet, grid, or strip."** Left to itself Copilot returns a single wide "contact
     sheet" (all three side-by-side in one ~2172x724 file), which is low-res and unusable as-is
     (learned 2026-09-04). If it still hands back a combined strip, that's fine — see the workflow
     below; Morgan splits it — but ask for separates first so you keep full resolution.
2. **⭐ THREE SIZES per concept (Jill, 2026-09-04 — Stories/TikTok coming).** For each concept ask
   Copilot for the SAME concept in three framings, because a creative reframes badly when cropped
   (a centered burst loses its effect) — purpose-built beats cropped:
   - **`-sq`** square 1080x1080 — Instagram/Facebook feed (ChatGPT native 1024x1024)
   - **`-wide`** landscape 1200x630 — link share cards (`og:image`) + alert-page heroes (ChatGPT native 1536x1024, Morgan finalizes to 1200x630)
   - **`-story`** vertical 1080x1920 (9:16) — Stories / Reels / TikTok (ChatGPT native 1024x1536, "vertical 9:16 framing"; Morgan finalizes)
   Skip a size only when a placement truly won't use it. Facebook feed uses the ONE brand card, not these.
3. **Naming convention** (Morgan applies it after; hand Copilot the pattern too so ZIPs come close):
   - Arsenal (reusable): `arsenal-{category}-{descriptor}-{sq|wide|story}.png`
   - Dated social post: `social-{YYYY-MM-DD}-{slug}-{sq|wide|story}.png`
   - Page art: `page-{card-or-program-slug}-{hero|section|art}.png`
   - (matches our folder convention — see the image-library task on Devon)
4. **Ask for ONE bulk download** — "package them into a single ZIP." One click, everything together.
   (Copilot also offers PPTX or individual-but-together; ZIP is what we want.)
5. **⭐ NAMING WORKFLOW (Jill, 2026-09-04): Jill just SAVES; Morgan names + extracts.** Jill saves
   whatever Copilot gives (a ZIP, individual files, or even a combined strip) into the right subfolder
   of Desktop `Crazy4Points Graphics/` (`social/`, `brand/`, `page-images/`) — she does NOT rename.
   Then Morgan **checks the folder, splits any combined sheet into individual squares (PIL/Python),
   and renames each to the convention.** She never fusses with filenames.
6. **Back up (close the loop).** Morgan copies keepers into the repo (site assets →
   `public/team|programs|cards`; social one-offs → `public/social-archive/`) so GitHub is a 2nd copy
   beside iCloud, and catalogs each in `campaign_creatives` (category + prompt + image_url) so
   `creative-for.mjs` can reuse + rotate it.
7. **Always pair the prompt with its target filename** when handing prompts to Jill (so she knows what
   each one is), even though Morgan does the actual renaming after.

## Rules baked in
Brand NAME as text, never the logo (`feedback_brand_name_as_text_in_creatives`); no icons
(`feedback_no_icons_in_social`); brand-safe colors (logos are trademarks, colors aren't);
never hero a raw point count that invites value-math; match enthusiasm to significance.
Catalog every finished image in `campaign_creatives` (tag its usable-for list) so
`creative-for.mjs` finds + rotates it. Kesha owns the arsenal; Reese/Devon produce.
