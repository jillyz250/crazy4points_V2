-- 229_award_chart_aeroplan.sql
-- Award Chart Rebuild Phase 2 batch 1 — Aeroplan.
--
-- Inserts the structured award chart for slug = 'aeroplan'. Three bucket-
-- scoped distance sub-charts (NA / Atlantic / Pacific) per v1.1 schema —
-- Aeroplan's distance bands vary by region of route. Source TS:
-- lib/awardCharts/aeroplan.ts.
--
-- Confidence: HIGH on NA bands; MED on Atlantic/Pacific.
--
-- Idempotent.
--
-- Authored: 2026-05-11

begin;

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "Aeroplan — North America",
      "applies_to_buckets": ["us-short", "us-medium", "us-long"],
      "partners": {
        "air-canada":        { "bands": [
          { "max_miles": 500,  "cabin": { "economy": 6000,  "business": 15000, "first": 20000 } },
          { "max_miles": 1500, "cabin": { "economy": 10000, "business": 20000, "first": 30000 } },
          { "max_miles": 2750, "cabin": { "economy": 12500, "business": 25000, "first": 35000 } },
          { "max_miles": 6000, "cabin": { "economy": 25000, "business": 40000, "first": 55000 } }
        ]},
        "united":            { "bands": [
          { "max_miles": 500,  "cabin": { "economy": 6000,  "business": 15000, "first": 20000 } },
          { "max_miles": 1500, "cabin": { "economy": 10000, "business": 20000, "first": 30000 } },
          { "max_miles": 2750, "cabin": { "economy": 12500, "business": 25000, "first": 35000 } },
          { "max_miles": 6000, "cabin": { "economy": 25000, "business": 40000, "first": 55000 } }
        ]},
        "ana":               { "bands": [
          { "max_miles": 6000, "cabin": { "economy": 25000, "business": 40000, "first": 55000 } }
        ]}
      },
      "overrides": []
    },
    {
      "type": "distance",
      "label": "Aeroplan — Atlantic",
      "applies_to_buckets": ["us-eu-east", "us-eu-west", "us-me-india", "us-africa"],
      "partners": {
        "air-canada":        { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000, "first": 70000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000, "first": 90000 } },
          { "max_miles": 22000, "cabin": { "economy": 50000, "business": 85000, "first": 120000 } }
        ]},
        "united":            { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000, "first": 70000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000, "first": 90000 } },
          { "max_miles": 22000, "cabin": { "economy": 50000, "business": 85000, "first": 120000 } }
        ]},
        "lufthansa":         { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000, "first": 70000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000, "first": 90000 } },
          { "max_miles": 22000, "cabin": { "economy": 50000, "business": 85000, "first": 120000 } }
        ]},
        "swiss":             { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000, "first": 70000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000, "first": 90000 } }
        ]},
        "austrian":          { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000, "first": 70000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000, "first": 90000 } }
        ]},
        "turkish-airlines":  { "bands": [
          { "max_miles": 4000,  "cabin": { "economy": 35000, "business": 60000 } },
          { "max_miles": 6000,  "cabin": { "economy": 40000, "business": 70000 } }
        ]},
        "tap-air-portugal":  { "bands": [
          { "max_miles": 4000, "cabin": { "economy": 35000, "business": 60000 } }
        ]},
        "egyptair":          { "bands": [
          { "max_miles": 6000, "cabin": { "economy": 40000, "business": 70000 } }
        ]},
        "ethiopian":         { "bands": [
          { "max_miles": 22000, "cabin": { "economy": 50000, "business": 85000 } }
        ]},
        "etihad":            { "bands": [
          { "max_miles": 22000, "cabin": { "economy": 50000, "business": 85000, "first": 120000 } }
        ]}
      },
      "overrides": []
    },
    {
      "type": "distance",
      "label": "Aeroplan — Pacific",
      "applies_to_buckets": ["us-japan", "us-se-asia", "us-pacific"],
      "partners": {
        "air-canada":        { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000, "first": 95000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000, "first": 105000 } },
          { "max_miles": 22000, "cabin": { "economy": 55000, "business": 90000, "first": 130000 } }
        ]},
        "united":            { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000, "first": 95000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000, "first": 105000 } }
        ]},
        "ana":               { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000, "first": 95000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000, "first": 105000 } }
        ]},
        "singapore-airlines":{ "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000, "first": 95000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000, "first": 105000 } }
        ]},
        "eva-air":           { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000 } }
        ]},
        "thai-airways":      { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000 } }
        ]},
        "asiana":            { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000 } }
        ]},
        "air-china":         { "bands": [
          { "max_miles": 6000,  "cabin": { "economy": 35000, "business": 75000 } },
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000 } }
        ]},
        "air-new-zealand":   { "bands": [
          { "max_miles": 10000, "cabin": { "economy": 45000, "business": 75000 } },
          { "max_miles": 22000, "cabin": { "economy": 55000, "business": 90000 } }
        ]}
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'aeroplan';

commit;
