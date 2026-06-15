'use server'

/**
 * Phase 4.5 PR B — social variant generation server actions.
 *
 * generateSocialVariantsAction(topicId): fires all 4 generators (FB / IG /
 * LinkedIn / X) in parallel from one verified topic. All 4 variants land
 * with the same generation_group_id (uuid) so the bundle's narrative spine
 * is preserved on per-platform regenerate.
 *
 * regenerateSocialVariantAction(variantId): re-runs ONE platform's
 * generator, passing the other 3 in the bundle as sibling context so the
 * regen stays aligned with the group's framing (SV8).
 *
 * Preconditions (SV9): the parent topic must be `published`. Generating
 * before publish is blocked at the server-action level because it removes
 * the editorial gravity (humans skip alert review for the social copy/paste
 * shortcut otherwise).
 */
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { generateFacebook } from '@/utils/ai/variants/generateFacebook'
import { generateInstagram } from '@/utils/ai/variants/generateInstagram'
import { generateLinkedIn } from '@/utils/ai/variants/generateLinkedIn'
import { generateX } from '@/utils/ai/variants/generateX'
import { writeSocialVariant, type SocialFormat } from '@/utils/content/writeSocialVariant'
import type { GenerateSocialVariantArgs } from '@/utils/ai/variants/generateSocialVariant'

const SOCIAL_FORMATS: SocialFormat[] = ['facebook', 'instagram', 'linkedin', 'x']

interface TopicForSocial {
  id: string
  title: string
  summary: string | null
  fact_ledger: unknown
  primary_intent: string | null
  programs: string[]
  metadata: Record<string, unknown> | null
  status: string
}

async function loadTopic(supabase: SupabaseClient, topicId: string): Promise<TopicForSocial | null> {
  const { data } = await supabase
    .from('topics')
    .select('id, title, summary, fact_ledger, primary_intent, programs, metadata, status')
    .eq('id', topicId)
    .maybeSingle()
  return (data as TopicForSocial | null) ?? null
}

