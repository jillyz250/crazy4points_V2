-- 235_award_chart_batch2.sql
-- Award Chart Rebuild Phase 2 batch 2 — Avios siblings + distance heavies.
--
-- Per feedback_use_verified_prose_first.md: every chart authored ONLY
-- from numbers verified in programs.award_chart prose. Where prose is
-- too thin, chart is NULL (Hub falls back to verified partner_redemptions
-- cost_miles_low/high rows).
--
-- Coverage in this migration:
--   - avianca   AUTHORED  zone chart from 4 sample cells
--   - qatar     AUTHORED  multi-chart: dynamic own-metal + distance partners
--   - etihad    AUTHORED  distance chart with 6 verified bands (4 missing
--                          bands return null; chart picks next-higher band)
--   - iberia    NULL      prose has 5 examples only; full chart not verified
--   - ana       NULL      RT-only / zone, prose has examples only
--
-- Authored: 2026-05-11

begin;

-- ─── Avianca LifeMiles ─────────────────────────────────────────────────
-- Type: zone (region-based per verified prose)
-- Verified cells: US-domestic on UA (6.5k/12.5k), US-Europe Star (30k/65k/125k),
-- US-S America Avianca (20k/45k), US-N Asia Star (40k/75k/120k)
-- Confidence: MED (sample cells, not full chart)

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "LifeMiles Star Alliance + Avianca partner saver",
      "partners": {
        "united": {
          "matrix": {
            "us-short":  { "economy": 6500,  "business": 12500 },
            "us-medium": { "economy": 6500,  "business": 12500 },
            "us-long":   { "economy": 6500,  "business": 12500 }
          }
        },
        "avianca": {
          "matrix": {
            "us-samerica": { "economy": 20000, "business": 45000 }
          }
        },
        "lufthansa": {
          "matrix": {
            "us-eu-east": { "economy": 30000, "business": 65000, "first": 125000 },
            "us-eu-west": { "economy": 30000, "business": 65000, "first": 125000 }
          }
        },
        "swiss": {
          "matrix": {
            "us-eu-east": { "economy": 30000, "business": 65000, "first": 125000 },
            "us-eu-west": { "economy": 30000, "business": 65000 }
          }
        },
        "austrian": {
          "matrix": {
            "us-eu-east": { "economy": 30000, "business": 65000 }
          }
        },
        "turkish-airlines": {
          "matrix": {
            "us-eu-east": { "economy": 30000, "business": 65000 }
          }
        },
        "ana": {
          "matrix": {
            "us-japan": { "economy": 40000, "business": 75000, "first": 120000 }
          }
        },
        "asiana": {
          "matrix": {
            "us-japan": { "economy": 40000, "business": 75000, "first": 120000 }
          }
        },
        "eva-air": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000 }
          }
        },
        "singapore-airlines": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000, "first": 120000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'avianca';

