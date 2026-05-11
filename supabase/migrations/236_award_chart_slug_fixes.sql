-- 236_award_chart_slug_fixes.sql
-- Fix slug mismatches in batch 1 + batch 2 charts.
--
-- partner keys in award_chart_structured.partners must match the EXACT
-- programs.slug values, otherwise computeAwardCost returns null and the
-- Hub silently falls back to stored cost_miles_low/high (which is why
-- JFK-AUH on AA-via-Qatar showed 40k stored instead of 45k from chart).
--
-- Fixes:
--   AA:       qatar-airways → qatar; cathay-pacific → cathay;
--             malaysia-airlines → malaysia; ADD etihad partner
--   United:   turkish-airlines → turkish; thai-airways → thai;
--             REMOVE singapore-airlines (no such program slug — only krisflyer)
--   Avianca:  turkish-airlines → turkish; singapore-airlines → REMOVE
--   Qatar:    no fixes needed (already uses aa / british-airways / cathay
--             / jal / iberia / latam — all canonical)
--   Atmos:    no fixes needed (uses cathay / jal / qantas / etc. canonical)
--   BA Avios: no fixes needed
--
-- Authored: 2026-05-11

begin;

-- ─── AA AAdvantage — re-key partners + add Etihad ──────────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "AAdvantage Saver",
      "partners": {
        "aa":              { "matrix": {
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
        "british-airways": { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "qantas":          { "matrix": {
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 }
        }},
        "cathay":          { "matrix": {
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 }
        }},
        "jal":             { "matrix": {
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 }
        }},
        "finnair":         { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "qatar":           { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 },
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 },
          "us-africa":  { "economy": 50000, "business": 75000 }
        }},
        "etihad":          { "matrix": {
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 },
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 }
        }},
        "royal-jordanian": { "matrix": {
          "us-me-india":{ "economy": 45000, "business": 70000, "first": 115000 }
        }},
        "malaysia":        { "matrix": {
          "us-se-asia": { "economy": 40000, "business": 70000, "first": 110000 }
        }},
        "iberia":          { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "royal-air-maroc": { "matrix": {
          "us-africa":  { "economy": 50000, "business": 75000 }
        }},
        "alaska":          { "matrix": {
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

-- ─── United — re-key partners (turkish-airlines→turkish, thai-airways→thai,
--               REMOVE singapore-airlines orphan) ───────────────────────

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
        "lufthansa":    { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000,  "first": 121000 },
          "us-eu-west":  { "economy": 33000, "business": 88000,  "first": 121000 },
          "us-me-india": { "economy": 42500, "business": 105000, "first": 140000 },
          "us-africa":   { "economy": 45000, "business": 110000 },
          "us-japan":    { "economy": 40000, "business": 95000 }
        }},
        "ana":          { "matrix": {
          "us-japan":    { "economy": 35000, "business": 95000,  "first": 110000 },
          "us-se-asia":  { "economy": 40000, "business": 110000, "first": 130000 }
        }},
        "krisflyer":    { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000, "first": 130000 }
        }},
        "turkish":      { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000 },
          "us-me-india": { "economy": 42500, "business": 105000 }
        }},
        "eva-air":      { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "thai":         { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "asiana":       { "matrix": {
          "us-japan":    { "economy": 35000, "business": 95000 },
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "air-china":    { "matrix": {
          "us-se-asia":  { "economy": 40000, "business": 110000 }
        }},
        "swiss":        { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000, "first": 121000 },
          "us-eu-west":  { "economy": 33000, "business": 88000 }
        }},
        "austrian":     { "matrix": {
          "us-eu-east":  { "economy": 33000, "business": 88000 }
        }},
        "air-new-zealand": { "matrix": {
          "us-pacific":  { "economy": 50000, "business": 95000 }
        }}
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'united';

-- ─── Avianca LifeMiles — re-key partners ───────────────────────────────

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
        "turkish": {
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
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'avianca';

commit;
