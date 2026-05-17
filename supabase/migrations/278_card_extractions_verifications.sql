-- Add verifications column to credit_card_extractions.
--
-- Mirror of program_extractions.verifications (migration 273). Stores the
-- output of the auto-verify pipeline: Sonnet reads the extracted
-- CardExtraction JSON + raw_markdown and returns a per-field verdict
-- (confirmed / corrected / unverifiable) plus a corrected version of any
-- fields that changed.
--
-- Shape:
--   {
--     "verdict": "confirmed" | "corrected" | "unverifiable",
--     "notes": "<one-paragraph narrative for the editor>",
--     "field_verdicts": {
--       "annual_fee_usd": { "verdict": "confirmed", "extracted": 550, "corrected": 550, "source_says": "$550 annual fee" },
--       "welcome_bonus.main.bonus_amount": { "verdict": "corrected", "extracted": 60000, "corrected": 75000, "source_says": "Earn 75,000 bonus points after $4,000 in 3 months" },
--       ...
--     },
--     "corrected_extraction": { ... full CardExtraction with verified facts ... },
--     "generated_at": "2026-05-17T..."
--   }

alter table credit_card_extractions
  add column if not exists verifications jsonb not null default '{}'::jsonb;

comment on column credit_card_extractions.verifications is
  'Auto-verify output. Sonnet reconciles the extracted CardExtraction JSON against raw_markdown and returns per-field verdicts + a corrected_extraction object. Editor reviews verdicts in admin and applies corrected values.';