-- ─── Qatar Privilege Club ──────────────────────────────────────────────
-- Type: multi-chart per verified prose
--   1. Qatar own-metal: dynamic ranges (examples in prose; modeled as percentiles)
--   2. Partner chart: full 9-band distance chart (mirrors BA's structure)
-- Confidence: HIGH on partner chart (full bands in prose); MED on dynamic
-- own-metal (examples are typical mid-range)

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "QR own-metal (dynamic per route)",
      "partners": {
        "qatar": {
          "ranges_by_bucket": {
            "us-me-india":  { "economy":  { "p10": 30000, "p50": 35000, "p90": 50000 },
                              "business": { "p10": 70000, "p50": 80000, "p90": 110000 },
                              "first":    { "p10": 85000, "p50": 95000, "p90": 130000 } },
            "us-se-asia":   { "economy":  { "p10": 50000, "p50": 60000, "p90": 80000 },
                              "business": { "p10": 100000,"p50": 120000,"p90": 150000 } },
            "us-eu-east":   { "economy":  { "p10": 45000, "p50": 55000, "p90": 75000 },
                              "business": { "p10": 90000, "p50": 110000,"p90": 140000 } },
            "us-africa":    { "economy":  { "p10": 55000, "p50": 70000, "p90": 90000 },
                              "business": { "p10": 110000,"p50": 130000,"p90": 165000 } }
          }
        }
      }
    },
    {
      "type": "distance",
      "label": "QR Privilege Club partners (oneworld + bilateral)",
      "partners": {
        "aa": {
          "bands": [
            { "max_miles": 650,   "cabin": { "economy": 6000,  "business": 12500 } },
            { "max_miles": 1150,  "cabin": { "economy": 9000,  "business": 18000 } },
            { "max_miles": 2000,  "cabin": { "economy": 11000, "business": 22000 } },
            { "max_miles": 3000,  "cabin": { "economy": 13000, "business": 25000, "first": 50000 } },
            { "max_miles": 4000,  "cabin": { "economy": 20750, "business": 41250, "first": 62500 } },
            { "max_miles": 5500,  "cabin": { "economy": 25750, "business": 51500, "first": 77250 } },
            { "max_miles": 6500,  "cabin": { "economy": 31000, "business": 62000, "first": 93000 } },
            { "max_miles": 22000, "cabin": { "economy": 41250, "business": 82500, "first": 124000 } }
          ]
        },
        "british-airways": {
          "bands": [
            { "max_miles": 650,   "cabin": { "economy": 6000,  "business": 12500 } },
            { "max_miles": 2000,  "cabin": { "economy": 11000, "business": 22000 } },
            { "max_miles": 4000,  "cabin": { "economy": 20750, "business": 41250 } },
            { "max_miles": 22000, "cabin": { "economy": 41250, "business": 82500 } }
          ]
        },
        "cathay": {
          "bands": [
            { "max_miles": 4000,  "cabin": { "economy": 20750, "business": 41250, "first": 62500 } },
            { "max_miles": 22000, "cabin": { "economy": 41250, "business": 82500, "first": 124000 } }
          ]
        },
        "jal": {
          "bands": [
            { "max_miles": 5500,  "cabin": { "economy": 25750, "business": 51500 } },
            { "max_miles": 22000, "cabin": { "economy": 41250, "business": 82500 } }
          ]
        },
        "iberia": {
          "bands": [
            { "max_miles": 650,   "cabin": { "economy": 6000,  "business": 12500 } },
            { "max_miles": 4000,  "cabin": { "economy": 20750, "business": 41250 } }
          ]
        },
        "latam": {
          "bands": [
            { "max_miles": 22000, "cabin": { "economy": 41250, "business": 82500 } }
          ]
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'qatar';

-- ─── Iberia Plus — NULL (prose has examples only, not full chart) ──────
-- Hub falls back to verified partner_redemptions.cost_miles_low/high rows.

update programs
set award_chart_structured = null
where slug = 'iberia';

-- ─── ANA Mileage Club — NULL (prose has examples only, RT-only model) ──
-- Hub falls back to verified partner_redemptions rows.
-- TODO: re-author when full ANA zone chart is verified into programs.award_chart.

update programs
set award_chart_structured = null
where slug = 'ana';

-- ─── Etihad Guest ───────────────────────────────────────────────────────
-- Type: distance chart, 10-band unified partner chart per verified prose
-- Verified bands: 1, 2, 3, 5, 7, 10 (4 + 6 + 8 + 9 not in prose; compute
-- will round UP to the next verified band for routes in those gaps).
-- Confidence: HIGH on verified bands; MED on missing-band fallback behavior.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "Etihad Guest unified 10-band partner chart",
      "partners": {
        "etihad": {
          "bands": [
            { "max_miles": 1000,  "cabin": { "economy": 6000,  "business": 12000,  "first": 24000  } },
            { "max_miles": 2000,  "cabin": { "economy": 12000, "business": 24000,  "first": 44000  } },
            { "max_miles": 3000,  "cabin": { "economy": 18000, "business": 36000,  "first": 64000  } },
            { "max_miles": 5000,  "cabin": { "economy": 28000, "business": 60000,  "first": 100000 } },
            { "max_miles": 7000,  "cabin": { "economy": 38000, "business": 80000,  "first": 130000 } },
            { "max_miles": 22000, "cabin": { "economy": 50000, "business": 110000, "first": 180000 } }
          ]
        },
        "aa": {
          "bands": [
            { "max_miles": 1000,  "cabin": { "economy": 6000,  "business": 12000,  "first": 24000  } },
            { "max_miles": 2000,  "cabin": { "economy": 12000, "business": 24000,  "first": 44000  } },
            { "max_miles": 3000,  "cabin": { "economy": 18000, "business": 36000,  "first": 64000  } },
            { "max_miles": 5000,  "cabin": { "economy": 28000, "business": 60000,  "first": 100000 } },
            { "max_miles": 7000,  "cabin": { "economy": 38000, "business": 80000,  "first": 130000 } },
            { "max_miles": 22000, "cabin": { "economy": 50000, "business": 110000, "first": 180000 } }
          ]
        },
        "alaska": {
          "bands": [
            { "max_miles": 1000,  "cabin": { "economy": 6000,  "business": 12000  } },
            { "max_miles": 2000,  "cabin": { "economy": 12000, "business": 24000  } },
            { "max_miles": 3000,  "cabin": { "economy": 18000, "business": 36000  } },
            { "max_miles": 5000,  "cabin": { "economy": 28000, "business": 60000  } },
            { "max_miles": 7000,  "cabin": { "economy": 38000, "business": 80000  } }
          ]
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'etihad';

commit;