export async function generateSocialVariantsAction(
  topicId: string,
  /** Subset of platforms to generate. Omit/empty = all 4. Per-platform
   * generation is ~25% the cost of generating all 4 (each platform = one
   * Sonnet call ≈ $0.013). */
  platforms?: SocialFormat[],
): Promise<{ ok: true; group_id: string; variants: { format: SocialFormat; variant_id: string }[] } | { ok: false; error: string }> {
  await assertAdmin()
  const supabase = createAdminClient()
  const topic = await loadTopic(supabase, topicId)
  if (!topic) return { ok: false, error: 'topic not found' }

  // SV9 — only generate when the topic has at least one PUBLISHED variant.
  // Topic.status uses {draft|active|archived}, so "active" is the live state
  // — but we check the variant level explicitly so socials never generate
  // for a topic whose alert is still in needs_review/draft.
  const { count: publishedAlertCount } = await supabase
    .from('content_variants')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topic.id)
    .eq('format', 'alert')
    .eq('status', 'published')
  if (!publishedAlertCount || publishedAlertCount === 0) {
    return {
      ok: false,
      error: `topic has no published alert variant (topic.status=${topic.status}). Publish the alert first.`,
    }
  }

  const groupId = randomUUID()
  const baseArgs: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'> = {
    topic: {
      id: topic.id,
      title: topic.title,
      summary: topic.summary,
      fact_ledger: topic.fact_ledger,
      primary_intent: topic.primary_intent,
      programs: topic.programs ?? [],
      metadata: topic.metadata,
    },
  }

  // Subset filter — omit/empty = all 4
  const requested = platforms && platforms.length > 0
    ? SOCIAL_FORMATS.filter((p) => platforms.includes(p))
    : SOCIAL_FORMATS

  const GENERATORS: Record<SocialFormat, (a: typeof baseArgs) => Promise<{ body: string; hashtags: string[]; char_count: number }>> = {
    facebook: generateFacebook,
    instagram: generateInstagram,
    linkedin: generateLinkedIn,
    x: generateX,
  }

  try {
    const generated = await Promise.all(requested.map(async (fmt) => {
      const res = await GENERATORS[fmt](baseArgs)
      return { fmt, ...res }
    }))

    const persisted = await Promise.all(generated.map((g) =>
      writeSocialVariant(supabase, {
        topic_id: topic.id,
        format: g.fmt,
        body: g.body,
        hashtags: g.hashtags,
        char_count: g.char_count,
        generation_group_id: groupId,
      }),
    ))

    revalidatePath('/admin/drafts')
    return {
      ok: true,
      group_id: groupId,
      variants: generated.map((g, i) => ({ format: g.fmt, variant_id: persisted[i].variant_id })),
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function regenerateSocialVariantAction(
  variantId: string,
): Promise<{ ok: true; variant_id: string; format: SocialFormat } | { ok: false; error: string }> {
  await assertAdmin()
  const supabase = createAdminClient()

  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, format, topic_id, generation_group_id')
    .eq('id', variantId)
    .maybeSingle()
  if (!variant) return { ok: false, error: 'variant not found' }
  if (!SOCIAL_FORMATS.includes(variant.format as SocialFormat)) {
    return { ok: false, error: `variant format=${variant.format} is not a social platform` }
  }

  const topic = await loadTopic(supabase, variant.topic_id as string)
  if (!topic) return { ok: false, error: 'topic not found' }
  // SV9 — alert must be published. Topic.status uses {draft|active|archived},
  // so check the alert variant directly.
  const { count: publishedAlertCount } = await supabase
    .from('content_variants')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topic.id)
    .eq('format', 'alert')
    .eq('status', 'published')
  if (!publishedAlertCount || publishedAlertCount === 0) {
    return { ok: false, error: `topic has no published alert variant (topic.status=${topic.status})` }
  }

  // Load sibling variants from the same generation group — they're the
  // "narrative spine" that the regenerated variant must stay aligned with.
  const siblings: Array<{ platform: SocialFormat; body: string }> = []
  if (variant.generation_group_id) {
    const { data: sibs } = await supabase
      .from('content_variants')
      .select('format, body')
      .eq('generation_group_id', variant.generation_group_id)
      .neq('id', variantId)
    for (const s of sibs ?? []) {
      if (SOCIAL_FORMATS.includes(s.format as SocialFormat) && s.body) {
        siblings.push({ platform: s.format as SocialFormat, body: s.body as string })
      }
    }
  }

  const baseArgs = {
    topic: {
      id: topic.id,
      title: topic.title,
      summary: topic.summary,
      fact_ledger: topic.fact_ledger,
      primary_intent: topic.primary_intent,
      programs: topic.programs ?? [],
      metadata: topic.metadata,
    },
    siblings,
  }

  try {
    const fmt = variant.format as SocialFormat
    const gen = fmt === 'facebook' ? generateFacebook
      : fmt === 'instagram' ? generateInstagram
      : fmt === 'linkedin' ? generateLinkedIn
      : generateX
    const result = await gen(baseArgs)

    // Reuse the same generation_group_id — preserves spine across regenerate.
    const groupId = (variant.generation_group_id as string) ?? randomUUID()
    await writeSocialVariant(supabase, {
      topic_id: topic.id,
      format: fmt,
      body: result.body,
      hashtags: result.hashtags,
      char_count: result.char_count,
      generation_group_id: groupId,
    })

    revalidatePath('/admin/drafts')
    return { ok: true, variant_id: variantId, format: fmt }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Close the editorial loop on a social variant: editor has manually posted
 * the copy to the platform. Flips status → 'published' + records posted_at
 * (and optional post_url) in metadata so we have an audit trail of what
 * shipped where.
 *
 * Per SV10 — never auto-posts. This action is the bookkeeping that
 * acknowledges a human already did the post.
 */
export async function markSocialVariantPostedAction(
  variantId: string,
  postUrl?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin()
  const supabase = createAdminClient()
  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, format, metadata')
    .eq('id', variantId)
    .maybeSingle()
  if (!variant) return { ok: false, error: 'variant not found' }
  if (!SOCIAL_FORMATS.includes(variant.format as SocialFormat)) {
    return { ok: false, error: `variant format=${variant.format} is not a social platform` }
  }

  const nowIso = new Date().toISOString()
  const newMetadata = {
    ...(variant.metadata as Record<string, unknown> ?? {}),
    posted_at: nowIso,
    ...(postUrl && postUrl.trim() ? { post_url: postUrl.trim() } : {}),
  }
  const { error } = await supabase
    .from('content_variants')
    .update({ status: 'published', published_at: nowIso, metadata: newMetadata })
    .eq('id', variantId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/drafts')
  return { ok: true }
}
