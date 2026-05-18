-- Track cards that are grandfathered (still serviced for existing
-- cardholders but no longer issued to new applicants — e.g. Chase
-- Marriott Bonvoy Premier). When true the public card page:
--   1. Hides the "Apply at <issuer>" CTA
--   2. Renders a banner at the top: "Closed to new applicants — Chase
--      no longer issues this card. Existing cardholders see their
--      current benefits below."
-- The row stays so existing cardholders can still find benefit details
-- via search.

alter table credit_cards
  add column if not exists closed_to_new_applicants boolean not null default false;

comment on column credit_cards.closed_to_new_applicants is
  'When true, the card is grandfathered — Chase/Amex/etc. continues to service existing cardholders but does not accept new applications. Public card page hides Apply CTA and shows a closed-to-new-applicants banner.';
