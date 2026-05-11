-- 239_award_chart_tail.sql
-- Award Chart Rebuild Phase 2 tail — Caribbean, Frontier, Allegiant, Korean,
-- SriLankan, JetBlue.
--
-- Per feedback_use_verified_prose_first.md + feedback_chart_partner_slug_must_match.md.
--
-- Coverage:
--   - srilankan          NULL      no prose in DB
--   - allegiant          NULL      cash-equivalent, not chart-modelable
--   - korean-air         AUTHORED  zone chart from off-peak rates
--   - caribbean-airlines AUTHORED  zone, post-May 2026 flat rates
--   - jetblue            AUTHORED  dynamic per route-type
--   - frontier           AUTHORED  dynamic from Value-tier minimums
--
-- Authored: 2026-05-11

begin;

update programs set award_chart_structured = null where slug = 'srilankan';
update programs set award_chart_structured = null where slug = 'allegiant';

-- ─── Korean Air SKYPASS ────────────────────────────────────────────────
-- Zone chart using off-peak rates as default. Peak rates noted in prose
-- but not modeled as separate chart pass.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "SKYPASS off-peak (default — peak rates also published)",
      "partners": {
        "korean-air": {
          "matrix": {
            "us-japan":   { "economy": 35000, "business": 62500, "first": 80000 },
            "us-se-asia": { "economy": 35000, "business": 62500, "first": 80000 }
          }
        },
        "delta": {
          "matrix": {
            "us-long":   { "economy": 12500 },
            "us-eu-east":{ "business": 40000 },
            "us-eu-west":{ "business": 40000 }
          }
        },
        "air-france": {
          "matrix": {
            "us-eu-east": { "business": 40000 },
            "us-eu-west": { "business": 40000 }
          }
        },
        "klm": {
          "matrix": {
            "us-eu-east": { "business": 40000 },
            "us-eu-west": { "business": 40000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'korean-air';

-- ─── Caribbean Airlines (Caribbean Miles) ──────────────────────────────
-- Post-08-May-2026 flat rates. Network is small + region-locked.
-- Verified prose flags uncertainty re: per-direction vs round-trip.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "Caribbean Miles flat-rate (post-May 2026)",
      "partners": {
        "caribbean-airlines": {
          "matrix": {
            "us-medium":  { "economy": 15000, "business": 25000 },
            "us-long":    { "economy": 15000, "business": 25000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'caribbean-airlines';

-- ─── JetBlue TrueBlue ──────────────────────────────────────────────────
-- Fully revenue-based dynamic. Author per route-type ranges.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "TrueBlue (revenue-based, JetBlue-operated)",
      "partners": {
        "jetblue": {
          "ranges_by_bucket": {
            "us-short":   { "economy":  { "p10": 500,   "p50": 2500,  "p90": 5000 } },
            "us-medium":  { "economy":  { "p10": 5000,  "p50": 10000, "p90": 20000 } },
            "us-long":    { "economy":  { "p10": 15000, "p50": 22500, "p90": 35000 },
                            "business": { "p10": 50000, "p50": 70000, "p90": 90000 } },
            "us-eu-east": { "economy":  { "p10": 25000, "p50": 37500, "p90": 50000 },
                            "business": { "p10": 80000, "p50": 115000, "p90": 150000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'jetblue';

-- ─── Frontier Miles ────────────────────────────────────────────────────
-- Three-tier (Value / Standard / Last Seat). Author dynamic ranges where
-- p10 is Value-tier minimum, p90 is Last Seat tier (rough estimate).

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "Frontier Miles tiered (Value / Standard / Last Seat)",
      "partners": {
        "frontier": {
          "ranges_by_bucket": {
            "us-short":  { "economy": { "p10": 5000,  "p50": 12000, "p90": 30000 } },
            "us-medium": { "economy": { "p10": 5000,  "p50": 15000, "p90": 40000 } },
            "us-long":   { "economy": { "p10": 8000,  "p50": 22500, "p90": 60000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'frontier';

commit;
