-- Give the Big Story its own headline, independent of the email subject line.
-- Previously renderBigStory reused slots.subject as the article headline, so
-- editing the subject changed the article title (and vice versa). Editors want
-- to set them separately.
alter table newsletters add column if not exists big_story_title text;
