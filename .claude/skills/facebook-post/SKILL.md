---
name: facebook-post
description: Write a scroll-stopping, accurate Facebook post for crazy4points in Jill's brand voice, built around one compelling takeaway and following her full FB protocol (opportunity-first framing, one primary CTA with the link in the first comment, soft newsletter line, exactly 5 hashtags, no emojis, no dashes, facts verified). ALWAYS trigger when the user says "facebook post", "FB post", "write a facebook post", "post this on facebook", "make an FB post about X", or "/facebook-post". Produces the post body plus the separate first-comment link; the post attaches the permanent brand card (public/fb-brand-card.png), not a per-post graphic.
---

# facebook-post — crazy4points Facebook post writer

## Mission
Turn a deal, alert, program change, or article into a scroll-stopping, accurate Facebook post built around ONE compelling takeaway. **Before writing, name the single most compelling thing a reader can do or gain. Every sentence must reinforce that one idea; if a sentence does not support it, cut it.** Good marketing copy is built around one promise, not a pile of facts.

## Audience
Casual travelers who have heard of points but are not experts. They are silently asking: *Why should I care? Is this useful for me? What can I actually do?* Answer those. Target roughly an **8th-grade reading level** — short words beat industry jargon, and any term you must use gets defined in the same breath.

## Non-negotiable rules
1. **Verify first.** Every claim traces to an official source (issuer/program page), never a blog or memory. Never fabricate a number, date, or benefit. If building from a published alert, its facts are already verified.
2. **Accuracy beats hype.** Never exaggerate or hide an important caveat to make the post punchier. If a claimed path has a catch (e.g. "this only helps Amex/Cap One holders since Chase already goes direct"), be honest about it; push the depth to the article.
3. **Match the significance.** A minor transfer bonus should sound useful, not life-changing. No invented enthusiasm.
4. **Lead with the opportunity** — even on negative news, focus on what readers can still DO. A devaluation becomes "still time to book before prices rise." Tone stays upbeat and useful. (This is the refined version of the older "happy news only" rule.)
5. **No emojis or icons.**
6. **No em dashes or en dashes.** Commas, periods, parentheses.
7. **No foreign-currency valuations, no derived point-to-dollar / point-to-mile math.** Keep value qualitative; cite only real program ratios/thresholds ("2 to 1", "from 25,000 points", "5,000-point stopover").

## Writing style
- **Voice:** a knowledgeable traveler friend sharing useful news, never an ad, press release, or SEO article. Sassy, warm, plain. Contractions on. Short sentences.
- **Stopping power:** the first two lines must spark enough curiosity to stop the scroll, without clickbait.
- **Show, don't tell:** "enough for two nights at a Park Hyatt" beats "great value." Specific redemption examples consistently outperform generic benefit statements.
- **Omit weak parts:** do not force every section. No real sweet spot? No genuine urgency? Leave it out rather than padding the template.
- **Never open with:** Breaking · Huge news · Stop scrolling · Don't miss this · Attention travelers · "X just dropped" · "just launched". Rotate fresh hooks.
- **Keep it tight:** ~50-80 words total, hook line + 1-2 sentences (see Length section). Jill's standing note is "too long" — err shorter.

## Length (READ FIRST — Jill's standing note is "too long")
**Keep the whole post to ~50-80 words.** Facebook truncates after ~2 lines / ~250 characters ("See more"), and most people never expand — so the hook and the point MUST land in the first two lines. One idea, one CTA. The linked article carries all the detail; the post's only job is to stop the scroll and earn the click. Do NOT write 3-4 paragraphs. Locked in 2026-07-30.

## Post structure (tight — hook line + 1-2 sentences + CTA + newsletter)
1. **Headline (first line).** Plain text, under ~60 characters, benefit/news-first — this is the pre-"See more" hook, so the wording alone has to carry it. **NEVER use Unicode / "fancy" bold** (the 𝐌𝐚𝐭𝐡𝐞𝐦𝐚𝐭𝐢𝐜𝐚𝐥 𝐁𝐨𝐥𝐝 characters): those glyphs **break link/UTM tracking and Meta throttles delivery on ads that contain them**, so posts get served far less. Plain text only, everywhere — headlines, captions, and comments. (Rule set 2026-08-04, replacing the earlier Unicode-bold guidance.)
2. **Body — 1 to 2 short sentences.** The core takeaway plus, when it fits, one concrete detail or a single practical caveat. That's it. No separate "hook / value / example" paragraphs — fold them into these 1-2 sentences.
3. **Primary CTA (its own line) — points to the comment link, value-forward.** NOT the flat "Full breakdown in the comments." Rotate value-forward phrasings, e.g. "We break it all down. Link in the comments." / "Here's the full rundown, link in the comments." / "What it means for your points, link in the comments." The article URL goes in the FIRST COMMENT, never the body.
4. **Newsletter line (its OWN separate line).** Wording like: **"For tips, tricks, and breaking news, subscribe to our newsletter: crazy4points.com/newsletter"** — always the `crazy4points.com/newsletter` URL (Facebook auto-links bare domains, so it renders blue/clickable and lands users right on the signup form). Keep it one line, after the CTA. Jill requires the newsletter mention.
5. **Exactly five concise hashtags** — one branded (#Crazy4Points) plus relevant, topic-specific tags (e.g. #JetBlue #TrueBlue, not all generic). No long, sentence-like hashtags.

## Output format
- **Post:** body ending with the 5 hashtags.
- **First comment (paste right after posting):** `Full breakdown here: https://www.crazy4points.com/alerts/<short-slug>` (the real short_slug URL, or the relevant /guides or /programs page).
- **Facebook uses ONE permanent brand card, not a per-post graphic (set 2026-07-30).** Every FB post attaches the same cute image: `public/fb-brand-card.png` (also on the Desktop as `crazy4points-fb-card.png`) - the Crazy4Points mascot + wordmark, landscape so it sits smaller in-feed. Attaching it makes the post show this image (not a scraped/dominating link-preview card) and keeps the newsletter URL as plain blue text. **Do NOT build a bespoke graphic for Facebook.** The big 1080x1080 `build_graphic.py` graphics are an INSTAGRAM thing (see the instagram-post skill); Facebook just reuses the brand card. If Jill ever wants the brand card refreshed, regenerate it from `public/crazy4points-logo.png`.

## Operational (behavior, not writing)
- **Never post to Facebook yourself** — output is copy for Jill to post. Auto-posting is an outward action that needs her consent.
- Facebook **auto-links bare domains**, so "crazy4points.com" is clickable without www or https. The first-comment link uses the full https:// URL.
- Facebook **strips numbered-list markers** ("1." / "1)"). If you must number, spell it in plain words ("Step 1") — **never Unicode bold digits** (they break UTM tracking and cut ad delivery, same as the bold headline rule above).

## Related
[[feedback_facebook_happy_news]] (refined here to "lead with the opportunity"), [[feedback_no_icons_in_social]], [[feedback_brand_in_social]], [[feedback_brand_voice_sassy]], [[feedback_no_just_dropped_opener]], [[feedback_avoid_derived_math_specificity]]. Graphic pipeline: [[project_social_content_engine]]. Instagram counterpart: the `instagram-post` skill.
