/**
 * Publish dispatch table (Content System Rehaul PR 4).
 *
 * Maps `VariantFormat` → the right publish / unpublish handler. The server
 * action layer is the only caller — see
 * app/admin/(protected)/topics/actions.ts.
 */

import type { VariantFormat } from '@/utils/supabase/queries'
import type { PublishContext, PublishResult, UnpublishContext } from './shared'
import { publishAlert, unpublishAlert } from './alert'
import { publishBlog, unpublishBlog } from './blog'
import { publishNewsletter, unpublishNewsletter } from './newsletter'
import { publishSocial, unpublishSocial } from './social'

export async function publishByFormat(
  format: VariantFormat,
  ctx: PublishContext,
): Promise<PublishResult> {
  switch (format) {
    case 'alert':
      return publishAlert(ctx)
    case 'blog':
      return publishBlog(ctx)
    case 'newsletter':
      return publishNewsletter(ctx)
    case 'facebook':
    case 'twitter':
    case 'instagram':
    case 'linkedin':
    case 'threads':
      return publishSocial(ctx)
  }
}

export async function unpublishByFormat(
  format: VariantFormat,
  ctx: UnpublishContext,
): Promise<void> {
  switch (format) {
    case 'alert':
      return unpublishAlert(ctx)
    case 'blog':
      return unpublishBlog(ctx)
    case 'newsletter':
      return unpublishNewsletter(ctx)
    case 'facebook':
    case 'twitter':
    case 'instagram':
    case 'linkedin':
    case 'threads':
      return unpublishSocial(ctx)
  }
}

export type { PublishContext, PublishResult, UnpublishContext } from './shared'
