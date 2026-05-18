/**
 * Shared types for per-variant publish handlers (Content System Rehaul PR 4).
 *
 * Each format-specific publisher is invoked from
 * `publishVariantAction` / `unpublishVariantAction` in
 * app/admin/(protected)/topics/actions.ts.
 *
 * A publisher takes a verified Topic + an approved ContentVariant and applies
 * the format-specific side effect (insert into alerts, blog_posts,
 * content_ideas, or — for social — no-op except for capturing a paste URL).
 *
 * Publishers MUST be idempotent: re-running publish on a row that already
 * exists should upsert, not duplicate. The caller updates the variant row
 * after the publisher succeeds.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentVariant, Topic } from '@/utils/supabase/queries'

export interface PublishContext {
  supabase: SupabaseClient
  topic: Topic
  variant: ContentVariant
  /** Optional editor-supplied URL — used by social formats (manual paste). */
  publishTargetUrl?: string | null
}

export interface PublishResult {
  publishTargetUrl: string | null
}

export interface UnpublishContext {
  supabase: SupabaseClient
  topic: Topic
  variant: ContentVariant
}
