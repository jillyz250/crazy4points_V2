/**
 * Registry: content_type → system prompt body.
 *
 * Adding a new content type:
 *   1. Drop a .ts file alongside this one (e.g. interview.ts) exporting
 *      a const string.
 *   2. Add one entry below.
 *   3. Add the value to lib/admin/contentTaxonomy.ts CONTENT_TYPES.
 *   No DB migration. No prompt-routing edits anywhere else.
 */
import type { ContentType } from '@/lib/admin/contentTaxonomy'
import { SWEET_SPOT_PROMPT } from './sweet_spot'
import { DESTINATION_PLAY_PROMPT } from './destination_play'
import { CARD_PLAY_PROMPT } from './card_play'
import { HOW_TO_PROMPT } from './how_to'
import { NEWS_PROMPT } from './news'
import { OPINION_PROMPT } from './opinion'
import { REVIEW_PROMPT } from './review'
import { ROUNDUP_PROMPT } from './roundup'
import { CASE_STUDY_PROMPT } from './case_study'

export const CONTENT_TYPE_PROMPTS: Record<ContentType, string> = {
  sweet_spot: SWEET_SPOT_PROMPT,
  destination_play: DESTINATION_PLAY_PROMPT,
  card_play: CARD_PLAY_PROMPT,
  how_to: HOW_TO_PROMPT,
  news: NEWS_PROMPT,
  opinion: OPINION_PROMPT,
  review: REVIEW_PROMPT,
  roundup: ROUNDUP_PROMPT,
  case_study: CASE_STUDY_PROMPT,
}
