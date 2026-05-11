-- 234_award_chart_aa_atmos_verified.sql
-- Correct AA + Atmos structured charts against verified programs.award_chart prose.
--
-- AA fixes:
--   - us-me-india Y: 35,000 → 45,000
--   - us-africa  Y: 40,000 → 50,000
--   - us-se-asia Y: 35,000 → 40,000
--
-- Atmos rebuild:
--   Replace per-partner sub-charts with the actual 3-region chart structure
--   (Americas / EMEA / Asia Pacific) used by Atmos post-merger. Each region
--   chart uses applies_to_buckets to scope it and lists every partner with
--   the same bands per region. Own-metal stays as a separate sub-chart.
--
-- Confidence: HIGH on both (numbers pulled directly from verified prose
-- on programs.award_chart for slug='aa' and slug='atmos').
--
-- Authored: 2026-05-11

begin;

-- ─── AA AAdvantage corrections ─────────────────────────────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "AAdvantage Saver",
      "partners": {
        "aa":                 { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 },
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 50000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "british-airways":    { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "qantas":             { "matrix": {
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 }
        }},
        "cathay-pacific":     { "matrix": {
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 }
        }},
        "jal":                { "matrix": {
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 }
        }},
        "finnair":            { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "qatar-airways":      { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 }
        }},
        "royal-jordanian":    { "matrix": {
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 }
        }},
        "malaysia":           { "matrix": {
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 }
        }},
        "iberia":             { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "royal-air-maroc":    { "matrix": {
          "us-africa":  { "economy": 50000, "business": 75000 }
        }},
        "alaska":             { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 }
        }}
      },
      "overrides": []
    },
    {
      "type": "dynamic",
      "label": "AAdvantage AAnytime (dynamic)",
      "partners": {
        "aa": {
          "ranges_by_bucket": {
            "us-short":    { "economy": { "p10": 12500, "p50": 25000,  "p90": 45000  } },
            "us-medium":   { "economy": { "p10": 17500, "p50": 35000,  "p90": 60000  } },
            "us-long":     { "economy": { "p10": 25000, "p50": 50000,  "p90": 90000  },
                             "business":{ "p10": 50000, "p50": 100000, "p90": 180000 } },
            "us-eu-east":  { "economy": { "p10": 60000, "p50": 110000, "p90": 180000 },
                             "business":{ "p10": 130000,"p50": 220000, "p90": 350000 } },
            "us-eu-west":  { "economy": { "p10": 60000, "p50": 110000, "p90": 180000 } },
            "us-me-india": { "economy": { "p10": 90000, "p50": 160000, "p90": 280000 } },
            "us-japan":    { "economy": { "p10": 70000, "p50": 125000, "p90": 200000 } },
            "us-se-asia":  { "economy": { "p10": 80000, "p50": 150000, "p90": 240000 } },
            "us-pacific":  { "economy": { "p10": 80000, "p50": 150000, "p90": 240000 } },
            "us-samerica": { "economy": { "p10": 55000, "p50": 100000, "p90": 160000 } },
            "us-africa":   { "economy": { "p10": 100000,"p50": 180000, "p90": 300000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'aa';

-- ─── Atmos rebuild — 3 regional sub-charts + own-metal ─────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "Atmos — Americas region (US-Americas / within Americas)",
      "applies_to_buckets": ["us-short", "us-medium", "us-long", "us-samerica"],
      "partners": {
        "aa":              { "bands": [
          { "max_miles": 700,   "cabin": { "economy": 4500,  "premium_economy": 6000,  "business": 9000,  "first": 13500 } },
          { "max_miles": 1400,  "cabin": { "economy": 7500,  "premium_economy": 10000, "business": 15000, "first": 25000 } },
          { "max_miles": 2100,  "cabin": { "economy": 12500, "premium_economy": 17500, "business": 25000, "first": 40000 } },
          { "max_miles": 4000,  "cabin": { "economy": 17500, "premium_economy": 22500, "business": 35000, "first": 52500 } },
          { "max_miles": 6000,  "cabin": { "economy": 25000, "premium_economy": 32500, "business": 50000, "first": 75000 } },
          { "max_miles": 12000, "cabin": { "economy": 30000, "premium_economy": 40000, "business": 60000, "first": 90000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — EMEA region (US-Europe/ME/Africa)",
      "applies_to_buckets": ["us-eu-east", "us-eu-west", "us-me-india", "us-africa"],
      "partners": {
        "british-airways": { "bands": [
          { "max_miles": 1500,  "cabin": { "economy": 7500,  "premium_economy": 10000, "business": 15000, "first": 22500 } },
          { "max_miles": 3500,  "cabin": { "economy": 22500, "premium_economy": 30000, "business": 45000, "first": 67500 } },
          { "max_miles": 5000,  "cabin": { "economy": 27500, "premium_economy": 35000, "business": 55000, "first": 82500 } },
          { "max_miles": 7000,  "cabin": { "economy": 35000, "premium_economy": 45000, "business": 70000, "first": 105000 } },
          { "max_miles": 10000, "cabin": { "economy": 42500, "premium_economy": 55000, "business": 85000, "first": 130000 } },
          { "max_miles": 22000, "cabin": { "economy": 55000, "premium_economy": 72500, "business": 110000, "first": 165000 } }
        ]},
        "iberia":          { "bands": [
          { "max_miles": 3500,  "cabin": { "economy": 22500, "business": 45000 } },
          { "max_miles": 5000,  "cabin": { "economy": 27500, "business": 55000 } }
        ]},
        "aer-lingus":      { "bands": [
          { "max_miles": 3500,  "cabin": { "economy": 22500, "business": 45000 } },
          { "max_miles": 5000,  "cabin": { "economy": 27500, "business": 55000 } }
        ]},
        "finnair":         { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 27500, "business": 55000 } }
        ]},
        "etihad":          { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 35000, "business": 70000, "first": 105000 } },
          { "max_miles": 10000, "cabin": { "economy": 42500, "business": 85000, "first": 130000 } }
        ]},
        "qatar":           { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 35000, "business": 70000, "first": 105000 } }
        ]},
        "royal-jordanian": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 35000, "business": 70000 } }
        ]},
        "royal-air-maroc": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 35000, "business": 70000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Asia Pacific region (US-Asia/Pacific)",
      "applies_to_buckets": ["us-japan", "us-se-asia", "us-pacific"],
      "partners": {
        "cathay":          { "bands": [
          { "max_miles": 3000,  "cabin": { "economy": 25000, "premium_economy": 32500, "business": 50000, "first": 75000 } },
          { "max_miles": 5000,  "cabin": { "economy": 30000, "premium_economy": 40000, "business": 60000, "first": 90000 } },
          { "max_miles": 7000,  "cabin": { "economy": 37500, "premium_economy": 50000, "business": 75000, "first": 110000 } },
          { "max_miles": 10000, "cabin": { "economy": 42500, "premium_economy": 55000, "business": 85000, "first": 130000 } }
        ]},
        "jal":             { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 30000, "premium_economy": 40000, "business": 60000, "first": 90000 } },
          { "max_miles": 7000,  "cabin": { "economy": 37500, "premium_economy": 50000, "business": 75000, "first": 110000 } }
        ]},
        "qantas":          { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 37500, "premium_economy": 50000, "business": 75000, "first": 110000 } },
          { "max_miles": 10000, "cabin": { "economy": 42500, "premium_economy": 55000, "business": 85000, "first": 130000 } }
        ]},
        "fiji-airways":    { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 37500, "business": 75000 } }
        ]},
        "korean-air":      { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 37500, "business": 75000, "first": 110000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — own metal (Alaska + Hawaiian)",
      "applies_to_buckets": ["us-short", "us-medium", "us-long"],
      "partners": {
        "alaska": { "bands": [
          { "max_miles": 700,  "cabin": { "economy": 4500,  "first": 15000 } },
          { "max_miles": 1400, "cabin": { "economy": 7500,  "first": 25000 } },
          { "max_miles": 2100, "cabin": { "economy": 10000, "first": 25000 } },
          { "max_miles": 3500, "cabin": { "economy": 12500, "first": 30000 } },
          { "max_miles": 6000, "cabin": { "economy": 20000, "first": 60000 } }
        ]},
        "hawaiian": { "bands": [
          { "max_miles": 700,  "cabin": { "economy": 4500,  "first": 15000 } },
          { "max_miles": 1400, "cabin": { "economy": 7500,  "first": 25000 } },
          { "max_miles": 6000, "cabin": { "economy": 20000, "first": 60000 } }
        ]}
      }
    }
  ]
}
$json$::jsonb
where slug = 'atmos';

