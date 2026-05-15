-- Multi-source extraction support.
--
-- Some programs (especially alliances) split their content across multiple
-- pages: oneworld's tier benefits live at /travel-benefits, lounges at
-- /airport-lounges, RTW at /round-the-world, history at /about. A single
-- URL extraction misses 75% of the editorial value.
--
-- Solution: per-program list of additional URLs that all get scraped and
-- concatenated before being passed to Sonnet. extraction_source_url remains
-- the canonical primary; additional_source_urls is an array of supplemental
-- pages to merge in.

alter table programs
  add column if not exists additional_source_urls text[];

comment on column programs.additional_source_urls is
  'Supplemental URLs scraped alongside extraction_source_url. All get pulled by Firecrawl in parallel; combined markdown is passed to Sonnet as one source. Useful for programs that split content across multiple pages (alliances especially: tier benefits, lounges, history, RTW each on their own page).';
