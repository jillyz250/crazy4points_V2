# Partner Change — alert template

For "a program added / removed / changed a transfer or earn partner" alerts
(partner_change; also `new_partner` / `ended_partner` change-signals). Owner: John;
facts verified by Priya. **Legal tier: skip Charlie** (everyday points news).

## When to use it — and the key difference from a transfer bonus
A **standing, permanent** partnership change: a new transfer/earn partner, a partner
removed, or a new conversion route (e.g., Finnair ↔ Radisson two-way conversions,
Atmos adds Jetstar as earn-only). NOT a temporary transfer-bonus % (that's
`transfer-bonus.md`). **Because it's permanent, it is PAGE-AFFECTING** — it must also
update the program page(s), not just publish an alert. Use the "Apply to page" flow on
the change-signal.

## The sections
1. **Lead** — one line: Program X **added / removed / now converts with** Partner Y, and
   the one thing it unlocks (new partner) or the deadline it creates (ended partner).
2. **What changed** — the specific change: which partner, **earn-only vs transfer vs
   two-way conversion**, the **ratio** (normal, stated old → new if it changed), the
   **direction**, and the **effective/cutoff date**. Verified against BOTH programs' official pages.
3. **Why it matters** —
   - *New partner:* ⭐ a **specific verified sweet spot** the partnership unlocks (a real
     redemption now reachable). Shown, not told.
   - *Ended partner:* what you lose, and the **deadline to use** points/miles that route
     before it closes.
4. **How to use it** — the mechanics: link accounts, minimum transfer, whether it's
   one-way and final, any enrollment.
5. **The catch** — ratio not 1:1 if applicable, earn-only (can't redeem) vs full transfer,
   regional limits (e.g., Radisson EMEA/APAC only), name-match requirements.
6. **Bottom line** — who benefits + the next step.

## Hard standards (non-negotiable)
- **PAGE-AFFECTING → update the program page(s) too.** A standing partner change belongs
  on the program page(s), not just an alert. Use the change-signal "Apply to page" flow
  (or edit the `quirks`/partner data directly) + bump `content_updated_at`. The alert and
  the page must agree.
- **Verify BOTH sides** — the change is real only when confirmed on each program's own
  official page (the Finnair↔Radisson lesson: check both).
- **New partner → real verified sweet spot (§3);** ended partner → **`end_date` = the
  cutoff** to use the route (closed-loop auto-expire).
- Avios-family check: if one Avios program adds a partner, the whole Combine-My-Avios
  family may reach it (`feedback_avios_family_transfer_partner_check`).
- No derived valuations, no foreign-currency, no dashes; figures Priya-verified.

## Disclosure
None required (no affiliate/card).

## Visual
- **Check first:** `creative-for.mjs` and reuse before generating.
- **Social:** a "now connected" Split graphic (X + Y). Both program colors, brand NAMES as text, no logos. New partner = what it unlocks; ended partner = the deadline.

## Related
`transfer-bonus.md` (temporary %, vs this permanent change), the change-signal
**Apply to page** flow (`app/admin/(protected)/change-signals/`), `reference_sweet_spots_system`,
`feedback_avios_family_transfer_partner_check`, `feedback_partner_list_from_index_page`,
`feedback_never_an_open_loop`.
