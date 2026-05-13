-- Track whether an extraction used Firecrawl's interactive mode (actions to
-- expand accordions / click "Show more" buttons). Audit trail so we can
-- compare extraction quality with vs. without interactive mode and know
-- which cards routinely need it.

alter table credit_card_extractions
  add column if not exists used_interactive boolean not null default false;

comment on column credit_card_extractions.used_interactive is
  'TRUE when the Firecrawl scrape included an actions array (typically EXPAND_EVERYTHING_ACTIONS) to interact with the page before extracting markdown. Used for JS-heavy issuer pages where benefits are hidden behind accordions. Audit signal — if certain issuers need this every time, surface in admin.';
