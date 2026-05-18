/**
 * Social mark-as-shared publishers (Content System Rehaul PR 4).
 *
 * Facebook / Twitter / Instagram / LinkedIn / Threads variants don't push to
 * a public route. The editor manually pastes into each platform, then comes
 * back here and clicks Publish — optionally pasting the URL of the live
 * social post for later reference.
 *
 * Auto-posting via platform APIs is deferred to Phase 3.
 */

import type { PublishContext, PublishResult, UnpublishContext } from './shared'

export async function publishSocial(ctx: PublishContext): Promise<PublishResult> {
  const supplied = (ctx.publishTargetUrl ?? '').trim()
  return { publishTargetUrl: supplied || null }
}

// Symmetric for completeness — no-op since publish itself is a no-op aside
// from variant row updates. Caller will clear publish_target_url + flip
// variant status back to 'approved'.
export async function unpublishSocial(_ctx: UnpublishContext): Promise<void> {
  // intentionally empty
}
