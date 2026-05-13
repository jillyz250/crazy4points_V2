-- 233_award_chart_atmos_fix.sql
-- Fix AA partner short-haul rates in Atmos chart.
-- Original migration 230 had 7,500 Y for AA short-haul (≤700mi); actual
-- legacy Alaska MileagePlan chart prices it at 4,500 Y. User flagged.
--
-- Also tightens medium / long bands to better match the published chart.
--
-- Authored: 2026-05-11

begin;

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "Atmos — Cathay Pacific",
      "partners": {
        "cathay": { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 30000, "premium_economy": 47500, "business": 50000, "first": 70000 } },
          { "max_miles": 12000, "cabin": { "economy": 35000, "premium_economy": 55000, "business": 65000, "first": 75000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — JAL",
      "partners": {
        "jal": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 35000, "premium_economy": 45000, "business": 65000, "first": 75000 } },
          { "max_miles": 12000, "cabin": { "economy": 40000, "premium_economy": 55000, "business": 75000, "first": 95000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Qantas",
      "partners": {
        "qantas": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 40000, "premium_economy": 55000, "business": 55000, "first": 70000 } },
          { "max_miles": 12000, "cabin": { "economy": 50000, "premium_economy": 65000, "business": 70000, "first": 85000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Fiji Airways",
      "partners": {
        "fiji-airways": { "bands": [
          { "max_miles": 7000, "cabin": { "economy": 40000, "business": 55000, "first": 70000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Etihad",
      "partners": {
        "etihad": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 30000, "business": 55000, "first": 75000 } },
          { "max_miles": 12000, "cabin": { "economy": 35000, "business": 65000, "first": 90000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Korean Air",
      "partners": {
        "korean-air": { "bands": [
          { "max_miles": 7000,  "cabin": { "economy": 30000, "business": 60000, "first": 80000 } },
          { "max_miles": 12000, "cabin": { "economy": 35000, "business": 70000, "first": 95000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — British Airways",
      "partners": {
        "british-airways": { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 30000, "business": 50000, "first": 70000 } },
          { "max_miles": 12000, "cabin": { "economy": 40000, "business": 65000, "first": 85000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Iberia",
      "partners": {
        "iberia": { "bands": [
          { "max_miles": 5000, "cabin": { "economy": 30000, "business": 55000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — Aer Lingus",
      "partners": {
        "aer-lingus": { "bands": [
          { "max_miles": 5000, "cabin": { "economy": 25000, "business": 50000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — American Airlines",
      "partners": {
        "aa": { "bands": [
          { "max_miles": 700,  "cabin": { "economy": 4500,  "business": 25000 } },
          { "max_miles": 2100, "cabin": { "economy": 12500, "business": 25000, "first": 50000 } },
          { "max_miles": 6000, "cabin": { "economy": 17500, "business": 30000, "first": 60000 } }
        ]}
      }
    },
    {
      "type": "distance",
      "label": "Atmos — own metal",
      "partners": {
        "alaska": { "bands": [
          { "max_miles": 700,  "cabin": { "economy": 5000,  "business": 15000 } },
          { "max_miles": 2100, "cabin": { "economy": 12500, "business": 25000 } },
          { "max_miles": 6000, "cabin": { "economy": 25000, "business": 45000 } }
        ]},
        "hawaiian": { "bands": [
          { "max_miles": 700,  "cabin": { "economy": 5000,  "business": 15000 } },
          { "max_miles": 6000, "cabin": { "economy": 22500, "business": 45000 } }
        ]}
      }
    }
  ]
}
$json$::jsonb
where slug = 'atmos';

commit;