-- ─── Aeroplan — NULL the chart (prose links to PDF, no inline numbers) ─
-- Per feedback_use_verified_prose_first.md: never author from memory.
-- Aeroplan's verified prose at programs.award_chart points to the official
-- PDF (https://www.aircanada.com/content/dam/aircanada/loyalty-content/
-- documents/flight-rewards-chart-en.pdf) but doesn't list the bands inline.
-- Until we WebFetch + parse that PDF, NULL the structured chart so the
-- Hub falls back to verified partner_redemptions.cost_miles_low/high rows.

update programs
set award_chart_structured = null
where slug = 'aeroplan';

-- ─── United — tighten dynamic lows per verified prose ──────────────────
-- Prose ranges (verified):
--   US transcon Y: 8k-40k  (we had p10:10k/p90:45k — tighten)
--   US to Europe Y: 35k-100k (we had p10:30k/p90:120k — tighten)
--   US to Asia Y: 45k-120k  (we had p10:35k/p90:140k — tighten)
--   US to Pacific Y: 50k-150k (we had p10:45k/p90:180k — tighten)
--   US to Europe J: 80k-300k (we had p10:70k/p90:250k — tighten)
--   Star partner saver US-Europe Y: 30k-40k (we had 33k — keep)
--   Star partner saver US-Asia Y: 35k-45k (we had 35k — keep)

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "United own-metal (dynamic)",
      "partners": {
        "united": {
          "ranges_by_bucket": {
            "us-short":    { "economy":  { "p10": 5000,   "p50": 12500,  "p90": 25000  } },
            "us-medium":   { "economy":  { "p10": 8000,   "p50": 22500,  "p90": 40000  },
                             "business": { "p10": 25000,  "p50": 50000,  "p90": 100000 } },
            "us-long":     { "economy":  { "p10": 15000,  "p50": 32500,  "p90": 65000  },
                             "business": { "p10": 35000,  "p50": 75000,  "p90": 150000 } },
            "us-eu-east":  { "economy":  { "p10": 35000,  "p50": 60000,  "p90": 100000 },
                             "business": { "p10": 80000,  "p50": 150000, "p90": 300000 } },
            "us-eu-west":  { "economy":  { "p10": 35000,  "p50": 60000,  "p90": 100000 },
                             "business": { "p10": 80000,  "p50": 150000, "p90": 300000 } },
            "us-japan":    { "economy":  { "p10": 45000,  "p50": 75000,  "p90": 120000 },
                             "business": { "p10": 95000,  "p50": 175000, "p90": 350000 } },
            "us-se-asia":  { "economy":  { "p10": 45000,  "p50": 80000,  "p90": 120000 },
                             "business": { "p10": 95000,  "p50": 175000, "p90": 350000 } },
            "us-me-india": { "economy":  { "p10": 45000,  "p50": 85000,  "p90": 170000 },
                             "business": { "p10": 95000,  "p50": 180000, "p90": 340000 } },
            "us-pacific":  { "economy":  { "p10": 50000,  "p50": 90000,  "p90": 150000 },
                             "business": { "p10": 110000, "p50": 200000, "p90": 400000 } },
            "us-samerica": { "economy":  { "p10": 25000,  "p50": 50000,  "p90": 100000 },
                             "business": { "p10": 55000,  "p50": 110000, "p90": 220000 } },
            "us-africa":   { "economy":  { "p10": 45000,  "p50": 95000,  "p90": 190000 },
                             "business": { "p10": 105000, "p50": 200000, "p90": 380000 } }
          }
        }
      }
    },
    {
      "type": "zone",
      "label": "United Star Alliance partners (saver)",
      "partners": {
        "lufthansa":          { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000,  "first": 121000 },
          "us-eu-west":  { "economy": 33000, "business": 88000,  "first": 121000 },
          "us-me-india": { "economy": 42500, "business": 105000, "first": 140000 },
          "us-africa":   { "economy": 45000, "business": 110000 },
          "us-japan":    { "economy": 40000, "business": 95000 }
        }},
        "ana":                { "matrix": {
          "us-japan":    { "economy": 35000, "business": 95000,  "first": 110000 },
          "us-se-asia":  { "economy": 40000, "business": 110000, "first": 130000 }
        }},
        "singapore-airlines": { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000, "first": 130000 }
        }},
        "turkish-airlines":   { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000 },
          "us-me-india": { "economy": 42500, "business": 105000 }
        }},
        "eva-air":            { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "thai-airways":       { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "asiana":             { "matrix": {
          "us-japan":    { "economy": 35000, "business": 95000 },
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "air-china":          { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "swiss":              { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000, "first": 121000 },
          "us-eu-west":  { "economy": 33000, "business": 88000 }
        }},
        "austrian":           { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000 }
        }},
        "air-new-zealand":    { "matrix": {
          "us-pacific":  { "economy": 50000, "business": 95000 }
        }}
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'united';

commit;
