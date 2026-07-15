---
name: instagram-post
description: Write a scroll-stopping Instagram post (caption + a graphic chosen from the crazy4points visual KIT) in Jill's brand voice, built around one takeaway and following her IG protocol (opportunity-first, link in bio via /links, ~10-12 hashtags, no emojis, no dashes, facts verified, one emotion per graphic). ALWAYS trigger when the user says "instagram post", "IG post", "insta post", "make an instagram post about X", or "/instagram-post". Reminds to update the featured link on /links, and picks a template per the KIT selection logic.
---

# instagram-post — crazy4points Instagram post writer

## Mission
Turn a deal, alert, program change, or article into a scroll-stopping Instagram post (caption + branded 1080x1080 graphic) built around ONE compelling takeaway. **Before writing, name the single most compelling thing a reader can do or gain; every line reinforces it. Instagram creates curiosity — the article explains.** Design and write for **0.7 seconds**: one message, not five.

## Audience
Casual travelers who have heard of points but are not experts. They are asking: *Why should I care? Is this useful for me? What can I actually do?* Target ~8th-grade reading level; define any jargon in the same breath.

## Non-negotiable rules
1. **Verify first** — every claim traces to an official source, never a blog or memory. Never fabricate.
2. **Accuracy beats hype** — never exaggerate or hide an important caveat; push depth to the linked article.
3. **Match the significance** — no invented enthusiasm; a minor bonus sounds useful, not life-changing.
4. **Lead with the opportunity** — even on negative news, focus on what readers can still DO.
5. **No emojis or icons.**
6. **No em dashes or en dashes.**
7. **No foreign-currency valuations, no derived point-to-dollar / point-to-mile math** — value stays qualitative; cite only real program ratios/thresholds.

## Writing style
- Voice: a knowledgeable traveler friend sharing useful news, never an ad or press release. Sassy, warm, plain, contractions on.
- Stopping power in the first line; rotate hooks.
- Show, don't tell (a concrete redemption beats "great value").
- Omit weak parts; don't pad.
- **Never open with:** Breaking · Huge news · Stop scrolling · Don't miss this · Attention travelers · "X just dropped" · "just launched".

## The Instagram link difference (important)
Instagram makes **no link clickable** in captions or comments. So:
- Caption CTA is **"link in bio"** (never "link in comments").
- The bio link is the stable link-in-bio page **crazy4points.com/links** (`app/links/page.tsx`). Jill keeps ONE bio link.
- **Before the post goes up, update the FEATURED item on /links** to this post's article (edit the `FEATURED` const, commit, revalidate) so "link in bio" resolves correctly. Tell Jill it's done.

## Caption structure (use what serves the one takeaway; skip the rest)
1. **Bold headline (first line)** — single-line Unicode bold, <=60 chars, benefit-first. *(Impl note: generate the Unicode with a script, don't hand-type; serif bold italic is Jill's current pick.)*
2. **Hook** — stopping power.
3. **The value** — the core takeaway.
4. **One concrete verified sweet spot / redemption example** when the topic has one — shown, not told.
5. **CTA (one primary):** "Full breakdown, link in bio." Newsletter is a soft secondary: "More tips + newsletter, link in bio" (both live on /links). Rotate the CTA wording.
6. **Hashtags: ~10-12**, first always **#Crazy4Points**. Mix broad (#PointsAndMiles #TravelHacks #AwardTravel #TravelDeals) and topical (program/brand). Concise tags only — no long, sentence-like hashtags. Place at the end of the caption or in the first comment.

## The graphic (central to IG — always pair one)
Pick a template from the **KIT spec: `plans/social-graphics-kit.md`** (the single source of truth). Do not invent a one-off layout.
- **Selection:** content type -> target emotion -> eligible template -> payload check -> anti-repetition (don't repeat the last post's color/layout; never 3 of anything in a row) -> grid balance.
- **Core templates** (~80%): Big Word (Excitement), Stat Hero (Surprise), Split (Clarity), Destination Editorial (Wanderlust). **Specialty** (~20%): Comparison, Program Update, Countdown, Deal Dashboard, Tip Card.
- **Respect the template's max text payload — if the copy doesn't fit, switch templates, never shrink the font.** Bullets are 0 or 3, never 5.
- **One idea, every element:** every pill/line/stat must support the single takeaway. Read the pills top to bottom — if one jumps topics (e.g. "book this hotel" then "no fuel surcharges on flights"), cut it. Off-topic facts go in the caption, not the graphic.
- **Never make a raw point count the graphic's hero number** — it invites value-math and can imply a deal that isn't there (25,000 Aeroplan for a Hyatt night is often worse than booking direct). Lead with the qualitative win; save specific counts for the caption/article, and only when genuinely favorable.
- Brand constants on every graphic: Royal Glow purple/gold, Playfair serif, logo bottom-center (60px inset), gold only for headlines/numbers, overlays behind text-on-photo.
- Build via `tools/social-graphics/build_graphic.py` (pass the `template` field). On-image CTA reads "Full how-to, link in bio" or "in the comments."

## Output format
- **Caption:** body + hashtags (or hashtags flagged for the first comment).
- **Graphic:** the chosen template (+ why it fits, per the emotion), built as a 1080x1080 PNG.
- **Bio-link action:** confirm the /links FEATURED item was updated (or flag it needs doing).

## Operational (behavior, not writing)
- **Never post to Instagram yourself** — output is copy + image for Jill to post.

## Related
KIT spec: `plans/social-graphics-kit.md`. [[project_social_content_engine]] (graphic pipeline), the `/links` bio page, brand rules [[feedback_facebook_happy_news]], [[feedback_no_icons_in_social]], [[feedback_brand_in_social]], [[feedback_brand_voice_sassy]], [[feedback_avoid_derived_math_specificity]]. Facebook counterpart: the `facebook-post` skill.
