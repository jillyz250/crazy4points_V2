---
name: facebook-post
description: Write a scroll-stopping, accurate Facebook post for crazy4points in Jill's brand voice, built around one compelling takeaway and following her full FB protocol (opportunity-first framing, one primary CTA with the link in the first comment, soft newsletter line, exactly 5 hashtags, no emojis, no dashes, facts verified). ALWAYS trigger when the user says "facebook post", "FB post", "write a facebook post", "post this on facebook", "make an FB post about X", or "/facebook-post". Produces the post body plus the separate first-comment link, and offers the matching 1080x1080 graphic.
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
- **Keep it tight:** ~4 short paragraphs. Jill's most common note is "too long."

## Post structure (use what serves the one takeaway; skip what doesn't)
1. **Bold headline (first line).** A single-line **Unicode bold** headline, under ~60 characters, leading with the primary benefit. *(Impl note: generate the Unicode with a small script for accuracy — do not hand-type the glyphs. Sans-serif bold or serif bold italic; Jill's current pick is serif bold italic.)*
2. **Hook** — one or two lines of stopping power.
3. **The value** — what the reader can actually do (the core takeaway).
4. **One concrete sweet spot / redemption example** whenever the topic has one — shown, not told ("this could book X instead of Y").
5. **Primary CTA — ONE clear action:** "Full breakdown in the comments." The article URL goes in the FIRST COMMENT, never the body (keeps the body clean and readable).
6. **Soft newsletter line (secondary).** One short line so it never competes with the primary CTA: "More points tips and our newsletter at crazy4points.com". Jill requires the newsletter mention, so keep it, but subordinate it. (Live URLs: crazy4points.com or crazy4points.com/start-here.)
7. **Exactly five concise hashtags** — one branded (#Crazy4Points) plus relevant travel/loyalty topics. No long, sentence-like hashtags.

## Output format
- **Post:** body ending with the 5 hashtags.
- **First comment (paste right after posting):** `Full breakdown here: https://www.crazy4points.com/alerts/<short-slug>` (the real short_slug URL, or the relevant /guides or /programs page).
- Then offer the matching **1080x1080 branded graphic** (`tools/social-graphics/build_graphic.py`; gold or purple palette; link/how-to line lives in the comment, not on the image).

## Operational (behavior, not writing)
- **Never post to Facebook yourself** — output is copy for Jill to post. Auto-posting is an outward action that needs her consent.
- Facebook **auto-links bare domains**, so "crazy4points.com" is clickable without www or https. The first-comment link uses the full https:// URL.
- Facebook **strips numbered-list markers** ("1." / "1)"). Use Unicode bold digits (𝟭) 𝟮) 𝟯)) only if you must number.

## Related
[[feedback_facebook_happy_news]] (refined here to "lead with the opportunity"), [[feedback_no_icons_in_social]], [[feedback_brand_in_social]], [[feedback_brand_voice_sassy]], [[feedback_no_just_dropped_opener]], [[feedback_avoid_derived_math_specificity]]. Graphic pipeline: [[project_social_content_engine]]. Instagram counterpart: the `instagram-post` skill.
