# Scraper selector configs

Per-program JSON configs that tell the generic runner
(`scripts/run-scraper.mjs`) how to scrape and parse each program's promo
or chart page.

One config per scraper-task. A program may have multiple configs
(e.g. `flying-blue-promo-rewards.json` + `flying-blue-transfer-bonus.json`).

## Schema

```jsonc
{
  // Unique slug for this scraper task. Becomes scrape_runs.scraper_slug.
  "slug": "flying-blue-promo-rewards",

  // Program slug (must match a programs.slug row).
  "program_slug": "flying-blue",

  // The page to scrape.
  "source_url": "https://www.flyingblue.com/en/spend/flights/rewards",

  // Default intel_type when the enrichment classifier can't refine further.
  // One of: monthly_promo, transfer_bonus, award_sale, flash_sale,
  // partner_discount, status_fast_track, chart_change, partner_change
  "default_intel_type": "monthly_promo",

  // Firecrawl request options (passed through to /v1/scrape).
  "firecrawl_options": {
    "waitFor": 4000,
    "onlyMainContent": true,
    "actions": [
      { "type": "wait", "milliseconds": 3000 }
    ]
  },

  // Extraction strategy. Phase 0 supports "schema" only.
  "extraction_strategy": "schema",

  // JSON Schema describing the shape Firecrawl should extract.
  "schema": {
    "type": "object",
    "properties": {
      "promos": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "carrier": { "type": "string" },
            "origin_label": { "type": "string" },
            "dest_label": { "type": "string" },
            "cabin": { "type": "string" },
            "points_required": { "type": "integer" }
          }
        }
      }
    }
  },

  // Maps Firecrawl's extracted shape onto our ParsedPromoRow fields.
  // Each key is a target field on ParsedPromoRow; each value is a
  // dot-path into the Firecrawl response.
  "field_mapping": {
    "promo_label": "promo_label",
    "origin_label": "origin_label",
    "dest_label": "dest_label",
    "cabin": "cabin",
    "points_required": "points_required"
  },

  // Path to the array of rows in the Firecrawl response. Each item in
  // the array becomes one promo_rewards row.
  "items_path": "promos"
}
```

## Authoring a new scraper

1. Open the target page in a browser. Confirm the data renders.
2. Decide what the rows are (each promo, each chart cell, etc.).
3. Sketch the JSON schema for one row.
4. Save as `lib/scrapers/<program-slug>-<task>.json`.
5. Test: `node scripts/run-scraper.mjs --slug=<slug> --dry-run`
6. Inspect the parsed output. Adjust schema + field_mapping.
7. Test again. When stable, drop `--dry-run` to persist.
8. Add to Vercel Cron once verified.
