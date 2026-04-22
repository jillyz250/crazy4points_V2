-- Ship 10e — originality pass/fail distinct from "was it checked",
-- matching the voice_pass convention.

alter table content_ideas
  add column if not exists originality_pass boolean;
