/**
 * Blog publisher (Content System Rehaul PR 4).
 *
 * Upserts a row into blog_posts (migration 300). The public /blog/<slug>
 * route checks blog_posts first, then falls back to the legacy content_ideas
 * table for older blog content.
 */

import type { PublishContext, PublishResult, UnpublishContext } from './shared'

function readStr(metadata: Record<string, unknown>, key: string): string | null {
  const raw = metadata[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

export async function publishBlog(ctx: PublishContext): Promise<PublishResult> {
  const { supabase, topic, variant } = ctx
  const metadata = (variant.metadata ?? {}) as Record<string, unknown>

  const row = {
    slug: topic.slug,
    topic_id: topic.id,
    title: variant.title ?? topic.title,
    lede: readStr(metadata, 'lede'),
    body_markdown: variant.body ?? '',
    meta_description: readStr(metadata, 'meta_description'),
    hero_image_alt: readStr(metadata, 'hero_image_alt'),
    status: 'published' as const,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('blog_posts')
    .upsert(row, { onConflict: 'slug' })
  if (error) throw new Error(`Blog upsert failed: ${error.message}`)

  return { publishTargetUrl: `/blog/${topic.slug}` }
}

export async function unpublishBlog(ctx: UnpublishContext): Promise<void> {
  const { supabase, topic } = ctx
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'draft', published_at: null, updated_at: new Date().toISOString() })
    .eq('slug', topic.slug)
  if (error) throw new Error(`Blog unpublish failed: ${error.message}`)
}
