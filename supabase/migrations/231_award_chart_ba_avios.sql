-- 231_award_chart_ba_avios.sql
-- Award Chart Rebuild Phase 2 batch 1 — British Airways Executive Club (Avios).
--
-- Inserts the structured chart for slug='british-airways'. This is the
-- pilot's reference shape — distance_plus_modifiers with peak/off-peak
-- calendar, RFS caps, partner-specific bands (BA / Qatar / Iberia / AA / JAL),
-- and route overrides for the famous Iberia off-peak unicorns.
--
-- Confidence: HIGH on BA own-metal bands; MED on Iberia/Qatar specifics.
--
-- Authored: 2026-05-11

begin;

update programs
set award_chart_structured = $json$
{
  "charts": [
    {
      "type": "distance_plus_modifiers",
      "label": "BA Avios — Reward Flights",
      "peak_calendar": [
        { "start": "2026-04-03", "end": "2026-04-18" },
        { "start": "2026-05-22", "end": "2026-09-01" },
        { "start": "2026-12-15", "end": "2027-01-05" },
        { "start": "2027-04-02", "end": "2027-04-17" },
        { "start": "2027-05-22", "end": "2027-09-01" }
      ],
      "rfs_caps": {
        "economy":  { "intra-europe": 50,  "us-eu-east": 175, "us-eu-west": 200 },
        "business": { "intra-europe": 175, "us-eu-east": 550, "us-eu-west": 600 }
      },
      "partners": {
        "british-airways": {
          "bands": [
            { "max_miles": 650,  "peak": { "economy": 7750,  "business": 18000  }, "off_peak": { "economy": 6000,  "business": 13500 } },
            { "max_miles": 1150, "peak": { "economy": 10500, "business": 25000  }, "off_peak": { "economy": 8500,  "business": 20000 } },
            { "max_miles": 2000, "peak": { "economy": 13000, "business": 38500  }, "off_peak": { "economy": 11000, "business": 32000 } },
            { "max_miles": 3000, "peak": { "economy": 22000, "business": 56500,  "first": 87000  }, "off_peak": { "economy": 17000, "business": 47000, "first": 72500 } },
            { "max_miles": 4000, "peak": { "economy": 26000, "business": 62500,  "first": 100000 }, "off_peak": { "economy": 21000, "business": 50000, "first": 85000 } },
            { "max_miles": 5500, "peak": { "economy": 32500, "business": 77500,  "first": 125000 }, "off_peak": { "economy": 25750, "business": 62500, "first": 100000 } },
            { "max_miles": 6500, "peak": { "economy": 39000, "business": 95000,  "first": 156000 }, "off_peak": { "economy": 32500, "business": 77500, "first": 125000 } },
            { "max_miles": 7000, "peak": { "economy": 50000, "business": 110000, "first": 175000 }, "off_peak": { "economy": 40000, "business": 90000, "first": 145000 } }
          ]
        },
        "qatar": {
          "bands": [
            { "max_miles": 2000, "peak": { "economy": 13000, "business": 38500  }, "off_peak": { "economy": 11000, "business": 32000 } },
            { "max_miles": 4000, "peak": { "economy": 26000, "business": 62500  }, "off_peak": { "economy": 21000, "business": 50000 } },
            { "max_miles": 7000, "peak": { "economy": 50000, "business": 110000 }, "off_peak": { "economy": 40000, "business": 90000 } }
          ]
        },
        "iberia": {
          "bands": [
            { "max_miles": 650,  "peak": { "economy": 7750,  "business": 18000  }, "off_peak": { "economy": 4500,  "business": 10000 } },
            { "max_miles": 2000, "peak": { "economy": 13000, "business": 38500  }, "off_peak": { "economy": 9000,  "business": 27000 } },
            { "max_miles": 4000, "peak": { "economy": 26000, "business": 62500  }, "off_peak": { "economy": 17000, "business": 34000 } },
            { "max_miles": 7000, "peak": { "economy": 50000, "business": 110000 }, "off_peak": { "economy": 34000, "business": 68000 } }
          ]
        },
        "aa": {
          "bands": [
            { "max_miles": 500,  "peak": { "economy": 7500  }, "off_peak": { "economy": 7500  } },
            { "max_miles": 1000, "peak": { "economy": 10000 }, "off_peak": { "economy": 10000 } },
            { "max_miles": 2000, "peak": { "economy": 15000 }, "off_peak": { "economy": 15000 } }
          ]
        },
        "jal": {
          "bands": [
            { "max_miles": 5500, "peak": { "economy": 32500, "business": 77500  }, "off_peak": { "economy": 25750, "business": 62500 } },
            { "max_miles": 7000, "peak": { "economy": 50000, "business": 110000 }, "off_peak": { "economy": 40000, "business": 90000 } }
          ]
        }
      },
      "overrides": [
        { "from": "MAD", "to": "JFK", "bidirectional": true, "cabin": "business", "season": "off_peak", "miles": 34000, "note": "Iberia Plus off-peak MAD-JFK — classic Avios sweet spot" },
        { "from": "BCN", "to": "JFK", "bidirectional": true, "cabin": "business", "season": "off_peak", "miles": 34000, "note": "Iberia off-peak BCN-JFK" }
      ]
    }
  ]
}
$json$::jsonb
where slug = 'british-airways';

commit;
