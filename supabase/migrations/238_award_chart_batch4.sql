-- 238_award_chart_batch4.sql
-- Award Chart Rebuild Phase 2 batch 4 — Dynamic + SkyTeam + Pacific.
--
-- Per feedback_use_verified_prose_first.md.
-- Partner keys verified against programs.slug.
--
-- Coverage:
--   - delta            AUTHORED  dynamic per-bucket ranges
--   - air-france       AUTHORED  dynamic (Flying Blue, shared with KLM)
--   - klm              AUTHORED  dynamic (same chart as air-france)
--   - virgin-atlantic  AUTHORED  multi-chart (VS dynamic + ANA partner + Delta partner)
--   - qantas           AUTHORED  distance, full 10-zone chart for QF+JQ+FJ+AA+EK
--   - finnair          AUTHORED  partial zone chart (verified cells only)
--
-- Authored: 2026-05-11

begin;

-- ─── Delta SkyMiles ────────────────────────────────────────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "Delta SkyMiles (fully dynamic)",
      "partners": {
        "delta": {
          "ranges_by_bucket": {
            "us-short":    { "economy":  { "p10": 5000,   "p50": 12500,  "p90": 30000  },
                             "business": { "p10": 25000,  "p50": 50000,  "p90": 100000 } },
            "us-medium":   { "economy":  { "p10": 8000,   "p50": 22500,  "p90": 45000  },
                             "business": { "p10": 35000,  "p50": 80000,  "p90": 150000 } },
            "us-long":     { "economy":  { "p10": 12000,  "p50": 30000,  "p90": 50000  },
                             "business": { "p10": 50000,  "p50": 100000, "p90": 200000 } },
            "us-eu-east":  { "economy":  { "p10": 30000,  "p50": 75000,  "p90": 150000 },
                             "business": { "p10": 75000,  "p50": 200000, "p90": 450000 } },
            "us-eu-west":  { "economy":  { "p10": 30000,  "p50": 75000,  "p90": 150000 },
                             "business": { "p10": 75000,  "p50": 200000, "p90": 450000 } },
            "us-japan":    { "economy":  { "p10": 50000,  "p50": 100000, "p90": 200000 },
                             "business": { "p10": 100000, "p50": 250000, "p90": 600000 } },
            "us-se-asia":  { "economy":  { "p10": 50000,  "p50": 110000, "p90": 200000 },
                             "business": { "p10": 100000, "p50": 275000, "p90": 600000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'delta';

-- ─── Air France (Flying Blue, joint with KLM) ──────────────────────────
-- Dynamic; prose has examples only. Use ranges from prose.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "Flying Blue (AF metal, dynamic)",
      "partners": {
        "air-france": {
          "ranges_by_bucket": {
            "us-eu-east":  { "economy":  { "p10": 25000, "p50": 35000, "p90": 50000  },
                             "premium_economy": { "p10": 40000, "p50": 55000, "p90": 70000 },
                             "business": { "p10": 60000, "p50": 80000, "p90": 100000 },
                             "first":    { "p10": 180000, "p50": 220000, "p90": 280000 } },
            "us-eu-west":  { "economy":  { "p10": 25000, "p50": 35000, "p90": 50000  },
                             "business": { "p10": 60000, "p50": 80000, "p90": 100000 } }
          }
        }
      },
      "overrides": [
        { "from": "JFK", "to": "CDG", "bidirectional": true, "cabin": "business", "miles": 50000, "note": "Flying Blue Promo Reward (rotating; verify on flyingblue.com)" },
        { "from": "JFK", "to": "CDG", "bidirectional": true, "cabin": "economy",  "miles": 20000, "note": "Flying Blue Promo Reward economy" }
      ]
    }
  ]
}
$json$::jsonb
where slug = 'air-france';

-- ─── KLM (Flying Blue, joint with AF) ─────────────────────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "Flying Blue (KLM metal, dynamic)",
      "partners": {
        "klm": {
          "ranges_by_bucket": {
            "us-eu-east":  { "economy":  { "p10": 25000, "p50": 35000, "p90": 50000  },
                             "premium_economy": { "p10": 40000, "p50": 55000, "p90": 70000 },
                             "business": { "p10": 60000, "p50": 80000, "p90": 100000 } },
            "us-eu-west":  { "economy":  { "p10": 25000, "p50": 35000, "p90": 50000  },
                             "business": { "p10": 60000, "p50": 80000, "p90": 100000 } }
          }
        }
      },
      "overrides": [
        { "from": "JFK", "to": "AMS", "bidirectional": true, "cabin": "business", "miles": 50000, "note": "Flying Blue Promo Reward (rotating)" },
        { "from": "JFK", "to": "AMS", "bidirectional": true, "cabin": "economy",  "miles": 20000, "note": "Flying Blue Promo Reward economy" }
      ]
    }
  ]
}
$json$::jsonb
where slug = 'klm';

