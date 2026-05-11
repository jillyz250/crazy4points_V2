-- 237_award_chart_batch3.sql
-- Award Chart Rebuild Phase 2 batch 3 — Star Alliance zone + Asia Miles.
--
-- Per feedback_use_verified_prose_first.md: numbers come from prose only.
-- Per feedback_chart_partner_slug_must_match.md: partner keys verified
-- against programs.slug.
--
-- Coverage:
--   - turkish        AUTHORED  zone (TK-metal cumulative chart only)
--   - miles-and-more AUTHORED  zone (Star Alliance partner chart only)
--   - cathay         AUTHORED  multi-chart (CX-metal distance + partner distance)
--   - jal            AUTHORED  zone (JAL-metal international only)
--   - krisflyer      NULL      prose has structure but no zone matrix numbers
--
-- Authored: 2026-05-11

begin;

-- ─── Turkish Miles&Smiles ──────────────────────────────────────────────
-- Zone chart for TK-metal cumulative awards. Uses the higher end of the
-- prose ranges (so chart never under-quotes a connection). Direct-to-IST
-- has its own sweet spot but isn't expressible per-route in current schema.
-- Partner chart NOT authored (prose doesn't list bands).

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "TK-operated Promo (cumulative-segment chart)",
      "partners": {
        "turkish": {
          "matrix": {
            "us-eu-east": { "economy": 40000, "business": 70000 },
            "us-eu-west": { "economy": 40000, "business": 70000 },
            "us-me-india":{ "economy": 45000, "business": 78000 },
            "us-africa":  { "economy": 60000, "business": 110000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'turkish';

-- ─── Miles & More ──────────────────────────────────────────────────────
-- Star Alliance partner chart (post-June 2025). LH-Group dynamic NOT authored
-- (no published rates). Bilateral and Star Alliance carriers share the
-- partner chart, so list them all under partners.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "M&M Star Alliance partner chart (post-June 2025)",
      "partners": {
        "united":              { "matrix": {
          "us-medium":  { "economy": 35000, "business": 60000, "first": 80000 },
          "us-long":    { "economy": 45000, "business": 75000, "first": 135000 },
          "us-eu-east": { "economy": 50000, "premium_economy": 85000, "business": 125000, "first": 215000 },
          "us-eu-west": { "economy": 50000, "premium_economy": 85000, "business": 125000, "first": 215000 },
          "us-samerica":{ "economy": 50000, "business": 125000, "first": 215000 },
          "us-japan":   { "economy": 75000, "business": 170000, "first": 260000 },
          "us-se-asia": { "economy": 95000, "business": 215000, "first": 330000 }
        }},
        "lufthansa":           { "matrix": {
          "us-eu-east": { "economy": 50000, "premium_economy": 85000, "business": 125000, "first": 215000 },
          "us-eu-west": { "economy": 50000, "premium_economy": 85000, "business": 125000, "first": 215000 }
        }},
        "swiss":               { "matrix": {
          "us-eu-east": { "economy": 50000, "premium_economy": 85000, "business": 125000, "first": 215000 },
          "us-eu-west": { "economy": 50000, "premium_economy": 85000, "business": 125000 }
        }},
        "austrian":            { "matrix": {
          "us-eu-east": { "economy": 50000, "premium_economy": 85000, "business": 125000 }
        }},
        "ana":                 { "matrix": {
          "us-japan":   { "economy": 75000, "business": 170000, "first": 260000 },
          "us-se-asia": { "economy": 95000, "business": 215000 }
        }},
        "asiana":              { "matrix": {
          "us-japan":   { "economy": 75000, "business": 170000 }
        }},
        "thai":                { "matrix": {
          "us-se-asia": { "economy": 95000, "business": 215000 }
        }},
        "eva-air":             { "matrix": {
          "us-se-asia": { "economy": 95000, "business": 215000 }
        }},
        "turkish":             { "matrix": {
          "us-eu-east": { "economy": 50000, "premium_economy": 85000, "business": 125000 },
          "us-me-india":{ "economy": 50000, "business": 125000 }
        }},
        "tap":                 { "matrix": {
          "us-eu-east": { "economy": 50000, "business": 125000 }
        }},
        "air-canada":          { "matrix": {
          "us-medium":  { "economy": 35000, "business": 60000 },
          "us-long":    { "economy": 35000, "business": 60000 }
        }},
        "avianca":             { "matrix": {
          "us-samerica":{ "economy": 50000, "business": 125000 }
        }},
        "copa":                { "matrix": {
          "us-samerica":{ "economy": 50000, "business": 125000 }
        }}
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'miles-and-more';

-- ─── Cathay Asia Miles ─────────────────────────────────────────────────
-- Multi-chart: CX-metal distance chart (Type 1 rates — most common) +
-- partner distance chart. Type 2 surcharge (Japan/India/Indonesia/Nepal/
-- Sri Lanka/Bangladesh routes) NOT modeled — would slightly under-quote
-- those city pairs in Y by 4k.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "CX-operated Standard Awards (Type 1 — non-Japan/India/etc.)",
      "partners": {
        "cathay": {
          "bands": [
            { "max_miles": 750,   "cabin": { "economy": 7000,  "premium_economy": 11000, "business": 16000 } },
            { "max_miles": 2750,  "cabin": { "economy": 9000,  "premium_economy": 18000, "business": 27000, "first": 43000 } },
            { "max_miles": 5000,  "cabin": { "economy": 20000, "premium_economy": 39000, "business": 60000, "first": 90000 } },
            { "max_miles": 7500,  "cabin": { "economy": 27000, "premium_economy": 52000, "business": 91000, "first": 125000 } },
            { "max_miles": 22000, "cabin": { "economy": 38000, "premium_economy": 78000, "business": 119000, "first": 160000 } }
          ]
        }
      }
    },
    {
      "type": "distance",
      "label": "Asia Miles partner chart (oneworld + non-alliance)",
      "partners": {
        "aa":              { "bands": [
          { "max_miles": 750,   "cabin": { "economy": 10000, "business": 20000 } },
          { "max_miles": 2750,  "cabin": { "economy": 15000, "business": 40000, "first": 57000 } },
          { "max_miles": 5000,  "cabin": { "economy": 25000, "business": 65000, "first": 85000 } },
          { "max_miles": 7500,  "cabin": { "economy": 30000, "business": 90000, "first": 115000 } },
          { "max_miles": 22000, "cabin": { "economy": 42000, "business": 110000, "first": 150000 } }
        ]},
        "british-airways": { "bands": [
          { "max_miles": 750,   "cabin": { "economy": 10000, "business": 20000 } },
          { "max_miles": 2750,  "cabin": { "economy": 15000, "business": 40000 } },
          { "max_miles": 5000,  "cabin": { "economy": 25000, "business": 65000 } },
          { "max_miles": 22000, "cabin": { "economy": 42000, "business": 110000 } }
        ]},
        "qatar":           { "bands": [
          { "max_miles": 2750,  "cabin": { "economy": 15000, "business": 40000 } },
          { "max_miles": 22000, "cabin": { "economy": 42000, "business": 110000 } }
        ]},
        "jal":             { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 25000, "business": 65000, "first": 85000 } },
          { "max_miles": 22000, "cabin": { "economy": 42000, "business": 110000, "first": 150000 } }
        ]},
        "qantas":          { "bands": [
          { "max_miles": 5000,  "cabin": { "economy": 25000, "business": 65000, "first": 85000 } },
          { "max_miles": 22000, "cabin": { "economy": 42000, "business": 110000, "first": 150000 } }
        ]},
        "alaska":          { "bands": [
          { "max_miles": 2750,  "cabin": { "economy": 15000, "business": 40000 } }
        ]}
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'cathay';

-- ─── JAL Mileage Bank ──────────────────────────────────────────────────
-- Zone chart for JAL-metal international (region-pair chart per verified
-- prose, post-June 10 2025). Uses low end of "first" range (most flexible);
-- partner chart NOT authored (prose doesn't list bands).
-- Caveat: us-japan bucket lumps HNL-NRT (cheaper Hawaii rate) with JFK-NRT
-- (full N America rate). Use full N America rate as conservative default.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "JAL international (region-pair, JAL-metal)",
      "partners": {
        "jal": {
          "matrix": {
            "us-japan":   { "economy": 27000, "premium_economy": 40000, "business": 55000, "first": 110000 },
            "us-se-asia": { "economy": 17500, "premium_economy": 25000, "business": 36000, "first": 55000 },
            "us-eu-east": { "economy": 27500, "premium_economy": 40000, "business": 55000, "first": 110000 },
            "us-eu-west": { "economy": 27500, "premium_economy": 40000, "business": 55000, "first": 110000 },
            "us-pacific": { "economy": 20000, "premium_economy": 32000, "business": 42000, "first": 70000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'jal';

-- ─── KrisFlyer — NULL ──────────────────────────────────────────────────
-- Prose describes Saver / Advantage / Access / Spontaneous Escapes structure
-- but doesn't list zone matrix numbers in inline prose (links to PDF).
-- Falls back to verified partner_redemptions costs.

update programs
set award_chart_structured = null
where slug = 'krisflyer';

commit;
