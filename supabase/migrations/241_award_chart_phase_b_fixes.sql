-- 241_award_chart_phase_b_fixes.sql
-- Phase B: chart authoring fixes from the audit.
--
--   #4  Move BA Avios chart from british-airways (carrier) to ba-avios (currency)
--       and NULL the british-airways slot. JAL stays on its current slug (correct).
--   #9  BA Avios bands 4-9 for AA partner — previously only bands 1-3 authored,
--       so JFK-HNL (~5000mi) and JFK-LHR (~3500mi) fell back to stored.
--   #2  Flying Blue (air-france / klm): add `delta` partner per SkyTeam JV
--   #11 BA Avios stored rows mistagged us-long — un-tag them
--   #19 Avianca LifeMiles: broaden Star partner coverage on us-japan / us-se-asia /
--       us-pacific to ALL Star carriers (not just ANA) per verified prose
--   #12 JetBlue chart: add bilateral partners (etihad / qatar / cape-air / china-airlines /
--       united via Blue Sky)
--   #7  Avianca LifeMiles Hawaii over-quote: remove us-long from United partner
--       (LifeMiles charges Hawaii at higher zone rate, not the mainland 6,500)
--
-- Authored: 2026-05-12

begin;

-- ─── #4: Move BA Avios chart from british-airways → ba-avios ───────────

