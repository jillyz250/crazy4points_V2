-- Audit fixes for the 77 authored airline pages, plus orphan-row cleanup.
--
-- Two parts:
--
-- A) CONTENT GAPS in 6 authored airline pages (per audit):
--   - alaska, hawaiian: missing transfer_partners + tier_benefits +
--     award_chart (and how_to_spend for hawaiian) - both use Atmos as
--     loyalty currency post-merger. Copy from atmos.
--   - delta, united: missing award_chart (dynamic-pricing programs).
--     Write brief field describing dynamic pricing.
--   - allegiant: missing tier_benefits. Add Allways Rewards Club tiers.
--   - korean-air: missing Marriott Bonvoy 3:1 in transfer_partners.
--
-- B) ORPHAN CLEANUP: delete 24 inactive type='airline' rows that have ZERO
--    FK refs in partner_redemptions or alert_programs. These were the
--    untracked underscore-slug skeletons from old seedings - mig 210
--    deactivated, mig 211/212/213 cleaned references, now safe to delete.

-- ============================================================
-- A1: alaska + hawaiian use Atmos - copy program-mechanics fields
-- ============================================================
update programs
set transfer_partners = (select transfer_partners from programs where slug = 'atmos'),
    tier_benefits = (select tier_benefits from programs where slug = 'atmos'),
    award_chart = (select award_chart from programs where slug = 'atmos'),
    last_verified = current_date,
    content_updated_at = now(),
    updated_at = now()
where slug in ('alaska', 'hawaiian');

-- hawaiian also missing how_to_spend - write a brief one
update programs
set how_to_spend = '- **HawaiianMiles ceased October 1, 2025.** All earning + redeeming on Hawaiian-operated flights now flows through Atmos Rewards (the merged Alaska + Hawaiian program). See [/programs/atmos](/programs/atmos) for current redemption mechanics.
- **Inter-island Hawaii** at 4,500 Atmos points one-way is the standout sweet spot.
- **US mainland to Hawaii** dynamically priced from ~10,000 Atmos points one-way Economy on Hawaiian metal.
- **Hawaii to Asia / Australia Business class on A330 lie-flat** through the Atmos partner chart - the program''s flagship premium-cabin redemption.
- **Hawaiian Airlines Mastercard (Bank of America)** still operates - now earns Atmos Rewards points. Free first checked bag + companion fare discount intact.',
    updated_at = now()
where slug = 'hawaiian' and (how_to_spend is null or length(coalesce(how_to_spend,'')) < 50);

-- ============================================================
-- A2: delta + united award_chart for dynamic-pricing programs
-- ============================================================
update programs
set award_chart = '## Delta SkyMiles award pricing (dynamic - no published chart)

Delta SkyMiles uses **fully dynamic pricing** with no published award chart since around 2015. Award costs scale with cash fare on a per-flight basis.

Typical ranges as of 2026 (verify on delta.com before booking):

| Route | Economy | Comfort+ | Business |
|---|---|---|---|
| US domestic short-haul | 5,000-30,000 | 12,000-50,000 | 25,000-100,000 |
| US transcon | 12,000-50,000 | 25,000-75,000 | 50,000-200,000 |
| US to Europe (Delta One) | 30,000-150,000 | 50,000-200,000 | 75,000-450,000 |
| US to Asia (Delta One) | 50,000-200,000 | 80,000-300,000 | 100,000-600,000 |
| US to Hawaii | 12,000-60,000 | 25,000-100,000 | 50,000-200,000 |

**Sweet-spot strategy:** Flash sales surface much lower rates (e.g., Delta One US-Europe at 75K-95K one-way during sales). Watch SkyMiles flash deals and Delta promo emails.

**Partner chart:** SkyTeam partner awards (Air France, KLM, Korean Air, Aeromexico, Virgin Atlantic, China Eastern, Garuda) priced via the same dynamic engine - typically more expensive than booking via the partner''s own program. **Use Virgin Atlantic Flying Club, Air France/KLM Flying Blue, or Korean SKYPASS to book Delta-operated metal at fixed-chart rates.**

For verified-as-of-today pricing, search delta.com directly.',
    last_verified = current_date,
    content_updated_at = now(),
    updated_at = now()
