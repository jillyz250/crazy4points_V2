-- Normalize sun_country slug to kebab-case per feedback_program_slug_convention.
-- Same shape as mig 119 (air_france / flying_blue) and mig 102 (marriott_bonvoy).
-- No external references in programs.parent_program_slug, member_programs JSONB,
-- or content_ideas - this is a pure rename.

update programs set slug = 'sun-country' where slug = 'sun_country';
