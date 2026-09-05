# Image Library build-out — Reese's plan (captured 2026-09-05)

Owner: **Reese** (Head of Visual Content). Status: PLAN captured, not started (Jill: "let's not do this now, I'm just showing you"). Jill drives the vision; Reese suggests + executes when greenlit. Workflow stays: prompts from Claude → Jill generates in ChatGPT (she has the master of the pantsuit girl) → Reese cutout/rename/catalog/backup.

## Jill's vision (2026-09-05)
- **Hero** = the poolside pantsuit girl banner ("Because paying full price is so last season" / "Join the Insider List"). Use it as the website hero with the nav bar over the top.
- **The pantsuit girl = a reusable model** — make many images from her (Jill already has a master reference).
- **Normalize image names**, build out the library so there are **tons of images to call on**, organized.
- **Pick canonical masters:** master mascot, master hero, master C4P icon (+ logo).
- **Build bonus creatives in 3 sizes** (sq/wide/story) across categories.
- **Categories to build:** ad creatives, experiences, sweepstakes, website image upgrades, logo.
- Reese = the visual image master: she makes suggestions for images + templates.

## Reese's findings + recommendations
**#1 finding — the catalog is blind:** ~100 real images live in `public/` (brand-kit, hero-preview, team, brand-logos, social-archive, campaigns) but only **8** are in `campaign_creatives`. `creative-for.mjs` can't rotate what it can't see. **Backfilling the catalog is the single highest-leverage move.**

**Master picks (recommended):**
- Master mascot → `public/brand-kit/mascot/crazy4points-mascot-MASTER.png` (the seed; upload to ChatGPT for new poses/outfits).
- Master hero → `public/hero-preview/hero-poolside.png` VISUAL, re-cut as a clean NO-TEXT plate (text is currently baked in → breaks mobile/SEO/reuse).
- Master C4P icon → `crazy4points-icon-transparent.png` (+ `-square` as the filled/app-tile variant).
- Master wordmark → `crazy4points-wordmark-hero.png` (+ `-dark`/`-light`).

**Naming convention (extend the existing scheme in `creative-prompts.md`):**
```
Masters/logos:  crazy4points-{icon|wordmark|logo}-{variant}.png
Mascot:         mascot-{descriptor}.png  (MASTER = crazy4points-mascot-MASTER.png)
Scenes:         scene-{descriptor}.png
Partner logos:  {brand-slug}.png
Hero/page art:  page-{slug}-{hero|section|art}.png
Arsenal:        arsenal-{category}-{descriptor}-{sq|wide|story}.png
Dated social:   social-{YYYY-MM-DD}-{slug}-{sq|wide|story}.png
```
Cleanup: `social-archive/` files miss the `social-` prefix + size token; 2 untracked files in `public/campaigns/`.

**Catalog schema upgrade (`campaign_creatives`):** add `usable_for text[]` (multi-tag for rotation), `size (sq|wide|story)`, `last_used_at` (powers the no-repeat rule), then **backfill the ~90 uncataloged images**. Add a tag-editor + retire/feature toggle on `/admin/creatives` (one-click curation).

**Bonus-image matrix (each concept × sq/wide/story), priority by alert volume:**
1. Welcome/card bonus (6 `-sq` exist → add wide+story) · 2. Limited-time offer (21, biggest) · 3. Program change (16) · 4. Partner change (12) · 5. Transfer bonus (3, high value) · 6. Sweepstakes (signup magnet) · 7. Status promo (4) · 8. Devaluation (4) · 9. Award sale/buy points · 10. Generic/brand.
First sprint: finish welcome-bonus wide+story, then LTO + program-change + partner-change + transfer-bonus.

**Templates:** standardize on the 9 in `plans/social-graphics-kit.md` mapped per content type. NEW template to add: **"Mascot Reaction"** — a mascot pose (celebrate/surprised/thinking/stop) as hero + one line; most ownable, least-AI-looking, uses the 13 unused poses.

**Hero-as-site-hero:** `/preview-home` already floats the nav over `hero-poolside.png`, but the headline + CTA are **baked into the PNG** (bad for mobile at 375px, SEO, reuse). Recommendation: keep the visual, commission a **no-text plate** (`page-home-hero.png` wide + a taller mobile crop via `<picture>`), render headline + CTA as real HTML on top. Confirm 0 horizontal overflow at 375px.

## Suggested first moves (when Jill greenlights)
1. Approve master picks + lock them.
2. Catalog schema add + backfill ~90 images (makes the library real + rotatable). ⭐ highest leverage.
3. First prompt sprint: pantsuit-girl variations + the top bonus buckets in 3 sizes.
4. Live-text the hero (no-text plate + HTML headline/CTA) as part of homepage v2.

Ref: `plans/social-graphics-kit.md`, `plans/alert-templates/creative-prompts.md`, `scripts/creative-for.mjs`, `app/(site)/preview-home/page.tsx`, `app/admin/(protected)/creatives/page.tsx`.