where slug = 'delta';

update programs
set award_chart = '## United MileagePlus award pricing (dynamic - no published chart since 2019 Excursionist removal)

United MileagePlus uses **fully dynamic pricing** on United-operated metal since the November 2019 award-chart removal. Star Alliance partner awards retain a quasi-region-based "Saver" pricing structure.

### United-operated metal (dynamic)

| Route | Economy | Premium Plus | Polaris Business |
|---|---|---|---|
| US domestic short-haul | 5,000-25,000 | n/a | n/a |
| US transcon | 8,000-40,000 | 25,000-80,000 | 35,000-150,000 |
| US to Europe (Polaris) | 35,000-100,000 | 60,000-150,000 | 80,000-300,000 |
| US to Asia (Polaris) | 45,000-120,000 | 80,000-180,000 | 95,000-350,000 |
| US to Australia / Pacific | 50,000-150,000 | 90,000-200,000 | 110,000-400,000 |

### Star Alliance partner Saver awards (quasi-fixed)

| Route | Economy Saver | Business Saver | First Saver |
|---|---|---|---|
| US to Europe | 30,000-40,000 | 80,000-110,000 | 130,000-160,000 |
| US to Asia | 35,000-45,000 | 80,000-90,000 | 130,000-160,000 |
| US to Australia / South Pacific | 40,000-60,000 | 95,000-110,000 | 140,000-180,000 |

**Sweet-spot strategy:** Saver partner awards on Star Alliance carriers (Lufthansa, Swiss, ANA, EVA, Singapore, Asiana, Air Canada) are dramatically cheaper than United-metal dynamic awards on the same routes. Search aa.com for date flexibility, then route through United via Aeroplan / Avianca / Turkish if availability is tight.

For verified-as-of-today pricing, search united.com directly.',
    last_verified = current_date,
    content_updated_at = now(),
    updated_at = now()
where slug = 'united';

-- ============================================================
-- A3: allegiant tier_benefits (Allways Rewards Club)
-- ============================================================
update programs
set tier_benefits = '[
  {
    "name": "Allways Rewards (free tier)",
    "qualification": "Free to join; no spend or flight requirement",
    "benefits": [
      "Earn 1 Allways point per dollar spent on Allegiant flights",
      "Earn additional points on Allegiant World Mastercard purchases",
      "No elite-tier perks beyond standard membership"
    ]
  },
  {
    "name": "Allways Allegiant Direct (premium subscription)",
    "qualification": "Paid annual subscription (verify current pricing on allegiantair.com)",
    "benefits": [
      "Discounted base fares on Allegiant flights",
      "Free seat selection on member fares",
      "Priority boarding",
      "Promo-eligible discounts on bag fees and ancillary services"
    ]
  }
]'::jsonb,
    last_verified = current_date,
    content_updated_at = now(),
    updated_at = now()
where slug = 'allegiant';

-- ============================================================
-- A4: korean-air transfer_partners (Marriott Bonvoy)
-- ============================================================
update programs
set transfer_partners = '[
  {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "Marriott Bonvoy is the only major US-issued currency that transfers to SKYPASS. 60,000 Bonvoy points yield 25,000 SKYPASS miles via the standard 60K-tier 5,000-mile bonus. Verified May 2026.", "bonus_active": false}
]'::jsonb,
    last_verified = current_date,
    content_updated_at = now(),
    updated_at = now()
where slug = 'korean-air';

-- ============================================================
-- B: Delete 24 orphan inactive airline rows (zero FK refs)
-- ============================================================
delete from alert_programs where program_id in (
  select p.id from programs p
  where p.type = 'airline'
    and p.is_active = false
    and p.id not in (select operating_carrier_id from partner_redemptions where operating_carrier_id is not null)
    and p.id not in (select currency_program_id from partner_redemptions where currency_program_id is not null)
    and p.id not in (select primary_program_id from alerts where primary_program_id is not null)
);

delete from programs
where type = 'airline'
  and is_active = false
  and id not in (select operating_carrier_id from partner_redemptions where operating_carrier_id is not null)
  and id not in (select currency_program_id from partner_redemptions where currency_program_id is not null)
  and id not in (select primary_program_id from alerts where primary_program_id is not null);
