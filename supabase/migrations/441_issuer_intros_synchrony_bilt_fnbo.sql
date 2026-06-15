-- Add the Synchrony issuer intro and refresh two intros made stale by today's
-- issuer changes (Bilt left Wells Fargo for Cardless; Sun Country left FNBO for
-- Synchrony). Issuer intros render on /issuers/[slug] and feed the page meta
-- description. ASCII-only.

update issuers set
  intro = 'Synchrony is a major U.S. issuer of retail and co-brand credit cards. For travel it issues the Sun Country Visa Signature, which it took over from First National Bank of Omaha in late 2025. Rewards are co-brand points tied to the partner''s loyalty program.',
  last_verified = current_date, updated_at = now()
where slug = 'synchrony';

update issuers set
  intro = 'Bilt issues the Bilt Card 2.0 lineup - Blue, Obsidian, and Palladium - through Cardless and Column N.A. (it left Wells Fargo in early 2026). Cards earn transferable Bilt Points on rent, mortgage, and everyday spend, plus 4% Bilt Cash; points transfer 1:1 to airline and hotel partners.',
  last_verified = current_date, updated_at = now()
where slug = 'bilt';

update issuers set
  intro = 'FNBO (First National Bank of Omaha) issues a small set of U.S. co-brand cards. It previously issued the Sun Country Airlines Visa, which moved to Synchrony in 2025; FNBO coverage here is mainly for historical completeness.',
  last_verified = current_date, updated_at = now()
where slug = 'fnbo';
