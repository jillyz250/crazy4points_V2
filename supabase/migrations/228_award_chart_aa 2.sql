-- 228_award_chart_aa.sql
-- Award Chart Rebuild Phase 2 batch 1 — AA AAdvantage.
--
-- Inserts the structured award chart for slug = 'aa' into
-- programs.award_chart_structured. Source TS: lib/awardCharts/aa.ts.
-- Two charts modeled: Saver (zone) + AAnytime (dynamic).
--
-- Confidence: MED. Saver rates reflect AA's published chart as of late 2024;
-- AAnytime ranges based on aggregated community-observed pricing. Verify
-- in admin preview before relying on them in Hub surfaces.
--
-- Idempotent: re-running updates the row in place.
--
-- Authored: 2026-05-11

begin;

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
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "british-airways":    { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 },
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "qantas":             { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 },
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "cathay-pacific":     { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 },
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "jal":                { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 },
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "finnair":            { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-japan":   { "economy": 35000, "business": 60000, "first": 80000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 }
        }},
        "qatar-airways":      { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 },
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-africa":  { "economy": 40000, "business": 75000, "first": 120000 }
        }},
        "royal-jordanian":    { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-me-india":{ "economy": 35000, "business": 70000, "first": 115000 }
        }},
        "malaysia-airlines":  { "matrix": {
          "us-se-asia": { "economy": 35000, "business": 70000, "first": 110000 },
          "us-pacific": { "economy": 40000, "business": 80000, "first": 110000 }
        }},
        "iberia":             { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-eu-west": { "economy": 30000, "business": 57500, "first": 85000 },
          "us-samerica":{ "economy": 30000, "business": 57500, "first": 85000 }
        }},
        "royal-air-maroc":    { "matrix": {
          "us-eu-east": { "economy": 30000, "business": 57500 },
          "us-africa":  { "economy": 40000, "business": 75000 }
        }},
        "alaska":             { "matrix": {
          "us-short":   { "economy": 7500,  "business": 17500, "first": 25000 },
          "us-medium":  { "economy": 12500, "business": 25000, "first": 50000 },
          "us-long":    { "economy": 12500, "business": 25000, "first": 50000 }
        }},
        "gol-linhas-aereas":  { "matrix": {
          "us-samerica":{ "economy": 30000, "business": 57500 }
        }}
      },
      "overrides": []
    },
    {
      "type": "dynamic",
      "label": "AAdvantage AAnytime",
      "partners": {
        "aa": {
          "ranges_by_bucket": {
            "us-short":    { "economy": { "p10": 12500, "p50": 25000,  "p90": 45000 } },
            "us-medium":   { "economy": { "p10": 17500, "p50": 35000,  "p90": 60000 } },
            "us-long":     { "economy": { "p10": 25000, "p50": 50000,  "p90": 90000 },
                             "business":{ "p10": 50000, "p50": 100000, "p90": 180000 } },
            "us-eu-east":  { "economy": { "p10": 60000, "p50": 110000, "p90": 180000 },
                             "business":{ "p10": 130000,"p50": 220000, "p90": 350000 } },
            "us-eu-west":  { "economy": { "p10": 60000, "p50": 110000, "p90": 180000 } },
            "us-me-india": { "economy": { "p10": 75000, "p50": 135000, "p90": 225000 } },
            "us-japan":    { "economy": { "p10": 70000, "p50": 125000, "p90": 200000 } },
            "us-se-asia":  { "economy": { "p10": 75000, "p50": 140000, "p90": 220000 } },
            "us-pacific":  { "economy": { "p10": 80000, "p50": 150000, "p90": 240000 } },
            "us-samerica": { "economy": { "p10": 55000, "p50": 100000, "p90": 160000 } },
            "us-africa":   { "economy": { "p10": 85000, "p50": 155000, "p90": 250000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'aa';

commit;
