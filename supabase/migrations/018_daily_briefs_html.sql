alter table daily_briefs
  add column if not exists brief_html text;

comment on column daily_briefs.brief_html is 'Rendered HTML of the brief email — lets admin preview a brief in-app without relying on Resend delivery.';
