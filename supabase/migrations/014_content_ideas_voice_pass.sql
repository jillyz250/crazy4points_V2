-- Ship 10d — voice check needs pass/fail distinct from "was it checked."
-- voice_pass=null means not yet checked; true means on-brand; false means off-brand.

alter table content_ideas
  add column if not exists voice_pass boolean;