-- Step 1: copy the chart to ba-avios with bands extended (#9)
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
        "economy":  { "us-eu-east": 175, "us-eu-west": 200 },
        "business": { "us-eu-east": 550, "us-eu-west": 600 }
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
            { "max_miles": 5500, "peak": { "economy": 32500, "business": 77500  }, "off_peak": { "economy": 25750, "business": 62500 } },
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
            { "max_miles": 650,   "peak": { "economy": 7500   }, "off_peak": { "economy": 7500   } },
            { "max_miles": 1150,  "peak": { "economy": 10000  }, "off_peak": { "economy": 10000  } },
            { "max_miles": 2000,  "peak": { "economy": 15000  }, "off_peak": { "economy": 15000  } },
            { "max_miles": 3000,  "peak": { "economy": 22000, "business": 56500  }, "off_peak": { "economy": 17000, "business": 47000 } },
            { "max_miles": 4000,  "peak": { "economy": 26000, "business": 62500  }, "off_peak": { "economy": 21000, "business": 50000 } },
            { "max_miles": 5500,  "peak": { "economy": 32500, "business": 77500  }, "off_peak": { "economy": 25750, "business": 62500 } },
            { "max_miles": 7000,  "peak": { "economy": 50000, "business": 110000 }, "off_peak": { "economy": 40000, "business": 90000 } }
          ]
        },
        "jal": {
          "bands": [
            { "max_miles": 5500, "peak": { "economy": 32500, "business": 77500  }, "off_peak": { "economy": 25750, "business": 62500 } },
            { "max_miles": 7000, "peak": { "economy": 50000, "business": 110000 }, "off_peak": { "economy": 40000, "business": 90000 } }
          ]
        },
        "aer-lingus": {
          "bands": [
            { "max_miles": 2000, "peak": { "economy": 13000, "business": 38500 }, "off_peak": { "economy": 11000, "business": 32000 } },
            { "max_miles": 4000, "peak": { "economy": 26000, "business": 62500 }, "off_peak": { "economy": 21000, "business": 50000 } }
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
where slug = 'ba-avios';

-- Step 2: NULL the old chart on british-airways (carrier row shouldn't carry the currency chart)
update programs
set award_chart_structured = null
where slug = 'british-airways';

-- ─── #2: Flying Blue add Delta partner ─────────────────────────────────

-- Replace air-france chart with version that includes delta partner
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
        },
        "delta": {
          "ranges_by_bucket": {
            "us-short":   { "economy": { "p10": 5000,  "p50": 10000, "p90": 20000 } },
            "us-medium":  { "economy": { "p10": 8000,  "p50": 15000, "p90": 30000 } },
            "us-long":    { "economy": { "p10": 12500, "p50": 25000, "p90": 50000 },
                            "business":{ "p10": 30000, "p50": 60000, "p90": 120000 } },
            "us-eu-east": { "economy": { "p10": 25000, "p50": 35000, "p90": 50000 },
                            "business":{ "p10": 60000, "p50": 80000, "p90": 100000 } },
            "us-eu-west": { "economy": { "p10": 25000, "p50": 35000, "p90": 50000 },
                            "business":{ "p10": 60000, "p50": 80000, "p90": 100000 } }
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
        },
        "delta": {
          "ranges_by_bucket": {
            "us-short":   { "economy": { "p10": 5000,  "p50": 10000, "p90": 20000 } },
            "us-medium":  { "economy": { "p10": 8000,  "p50": 15000, "p90": 30000 } },
            "us-long":    { "economy": { "p10": 12500, "p50": 25000, "p90": 50000 } },
            "us-eu-east": { "economy": { "p10": 25000, "p50": 35000, "p90": 50000 },
                            "business":{ "p10": 60000, "p50": 80000, "p90": 100000 } },
            "us-eu-west": { "economy": { "p10": 25000, "p50": 35000, "p90": 50000 },
                            "business":{ "p10": 60000, "p50": 80000, "p90": 100000 } }
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

-- ─── #11: Un-tag BA Avios stored rows that have us-long but shouldn't ──
-- BA distance bands 3-4 (1151-2000 / 2001-3000 mi) shouldn't be tagged
-- us-long (which is 2500+ mi). Bands 5+ are the right home for us-long.
-- Strip us-long from any row whose region_or_route says band 3 or 4.

update partner_redemptions
set route_buckets = array_remove(route_buckets, 'us-long')
where currency_program_id in (select id from programs where slug in ('ba-avios', 'british-airways', 'iberia', 'aer-lingus'))
  and route_buckets && array['us-long']::text[]
  and (region_or_route ilike '%band 3%' or region_or_route ilike '%band 4%');

-- ─── #19: Avianca LifeMiles broader Star partner coverage ──────────────

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
            "us-eu-east": { "economy": 30000, "business": 65000, "first": 125000 },
            "us-eu-west": { "economy": 30000, "business": 65000, "first": 125000 },
            "us-japan":   { "economy": 40000, "business": 75000, "first": 120000 },
            "us-se-asia": { "economy": 40000, "business": 75000, "first": 120000 },
            "us-pacific": { "economy": 45000, "business": 80000, "first": 120000 }
          }
        },
        "avianca": {
          "matrix": {
            "us-samerica": { "economy": 20000, "business": 45000 },
            "us-short":  { "economy": 6500,  "business": 12500 },
            "us-medium": { "economy": 6500,  "business": 12500 }
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
            "us-eu-east": { "economy": 30000, "business": 65000 },
            "us-me-india":{ "economy": 35000, "business": 75000 }
          }
        },
        "ana": {
          "matrix": {
            "us-japan":   { "economy": 40000, "business": 75000, "first": 120000 }
          }
        },
        "asiana": {
          "matrix": {
            "us-japan":   { "economy": 40000, "business": 75000, "first": 120000 }
          }
        },
        "eva-air": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000 }
          }
        },
        "thai": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000 }
          }
        },
        "krisflyer": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000, "first": 120000 }
          }
        },
        "air-china": {
          "matrix": {
            "us-se-asia": { "economy": 40000, "business": 75000 }
          }
        },
        "air-new-zealand": {
          "matrix": {
            "us-pacific": { "economy": 45000, "business": 80000 }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'avianca';

-- ─── #12: JetBlue partner carriers ─────────────────────────────────────

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
        },
        "united": {
          "ranges_by_bucket": {
            "us-short":  { "economy": { "p10": 5000,  "p50": 12500, "p90": 25000 } },
            "us-medium": { "economy": { "p10": 8000,  "p50": 15000, "p90": 30000 } },
            "us-long":   { "economy": { "p10": 15000, "p50": 25000, "p90": 50000 } }
          }
        },
        "etihad": {
          "ranges_by_bucket": {
            "us-me-india":{ "economy": { "p10": 60000, "p50": 85000, "p90": 130000 } }
          }
        },
        "qatar": {
          "ranges_by_bucket": {
            "us-me-india":{ "economy": { "p10": 60000, "p50": 85000, "p90": 130000 } }
          }
        }
      },
      "overrides": []
    }
  ]
}
$json$::jsonb
where slug = 'jetblue';

commit;
