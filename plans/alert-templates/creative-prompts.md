# Alert Creative Prompts (Copilot)

Reusable Copilot image prompts — one per alert-template type. Jill (or Kesha/Reese)
swaps the `<PLACEHOLDERS>` per deal. **Always check `node scripts/creative-for.mjs`
and reuse an existing creative before generating a new one.**

## Shared style base (prepend to every prompt)
> Create a 1080x1080 social graphic. Premium, clean, lots of whitespace. Headline in an
> elegant serif (Playfair-style). Palette: `<BRAND/EVENT COLORS>`. Render the word
> "`<BRAND>`" as plain text exactly as written, but do NOT draw any `<BRAND>` logo,
> emblem, or trademark. No icons, no stock-photo clutter. Numbers and the headline in
> gold. Bottom-center leaves room for a small wordmark.

Then add the type-specific hero:

## 1. Card bonus increase — Stat Hero
> HERO: the number "`<BONUS>`" (e.g. 125,000) huge and centered, "`<CARD>` welcome bonus"
> above it in serif, and a small pill "`<deadline or Limited-time>`" below. Use the card
> issuer's colors.

## 2. Transfer bonus — Split
> Split the canvas: left "`<FROM PROGRAM>`", right "`<TO PROGRAM>`", a bold arrow between.
> Headline "`<X>`% transfer bonus". Small pill "Ends `<DATE>`". Two brand colors, one per side.

## 3. Devaluation — Countdown / beat-the-clock
> HERO: "Book before `<DATE>`" as the headline with a subtle clock/countdown motif, subtext
> "`<PROGRAM>` award prices are rising". Urgent but not alarming, in the program's colors.

## 4. Partner change — connected Split
> Two program names "`<A>`" and "`<B>`" joined by a connecting motif. Headline
> "`<A>` now connects with `<B>`", subtext "`<what it unlocks / the ratio>`".

## 5. Limited-time offer — Big Word
> ONE big word or short phrase as the hero ("`<X>`% OFF" or "`<BONUS>` POINTS"), the
> "`<PROGRAM>`" name, small pill "Ends `<DATE>`". Bright, high-energy palette.

## 6. Sweepstakes / giveaway — Prize hero + Countdown
> HERO: the prize "`<PRIZE>`" (e.g. 1,000,000 points) huge in gold, a "GIVEAWAY" label,
> the "`<PROGRAM>`" name, and a pill "Enter by `<DATE>`". Celebratory palette. (Best
> performing format for signups.)

## 7. Program / policy change — old to new Split
> Split "`<OLD>`" to "`<NEW>`" showing the change, headline "`<what changed>`", pill
> "Effective `<DATE>`". Program colors. Frame to the real news, good or bad.

## 8. Award sale / buy points — Discount Stat Hero
> HERO: "`<X>`% OFF" or "`<X>`% BONUS" huge in gold, subtext "on `<PROGRAM>` points",
> pill "Ends `<DATE>`". (Hero the % or discount, never a raw point count.)

## 9. Status promo — Tier Big Word
> HERO: the tier "`<TIER>`" (e.g. GOLD STATUS) as the big word, subtext "`<PROGRAM>`
> status `<match / fast-track / challenge>`", pill "Register by `<DATE>`".

## Rules baked in
Brand NAME as text, never the logo (`feedback_brand_name_as_text_in_creatives`); no icons
(`feedback_no_icons_in_social`); colors are brand-safe (colors aren't trademarks, logos are);
never hero a raw point count where it invites value-math; match enthusiasm to significance.
Build the `build_graphic.py` counterpart when A/B testing; catalog every finished image in
`campaign_creatives` so `creative-for.mjs` finds it next time.
