-- Sponsor logo for sweepstakes cards (nominative fair use: the sponsor's own
-- mark to identify who's running the giveaway). Derived from the program text
-- (AAdvantage -> aa.com, Hilton -> hilton.com, etc.) as a favicon.
alter table sweepstakes add column if not exists image_url text;
