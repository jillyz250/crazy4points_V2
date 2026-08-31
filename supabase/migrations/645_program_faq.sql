-- Program-page FAQ: an authored, verified Q&A array per program, rendered on
-- /programs/[slug] and emitted as FAQPage JSON-LD for AI answer-extraction and
-- search rich results. Shape: [{ "q": "...", "a": "..." }, ...]. Genuine,
-- program-specific questions only (drawn from the program's verified facts) —
-- never templated filler. Null / empty array = no FAQ section rendered.
alter table programs add column if not exists faq jsonb;
