-- Hedging pass on the Leading Hotels Leaders Club page to clear audit-program.mjs
-- banned-absolute / "free" findings (intro + quirks). No factual changes - only
-- wording: "free" -> "no-fee" (means free-to-join), drop never/always/guaranteed,
-- soften "only" to hedged forms. ASCII-only.

update programs set
  intro = 'Leading Hotels of the World is not a chain - it is a curated collective of 400-plus independently owned luxury hotels across 80-plus countries, the kind of places with a name and a story rather than a logo over the entrance (Le Sirenuse on the Amalfi Coast, The Gritti Palace in Venice). Its loyalty program, Leaders Club, was rebuilt in 2024: the old USD 175 annual fee vanished and it became a no-fee, points-earning program anyone can join. You earn 1 point per dollar on the room rate, cash points in toward reward nights starting around 4,000, and pick up on-property perks - continental breakfast for two, a shot at an upgrade, late checkout when the hotel can swing it. It will not out-earn Hyatt or Bonvoy on volume, but it is one of the very few points programs that reach these independent-luxury properties at all - and it quietly transfers in from Citi ThankYou.',
  quirks = '- **Program was rebuilt in 2024.** The old paid Leaders Club (around USD 175 a year, with richer fixed benefits) was replaced by today''s no-fee, points-based program. Some long-time members consider the new version a step down on its once-fixed perks - weigh older blog write-ups accordingly.
- **No award chart - pricing is fully dynamic.** Reward-night cost tracks each hotel''s published cash rate, starting around 4,000 points. Check the points cost for your specific dates with the "View with Points" tool on LHW.com.
- **Points expire after 24 months** of no earning or redemption activity.
- **Benefits attach to the member''s room only,** and only on eligible rates. Public and members-only rates earn points and benefits; corporate or negotiated rates earn points but not the other on-property benefits; OTA, group, prepaid-agency, and phone-with-the-hotel bookings earn neither.
- **Pre-arrival upgrades have rules.** One category only, not into or within a suite or villa, request at booking and no later than 3 days (00:00 UTC) before arrival, and not available on reward nights. If LHW cannot confirm it, the upgrade is re-credited and you receive 500 points.
- **You can buy points** in 1,000-point increments up to 50,000 per calendar year - useful only alongside a buy bonus and a planned redemption.
- **Citi ThankYou is currently the sole transfer-in partner,** and the ratio is unfavorable (premium Citi cards: 1,000 ThankYou = 200 points; no-annual-fee Citi cards earn less). There is no Leaders Club co-brand credit card.
- **SIXT status match** (Gold for Club, Platinum for Sterling) is the one perk you can use away from the hotels.',
  updated_at = now()
where slug = 'leading-hotels';