-- ─── Virgin Atlantic Flying Club ───────────────────────────────────────

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "dynamic",
      "label": "VS-operated (Saver-Peak ranges)",
      "partners": {
        "virgin-atlantic": {
          "ranges_by_bucket": {
            "us-eu-east": { "economy":  { "p10": 6000,  "p50": 12000, "p90": 25000 },
                            "premium_economy": { "p10": 10500, "p50": 22000, "p90": 57500 },
                            "business": { "p10": 29000, "p50": 50000, "p90": 87500 } },
            "us-eu-west": { "economy":  { "p10": 7500,  "p50": 15000, "p90": 30000 },
                            "premium_economy": { "p10": 12500, "p50": 27500, "p90": 65000 },
                            "business": { "p10": 32500, "p50": 60000, "p90": 100000 } },
            "us-medium":  { "economy":  { "p10": 7500,  "p50": 15000, "p90": 30000 },
                            "premium_economy": { "p10": 12500, "p50": 30000, "p90": 60000 } }
          }
        }
      }
    },
    {
      "type": "zone",
      "label": "VS Flying Club — ANA partner chart (fixed, one-way)",
      "partners": {
        "ana": {
          "matrix": {
            "us-japan": { "economy": 32500, "business": 60000, "first": 85000 }
          }
        }
      },
      "overrides": [
        { "from": "HNL", "to": "NRT", "bidirectional": true, "cabin": "economy",  "miles": 22500, "note": "VS-ANA Hawaii rate" },
        { "from": "HNL", "to": "NRT", "bidirectional": true, "cabin": "business", "miles": 37500, "note": "VS-ANA Hawaii rate" },
        { "from": "HNL", "to": "NRT", "bidirectional": true, "cabin": "first",    "miles": 57500, "note": "VS-ANA Hawaii rate" },
        { "from": "LAX", "to": "NRT", "bidirectional": true, "cabin": "economy",  "miles": 30000, "note": "VS-ANA West Coast rate" },
        { "from": "LAX", "to": "NRT", "bidirectional": true, "cabin": "business", "miles": 52500, "note": "VS-ANA West Coast rate" },
        { "from": "LAX", "to": "NRT", "bidirectional": true, "cabin": "first",    "miles": 72500, "note": "VS-ANA West Coast rate" },
        { "from": "SFO", "to": "NRT", "bidirectional": true, "cabin": "economy",  "miles": 30000, "note": "VS-ANA West Coast rate" },
        { "from": "SFO", "to": "NRT", "bidirectional": true, "cabin": "business", "miles": 52500, "note": "VS-ANA West Coast rate" },
        { "from": "SFO", "to": "NRT", "bidirectional": true, "cabin": "first",    "miles": 72500, "note": "VS-ANA West Coast rate" },
        { "from": "SEA", "to": "NRT", "bidirectional": true, "cabin": "business", "miles": 52500, "note": "VS-ANA West Coast rate" }
      ]
    },
    {
      "type": "zone",
      "label": "VS Flying Club — Delta partner chart (fixed, one-way)",
      "partners": {
        "delta": {
          "matrix": {
            "us-short":  { "economy": 7500 },
            "us-medium": { "economy": 12500 },
            "us-long":   { "economy": 12500 },
            "us-eu-east":{ "economy": 25000, "business": 50000 },
            "us-eu-west":{ "economy": 25000, "business": 50000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'virgin-atlantic';

-- ─── Qantas Frequent Flyer ─────────────────────────────────────────────
-- Full 10-zone distance chart, post-August 2025. Applies to QF+JQ+FJ+AA+EK.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance",
      "label": "Qantas Classic Flight Reward (post-Aug 2025)",
      "partners": {
        "qantas": {
          "bands": [
            { "max_miles": 600,   "cabin": { "economy": 9200,  "premium_economy": 14500,  "business": 19300,  "first": 29000  } },
            { "max_miles": 1200,  "cabin": { "economy": 13800, "premium_economy": 21600,  "business": 29000,  "first": 43600  } },
            { "max_miles": 2400,  "cabin": { "economy": 20700, "premium_economy": 32600,  "business": 43600,  "first": 65300  } },
            { "max_miles": 3600,  "cabin": { "economy": 23300, "premium_economy": 50600,  "business": 68400,  "first": 102600 } },
            { "max_miles": 4800,  "cabin": { "economy": 29000, "premium_economy": 61600,  "business": 82100,  "first": 123100 } },
            { "max_miles": 5800,  "cabin": { "economy": 36200, "premium_economy": 73800,  "business": 98400,  "first": 147700 } },
            { "max_miles": 7000,  "cabin": { "economy": 43200, "premium_economy": 85300,  "business": 113900, "first": 170800 } },
            { "max_miles": 8400,  "cabin": { "economy": 48200, "premium_economy": 97600,  "business": 130100, "first": 195400 } },
            { "max_miles": 9600,  "cabin": { "economy": 58900, "premium_economy": 113900, "business": 151800, "first": 227800 } },
            { "max_miles": 22000, "cabin": { "economy": 63500, "premium_economy": 124700, "business": 166300, "first": 249400 } }
          ]
        },
        "aa": {
          "bands": [
            { "max_miles": 600,   "cabin": { "economy": 9200,  "business": 19300 } },
            { "max_miles": 1200,  "cabin": { "economy": 13800, "business": 29000 } },
            { "max_miles": 2400,  "cabin": { "economy": 20700, "business": 43600 } },
            { "max_miles": 3600,  "cabin": { "economy": 23300, "business": 68400 } },
            { "max_miles": 4800,  "cabin": { "economy": 29000, "business": 82100 } },
            { "max_miles": 5800,  "cabin": { "economy": 36200, "business": 98400 } },
            { "max_miles": 7000,  "cabin": { "economy": 43200, "business": 113900 } }
          ]
        },
        "emirates": {
          "bands": [
            { "max_miles": 4800,  "cabin": { "economy": 29000, "business": 82100,  "first": 123100 } },
            { "max_miles": 5800,  "cabin": { "economy": 36200, "business": 98400,  "first": 147700 } },
            { "max_miles": 7000,  "cabin": { "economy": 43200, "business": 113900, "first": 170800 } },
            { "max_miles": 8400,  "cabin": { "economy": 48200, "business": 130100, "first": 195400 } },
            { "max_miles": 9600,  "cabin": { "economy": 58900, "business": 151800, "first": 227800 } },
            { "max_miles": 22000, "cabin": { "economy": 63500, "business": 166300, "first": 249400 } }
          ]
        },
        "fiji-airways": {
          "bands": [
            { "max_miles": 4800,  "cabin": { "economy": 29000, "business": 82100 } },
            { "max_miles": 5800,  "cabin": { "economy": 36200, "business": 98400 } },
            { "max_miles": 7000,  "cabin": { "economy": 43200, "business": 113900 } }
          ]
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'qantas';

-- ─── Finnair Plus ──────────────────────────────────────────────────────
-- Partial chart: prose has 5 example cells. Author what's verified.
-- Finnair Plus is INDEPENDENT of BA Avios per prose.

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "zone",
      "label": "Finnair Plus (AY-metal)",
      "partners": {
        "finnair": {
          "matrix": {
            "us-eu-east": { "business": 62500 },
            "us-eu-west": { "business": 75000 },
            "us-japan":   { "business": 62500 },
            "us-se-asia": { "business": 62500 }
          }
        }
      },
      "overrides": []
    },
    {
      "type": "zone",
      "label": "Finnair Plus — oneworld partners (sparse)",
      "partners": {
        "aa": {
          "matrix": {
            "us-eu-east": { "business": 62500 }
          }
        },
        "jal": {
          "matrix": {
            "us-japan":   { "business": 25000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'finnair';

commit;
